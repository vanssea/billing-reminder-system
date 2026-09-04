package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"
)

// reminderSchedulerInterval adalah jarak waktu pemeriksaan reminder
// yang sudah jatuh tempo.
const reminderSchedulerInterval = 60 * time.Second

// StartReminderScheduler menjalankan loop background yang memproses
// reminder PENDING yang sudah jatuh tempo setiap 1 menit.
func (s *ReminderService) StartReminderScheduler(ctx context.Context) {
	if s.WhatsApp == nil && s.Email == nil {
		log.Println("Reminder scheduler aktif tetapi WhatsApp dan Email belum tersedia.")
		return
	}

	channels := []string{}
	if s.WhatsApp != nil {
		channels = append(channels, "WhatsApp")
	}
	if s.Email != nil {
		channels = append(channels, "Email")
	}
	log.Printf("Reminder scheduler aktif via: %s", strings.Join(channels, " + "))

	ticker := time.NewTicker(reminderSchedulerInterval)
	defer ticker.Stop()

	// Jalankan langsung sekali saat start, lalu ulangi tiap interval.
	s.processDueReminders(ctx)
	s.processOverdueInvoices(ctx)
	for {
		select {
		case <-ctx.Done():
			log.Println("Reminder scheduler berhenti.")
			return
		case <-ticker.C:
			s.processDueReminders(ctx)
			s.processOverdueInvoices(ctx)
		}
	}
}

// processDueReminders memproses seluruh reminder yang sudah waktunya dikirim.
// Tipe reminder yang dinonaktifkan di pengaturan tidak diikutsertakan tanpa
// menghapus record-nya (history tetap ada; cukup di-filter di query).
func (s *ReminderService) processDueReminders(ctx context.Context) {
	settings := getReminderSettings(ctx, s.DB)
	reminders, err := s.getDueReminders(ctx, settings.EnabledTypes)
	if err != nil {
		log.Println("Gagal mengambil reminder yang jatuh tempo:", err)
		return
	}

	for _, r := range reminders {
		if err := s.processReminder(ctx, r); err != nil {
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
func (s *ReminderService) getDueReminders(ctx context.Context, enabledTypes []string) ([]dueReminderRow, error) {
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
		  AND (c.phone IS NOT NULL AND c.phone != '' AND c.email IS NOT NULL AND c.email != '')
ORDER BY r.scheduled_at ASC
		LIMIT 50
	`, enabledTypes)
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

// processReminder mengirim satu reminder via WhatsApp DAN Email.
// Kedua channel wajib sukses; jika salah satu gagal, reminder di-mark FAILED.
func (s *ReminderService) processReminder(ctx context.Context, r dueReminderRow) error {
	hasWhatsApp := s.WhatsApp != nil && s.WhatsApp.IsConnected()
	hasEmail := s.Email != nil

	if !hasWhatsApp {
		return fmt.Errorf("WhatsApp belum tersedia")
	}
	if !hasEmail {
		return fmt.Errorf("Email belum tersedia")
	}
	if strings.TrimSpace(r.Phone) == "" {
		return fmt.Errorf("client tidak memiliki nomor telepon")
	}
	if strings.TrimSpace(r.Email) == "" {
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
		if err == nil {
			fileName := "Invoice-" + strings.ReplaceAll(inv.InvoiceNumber, "/", "-") + ".pdf"
			if err := s.WhatsApp.SendDocument(r.Phone, fileName, pdfBytes); err != nil {
				log.Printf("Reminder H-1: kirim PDF WA gagal: %v", err)
			} else {
				log.Printf("Reminder H-1: PDF WA terkirim ke %s", r.Phone)
			}
		} else {
			log.Printf("Reminder H-1: gagal generate PDF: %v", err)
		}
	}

	if err := s.WhatsApp.Send(r.Phone, message); err != nil {
		log.Printf("Reminder WhatsApp gagal untuk %s: %v", inv.InvoiceNumber, err)
		errs = append(errs, fmt.Sprintf("WhatsApp: %v", err))
	} else {
		log.Printf("Reminder %s (%s) WhatsApp terkirim ke %s", inv.InvoiceNumber, r.ID, r.Phone)
	}

	// 2. Kirim via Email
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

	// 3. Jika salah satu channel gagal, seluruh reminder dianggap gagal
	if len(errs) > 0 {
		return fail(fmt.Errorf("pengiriman tidak lengkap: %s", strings.Join(errs, "; ")))
	}

	// 4. Kedua channel sukses - tandai terkirim.
	if _, err := s.DB.Exec(ctx, `
		UPDATE reminders
		SET status = 'SENT', sent_at = NOW(), error_message = NULL
		WHERE id = $1
	`, r.ID); err != nil {
		return fmt.Errorf("pesan terkirim tapi update status gagal: %v", err)
	}

	log.Printf("Reminder %s (%s) terkirim ke WA:%s dan Email:%s", inv.InvoiceNumber, r.ID, r.Phone, r.Email)
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
