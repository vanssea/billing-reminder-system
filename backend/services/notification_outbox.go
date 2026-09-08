package services

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Tipe notifikasi WA yang dijadwalkan lewat tabel notification_outbox.
const (
	outboxInvoiceCreated  = "INVOICE_CREATED"
	outboxPaymentApproved = "PAYMENT_APPROVED"
	outboxPaymentRejected = "PAYMENT_REJECTED"
)

// outboxMaxAttempts membatasi percobaan pengiriman WA pada antrian outbox.
const outboxMaxAttempts = 3

// EnqueueInvoiceCreatedWA menaruh job WA "Tagihan Baru" ke antrian outbox and
// mengembalikan error jika pemasukan antrian gagal.
func EnqueueInvoiceCreatedWA(db *pgxpool.Pool, invoiceID string) error {
	if strings.TrimSpace(invoiceID) == "" {
		return nil
	}
	if _, err := db.Exec(context.Background(), `
		INSERT INTO notification_outbox (notif_type, invoice_id)
		VALUES ($1, $2)
	`, outboxInvoiceCreated, invoiceID); err != nil {
		log.Printf("Gagal memasukkan outbox WA invoice baru %s: %v", invoiceID, err)
		return err
	}
	return nil
}

// EnqueuePaymentApprovedWA menaruh job WA konfirmasi pembayaran disetujui.
func EnqueuePaymentApprovedWA(db *pgxpool.Pool, paymentID string) {
	if strings.TrimSpace(paymentID) == "" {
		return
	}
	if _, err := db.Exec(context.Background(), `
		INSERT INTO notification_outbox (notif_type, payment_id)
		VALUES ($1, $2)
	`, outboxPaymentApproved, paymentID); err != nil {
		log.Printf("Gagal memasukkan outbox WA pembayaran disetujui %s: %v", paymentID, err)
	}
}

// EnqueuePaymentRejectedWA menaruh job WA konfirmasi pembayaran ditolak,
// termasuk alasan penolakan.
func EnqueuePaymentRejectedWA(db *pgxpool.Pool, paymentID, reason string) {
	if strings.TrimSpace(paymentID) == "" {
		return
	}
	if _, err := db.Exec(context.Background(), `
		INSERT INTO notification_outbox (notif_type, payment_id, reason)
		VALUES ($1, $2, $3)
	`, outboxPaymentRejected, paymentID, reason); err != nil {
		log.Printf("Gagal memasukkan outbox WA pembayaran ditolak %s: %v", paymentID, err)
	}
}

// outboxRow adalah baris antrian WA yang siap diproses.
type outboxRow struct {
	ID        string
	NotifType string
	InvoiceID string
	PaymentID string
	Reason    string
}

// ProcessOutbox mengirim seluruh antrian notifikasi WA (invoice baru, konfirmasi
// pembayaran) yang berstatus PENDING. Dipanggil reminderworker.exe setelah
// RunReminderCycle. Setiap baris diperbarui dengan guard status agar tidak ada
// pengiriman ganda meski dua worker tumpang tindih.
func (s *ReminderService) ProcessOutbox(ctx context.Context) {
	if s.WhatsApp == nil || !s.WhatsApp.IsConnected() {
		return
	}

	rows, err := s.DB.Query(ctx, `
		SELECT id, notif_type, COALESCE(invoice_id, ''), COALESCE(payment_id, ''), COALESCE(reason, '')
		FROM notification_outbox
		WHERE status = 'PENDING'
		ORDER BY created_at
		LIMIT 50
	`)
	if err != nil {
		log.Println("Gagal membaca antrian outbox:", err)
		return
	}

	var pending []outboxRow
	for rows.Next() {
		var r outboxRow
		if err := rows.Scan(&r.ID, &r.NotifType, &r.InvoiceID, &r.PaymentID, &r.Reason); err != nil {
			log.Println("Gagal membaca baris outbox:", err)
			continue
		}
		pending = append(pending, r)
	}
	rows.Close()
	if err := rows.Err(); err != nil {
		log.Println("Gagal membaca antrian outbox:", err)
		return
	}

	log.Printf("Outbox processing: %d antrian PENDING ditemukan.", len(pending))
	if len(pending) == 0 {
		return
	}

	sent := 0
	failed := 0
	for _, r := range pending {
		if err := s.deliverOutbox(ctx, r); err != nil {
			failed++
			log.Printf("Outbox %s (%s) gagal: %v", r.NotifType, r.ID, err)
			_, _ = s.DB.Exec(ctx, `
				UPDATE notification_outbox
				SET attempts = attempts + 1, error_message = $2,
				    status = CASE WHEN attempts + 1 >= $3 THEN 'FAILED' ELSE status END
				WHERE id = $1
			`, r.ID, err.Error(), outboxMaxAttempts)
			continue
		}

		tag, err := s.DB.Exec(ctx, `
			UPDATE notification_outbox
			SET status = 'SENT', sent_at = NOW(), error_message = NULL
			WHERE id = $1 AND status = 'PENDING'
		`, r.ID)
		if err != nil {
			log.Printf("Gagal menandai outbox %s sebagai SENT: %v", r.ID, err)
			continue
		}
		if tag.RowsAffected() == 1 {
			sent++
		} else {
			log.Printf("Outbox %s sudah diproses proses lain; dilewati.", r.ID)
		}
	}

	log.Printf("Outbox selesai: %d terkirim, %d gagal.", sent, failed)
}

