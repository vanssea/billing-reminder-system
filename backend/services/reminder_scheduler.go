package services

import (
	"context"
	"fmt"
	"log"
	"strings"
)

// reminderAdvisoryLockID adalah ID lock PostgreSQL yang dipakai untuk
// memastikan hanya satu runner reminder (scheduler in-process ATAU cron worker)
// yang berjalan pada satu waktu, sehingga tidak ada pengiriman ganda.
const reminderAdvisoryLockID = 72420101

// tryAcquireReminderLock mencoba mengambil advisory lock tanpa memblokir.
// Mengembalikan true beserta fungsi release jika lock berhasil didapatkan.
// Aman dipanggil dari scheduler in-process maupun cmd/reminderworker.
func (s *ReminderService) tryAcquireReminderLock(ctx context.Context) (release func(), ok bool) {
	conn, err := s.DB.Acquire(ctx)
	if err != nil {
		log.Printf("Gagal ambil koneksi untuk lock reminder: %v", err)
		return nil, false
	}
	var locked bool
	if err := conn.QueryRow(ctx, "SELECT pg_try_advisory_lock($1)", reminderAdvisoryLockID).Scan(&locked); err != nil {
		conn.Release()
		log.Printf("Gagal mengunci reminder lock: %v", err)
		return nil, false
	}
	if !locked {
		conn.Release()
		return nil, false
	}
	return func() {
		conn.Exec(ctx, "SELECT pg_advisory_unlock($1)", reminderAdvisoryLockID)
		conn.Release()
	}, true
}

// RunReminderCycle menjalankan satu siklus reminder + proses overdue.
// Dipanggil oleh cmd/reminderworker (cron) saat OS menjalankannya.
// Jika ada runner lain yang memegang lock, siklus ini dilewati dan mengembalikan
// (false, nil) agar tidak terjadi pengiriman ganda.
func (s *ReminderService) RunReminderCycle(ctx context.Context) (bool, error) {
	release, ok := s.tryAcquireReminderLock(ctx)
	if !ok {
		return false, nil
	}
	defer release()

	s.processDueReminders(ctx)
	s.processOverdueInvoices(ctx)
	return true, nil
}

// processDueReminders memproses seluruh reminder yang sudah waktunya dikirim.
// Tipe reminder yang dinonaktifkan di pengaturan tidak diikutsertakan tanpa
// menghapus record-nya (history tetap ada; cukup di-filter di query).
func (s *ReminderService) processDueReminders(ctx context.Context) {
	settings := getReminderSettings(ctx, s.DB)
	emailEnabled := true
	if settings.EmailEnabled != nil {
		emailEnabled = *settings.EmailEnabled
	}
	reminders, err := s.getDueReminders(ctx, settings.EnabledTypes, emailEnabled)
	if err != nil {
		log.Println("Gagal mengambil reminder yang jatuh tempo:", err)
		return
	}
	log.Printf("Reminder cycle: %d reminder jatuh tempo ditemukan.", len(reminders))

	for _, r := range reminders {
		if err := s.processReminder(ctx, r, emailEnabled); err != nil {
			log.Printf("Gagal memproses reminder %s: %v", r.ID, err)
		}
	}
}

// dueReminderRow adalah baris reminder yang siap diproses.
type dueReminderRow struct {
	ID           string
	InvoiceID    string
	Phone        string
	Email        string
	ReminderType string
}

