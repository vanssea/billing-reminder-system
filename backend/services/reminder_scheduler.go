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
	if s.WhatsApp == nil {
		log.Println("Reminder scheduler aktif tetapi WhatsApp belum tersedia.")
		return
	}

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
func (s *ReminderService) processDueReminders(ctx context.Context) {
	reminders, err := s.getDueReminders(ctx)
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
	ID         string
	InvoiceID  string
	Phone      string
	ReminderType string
}

// getDueReminders mengambil reminder PENDING yang sudah jatuh tempo.
func (s *ReminderService) getDueReminders(ctx context.Context) ([]dueReminderRow, error) {
	rows, err := s.DB.Query(ctx, `
		SELECT
			r.id,
			r.invoice_id,
			c.phone,
			r.reminder_type
		FROM reminders r
		INNER JOIN invoices i ON i.id = r.invoice_id
		INNER JOIN clients c ON c.id = i.client_id
WHERE r.status = 'PENDING'
		  AND r.scheduled_at <= NOW()
		  AND r.sent_at IS NULL
		  AND c.phone IS NOT NULL
		  AND i.status IN ('SENT', 'UNPAID')
		  AND r.reminder_type != ''
ORDER BY r.scheduled_at ASC
		LIMIT 50
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []dueReminderRow
	for rows.Next() {
		var r dueReminderRow
		if err := rows.Scan(&r.ID, &r.InvoiceID, &r.Phone, &r.ReminderType); err != nil {
			return nil, err
		}
		results = append(results, r)
	}
	return results, rows.Err()
}

// processReminder mengirim satu reminder (pesan teks)
// lalu memperbarui statusnya.
func (s *ReminderService) processReminder(ctx context.Context, r dueReminderRow) error {
	if s.WhatsApp == nil {
		return fmt.Errorf("WhatsApp belum tersedia")
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

	if r.ReminderType == "H-1" {
		// Kirim PDF untuk reminder H-1 saja
		pdfBytes, err := s.PDF.RenderInvoicePDF(inv)
		if err == nil {
			fileName := "Invoice-" + strings.ReplaceAll(inv.InvoiceNumber, "/", "-") + ".pdf"
			if err := s.WhatsApp.SendDocument(r.Phone, fileName, pdfBytes); err != nil {
				log.Printf("Reminder H-1: kirim PDF gagal: %v", err)
			} else {
				log.Printf("Reminder H-1: PDF terkirim ke %s", r.Phone)
			}
		} else {
			log.Printf("Reminder H-1: gagal generate PDF: %v", err)
		}
	}

	if err := s.WhatsApp.Send(r.Phone, message); err != nil {
		return fail(fmt.Errorf("kirim teks gagal: %v", err))
	}

	// 2. Sukses - tandai terkirim.
	if _, err := s.DB.Exec(ctx, `
		UPDATE reminders
		SET status = 'SENT', sent_at = NOW(), error_message = NULL
		WHERE id = $1
	`, r.ID); err != nil {
		return fmt.Errorf("pesan terkirim tapi update status gagal: %v", err)
	}

	log.Printf("Reminder %s (%s) terkirim ke %s", inv.InvoiceNumber, r.ID, r.Phone)
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