// deliverOutbox memilih pengirim sesuai tipe notifikasi.
func (s *ReminderService) deliverOutbox(ctx context.Context, r outboxRow) error {
	switch r.NotifType {
	case outboxInvoiceCreated:
		return s.deliverInvoiceCreatedWA(ctx, r.InvoiceID)
	case outboxPaymentApproved:
		return s.deliverPaymentApprovedWA(ctx, r.PaymentID)
	case outboxPaymentRejected:
		return s.deliverPaymentRejectedWA(ctx, r.PaymentID, r.Reason)
	default:
		return fmt.Errorf("tipe notifikasi tidak dikenal: %s", r.NotifType)
	}
}

// deliverInvoiceCreatedWA mengirim teks "Tagihan Baru" + PDF invoice via WA.
func (s *ReminderService) deliverInvoiceCreatedWA(ctx context.Context, invoiceID string) error {
	if s.PDF == nil {
		return fmt.Errorf("PDF service tidak tersedia")
	}

	inv, err := getInvoiceData(ctx, s.DB, invoiceID)
	if err != nil {
		return fmt.Errorf("gagal ambil data invoice: %v", err)
	}
	if strings.TrimSpace(inv.ClientPhone) == "" {
		return fmt.Errorf("client tidak memiliki nomor telepon")
	}

	if err := s.WhatsApp.Send(inv.ClientPhone, buildInvoiceCreatedMessage(inv)); err != nil {
		return fmt.Errorf("kirim WA teks gagal: %v", err)
	}
	log.Printf("Outbox invoice %s: WA teks terkirim ke %s", inv.InvoiceNumber, inv.ClientPhone)

	// PDF sifatnya pelengkap: gagal membuat/mengirim PDF tidak menggagalkan
	// seluruh notifikasi agar pesan tidak terkirim ganda pada percobaan ulang.
	pdfBytes, err := s.PDF.RenderInvoicePDF(inv)
	if err != nil {
		log.Printf("Outbox invoice %s: gagal generate PDF: %v", inv.InvoiceNumber, err)
		return nil
	}
	fileName := "Invoice-" + strings.ReplaceAll(inv.InvoiceNumber, "/", "-") + ".pdf"
	if err := s.WhatsApp.SendDocument(inv.ClientPhone, fileName, pdfBytes); err != nil {
		log.Printf("Outbox invoice %s: kirim PDF WA gagal: %v", inv.InvoiceNumber, err)
		return nil
	}
	log.Printf("Outbox invoice %s: WA PDF terkirim ke %s", inv.InvoiceNumber, inv.ClientPhone)

	return nil
}

// deliverPaymentApprovedWA mengirim konfirmasi pembayaran disetujui via WA.
func (s *ReminderService) deliverPaymentApprovedWA(ctx context.Context, paymentID string) error {
	n, err := fetchPaymentNotification(s.DB, paymentID)
	if err != nil {
		return fmt.Errorf("gagal ambil data pembayaran: %v", err)
	}
	if strings.TrimSpace(n.Phone) == "" {
		return fmt.Errorf("client tidak memiliki nomor telepon")
	}
	if err := s.WhatsApp.Send(n.Phone, buildPaymentApprovedMessage(n)); err != nil {
		return fmt.Errorf("kirim WA gagal: %v", err)
	}
	log.Printf("Outbox payment %s: WA konfirmasi terkirim ke %s", n.InvoiceNumber, n.Phone)
	return nil
}

// deliverPaymentRejectedWA mengirim konfirmasi pembayaran ditolak beserta alasan.
func (s *ReminderService) deliverPaymentRejectedWA(ctx context.Context, paymentID, reason string) error {
	n, err := fetchPaymentNotification(s.DB, paymentID)
	if err != nil {
		return fmt.Errorf("gagal ambil data pembayaran: %v", err)
	}
	if strings.TrimSpace(n.Phone) == "" {
		return fmt.Errorf("client tidak memiliki nomor telepon")
	}
	if err := s.WhatsApp.Send(n.Phone, buildPaymentRejectedMessage(n, reason)); err != nil {
		return fmt.Errorf("kirim WA gagal: %v", err)
	}
	log.Printf("Outbox payment %s: WA penolakan terkirim ke %s", n.InvoiceNumber, n.Phone)
	return nil
}