// getDueReminders mengambil reminder PENDING yang sudah jatuh tempo.
// enabledTypes adalah daftar tipe reminder yang aktif di pengaturan; tipe yang
// tidak ada di daftar tidak pernah dipilih (tanpa mengubah record).
// Jika emailEnabled false, client tanpa email tetap dipilih (hanya WA).
func (s *ReminderService) getDueReminders(ctx context.Context, enabledTypes []string, emailEnabled bool) ([]dueReminderRow, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT
			r.id,
			r.invoice_id,
			COALESCE(c.phone, ''),
			COALESCE(c.email, ''),
			r.reminder_type
		FROM reminders r
		INNER JOIN invoices i ON i.id = r.invoice_id
		INNER JOIN clients c ON c.id = i.client_id
WHERE r.status = 'PENDING'
		  AND r.scheduled_at <= NOW()
		  AND r.sent_at IS NULL
		  AND i.status IN ('SENT', 'UNPAID')
		  AND r.reminder_type != ''
		  AND r.reminder_type = ANY($1)
		  AND c.phone IS NOT NULL AND c.phone != ''
		  AND ($2::boolean IS FALSE OR (c.email IS NOT NULL AND c.email != ''))
ORDER BY r.scheduled_at ASC
		LIMIT 50
	`, enabledTypes, emailEnabled)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []dueReminderRow
	for rows.Next() {
		var r dueReminderRow
		if err := rows.Scan(&r.ID, &r.InvoiceID, &r.Phone, &r.Email, &r.ReminderType); err != nil {
			return nil, err
		}
		results = append(results, r)
	}
	return results, rows.Err()
}

// processReminder mengirim satu reminder via WhatsApp dan (bila emailEnabled)
// Email. Jika emailEnabled false, cukup WhatsApp yang wajib sukses.
func (s *ReminderService) processReminder(ctx context.Context, r dueReminderRow, emailEnabled bool) error {
	hasWhatsApp := s.WhatsApp != nil && s.WhatsApp.IsConnected()

	if !hasWhatsApp {
		return fmt.Errorf("WhatsApp belum tersedia")
	}
	if emailEnabled && s.Email == nil {
		return fmt.Errorf("Email belum tersedia")
	}
	if strings.TrimSpace(r.Phone) == "" {
		return fmt.Errorf("client tidak memiliki nomor telepon")
	}
	if emailEnabled && strings.TrimSpace(r.Email) == "" {
		return fmt.Errorf("client tidak memiliki alamat email")
	}

	fail := func(err error) error {
		_, updateErr := s.DB.Exec(ctx, `
			UPDATE reminders
			SET status = 'FAILED', error_message = $2
			WHERE id = $1
		`, r.ID, err.Error())
		if updateErr != nil {
			return fmt.Errorf("%v (gagal update status: %v)", err, updateErr)
		}
		go NotifyReminderFailed(s.DB, r.ID)
		return err
	}

	inv, err := getInvoiceData(ctx, s.DB, r.InvoiceID)
	if err != nil {
		return fail(fmt.Errorf("gagal ambil data invoice: %v", err))
	}

	if inv.Status == "PAID" || inv.Status == "CANCELLED" {
		_, uerr := s.DB.Exec(ctx, `
			UPDATE reminders
			SET status = 'SKIPPED'
			WHERE id = $1 AND sent_at IS NULL AND status IN ('PENDING', 'FAILED')
		`, r.ID)
		if uerr != nil {
			return fmt.Errorf("invoice %s tetapi gagal menandai reminder SKIPPED: %v", inv.Status, uerr)
		}
		log.Printf("Reminder %s (%s) dilewati: invoice berstatus %s", inv.InvoiceNumber, r.ID, inv.Status)
		return nil
	}

	message := buildReminderMessage(inv)

	var errs []string

	// 1. Kirim via WhatsApp
	if r.ReminderType == "H-1" {
		pdfBytes, err := s.PDF.RenderInvoicePDF(inv)
		if err != nil {
			// PDF adalah bagian wajib pengiriman H-1: kegagalan tidak boleh
			// dianggap sukses, dicatat agar status reminder menjadi FAILED.
			errs = append(errs, fmt.Sprintf("PDF: %v", err))
		} else {
			fileName := "Invoice-" + strings.ReplaceAll(inv.InvoiceNumber, "/", "-") + ".pdf"
			if err := s.WhatsApp.SendDocument(r.Phone, fileName, pdfBytes); err != nil {
				errs = append(errs, fmt.Sprintf("PDF WhatsApp: %v", err))
			} else {
				log.Printf("Reminder H-1: PDF WA terkirim ke %s", r.Phone)
			}
		}
	}

	if err := s.WhatsApp.Send(r.Phone, message); err != nil {
		log.Printf("Reminder WhatsApp gagal untuk %s: %v", inv.InvoiceNumber, err)
		errs = append(errs, fmt.Sprintf("WhatsApp: %v", err))
	} else {
		log.Printf("Reminder %s (%s) WhatsApp terkirim ke %s", inv.InvoiceNumber, r.ID, r.Phone)
	}

	// 2. Kirim via Email (hanya jika email diaktifkan di pengaturan)
	if emailEnabled {
		if err := s.Email.SendReminderEmail(
			r.Email,
			inv.ClientCompany,
			inv.InvoiceNumber,
			formatTanggalIndo(inv.DueDate),
			formatRupiah(inv.Total),
			inv.Status,
			r.ReminderType,
		); err != nil {
			log.Printf("Reminder email gagal untuk %s: %v", inv.InvoiceNumber, err)
			errs = append(errs, fmt.Sprintf("Email: %v", err))
		} else {
			log.Printf("Reminder %s (%s) email terkirim ke %s", inv.InvoiceNumber, r.ID, r.Email)
		}
	} else {
		log.Printf("Reminder %s (%s) email dilewati (email_enabled=false)", inv.InvoiceNumber, r.ID)
	}

	// 3. Jika channel yang wajib gagal, seluruh reminder dianggap gagal
	if len(errs) > 0 {
		return fail(fmt.Errorf("pengiriman tidak lengkap: %s", strings.Join(errs, "; ")))
	}

	// 4. Semua channel wajib sukses - tandai terkirim.
	if _, err := s.DB.Exec(ctx, `
		UPDATE reminders
		SET status = 'SENT', sent_at = NOW(), error_message = NULL
		WHERE id = $1
	`, r.ID); err != nil {
		return fmt.Errorf("pesan terkirim tapi update status gagal: %v", err)
	}

	if emailEnabled {
		log.Printf("Reminder %s (%s) terkirim ke WA:%s dan Email:%s", inv.InvoiceNumber, r.ID, r.Phone, r.Email)
	} else {
		log.Printf("Reminder %s (%s) terkirim ke WA:%s (email dinonaktifkan)", inv.InvoiceNumber, r.ID, r.Phone)
	}
	return nil
}

// buildReminderMessage menyusun isi pesan pengingat WhatsApp.
func buildReminderMessage(inv *InvoiceData) string {
	pic := strings.TrimSpace(inv.ClientPIC)
	var sapaan string
	if pic != "" {
		sapaan = fmt.Sprintf("Halo, Bapak/Ibu *%s* dari *%s*.", pic, inv.ClientCompany)
	} else {
		sapaan = fmt.Sprintf("Halo, *%s*.", inv.ClientCompany)
	}

	return fmt.Sprintf(`🔔 *Pengingat Pembayaran Invoice*

%s

Kami ingin mengingatkan bahwa invoice berikut:

📄 Invoice: *%s*
💰 Total: *Rp %s*
📅 Jatuh Tempo: *%s*

Saat ini invoice tersebut masih memiliki status *%s*.

Mohon melakukan pembayaran sebelum tanggal jatuh tempo.

Jika pembayaran sudah dilakukan, silakan abaikan pesan ini.

Terima kasih.
*Billing Reminder*`,
		sapaan,
		inv.InvoiceNumber,
		formatRupiah(inv.Total),
		formatTanggalIndo(inv.DueDate),
		inv.Status,
	)
}
