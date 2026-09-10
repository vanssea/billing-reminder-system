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
	outboxInvoiceOverdue  = "INVOICE_OVERDUE"
)

// outboxMaxAttempts membatasi percobaan pengiriman WA pada antrian outbox.
const outboxMaxAttempts = 3

// outboxAdvisoryLockID adalah ID lock PostgreSQL terpisah untuk melindungi
// proses outbox agar tidak ada dua worker yang mengirim outbox yang sama.
const outboxAdvisoryLockID = 72420102

// TryAcquireOutboxLock mencoba mengambil advisory lock untuk outbox tanpa
// memblokir. Mengembalikan fungsi release beserta status keberhasilan.
func (s *ReminderService) TryAcquireOutboxLock(ctx context.Context) (release func(), ok bool) {
	conn, err := s.DB.Acquire(ctx)
	if err != nil {
		log.Printf("Gagal ambil koneksi untuk lock outbox: %v", err)
		return nil, false
	}
	var locked bool
	if err := conn.QueryRow(ctx, "SELECT pg_try_advisory_lock($1)", outboxAdvisoryLockID).Scan(&locked); err != nil {
		conn.Release()
		log.Printf("Gagal mengunci outbox lock: %v", err)
		return nil, false
	}
	if !locked {
		conn.Release()
		return nil, false
	}
	return func() {
		conn.Exec(ctx, "SELECT pg_advisory_unlock($1)", outboxAdvisoryLockID)
		conn.Release()
	}, true
}

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

// EnqueueOverdueWA menaruh job WA invoice melewati jatuh tempo ke antrian
// outbox, sehingga pengiriman memiliki retry bila WhatsApp sempat down.
func EnqueueOverdueWA(db *pgxpool.Pool, invoiceID string) error {
	if strings.TrimSpace(invoiceID) == "" {
		return nil
	}
	if _, err := db.Exec(context.Background(), `
		INSERT INTO notification_outbox (notif_type, invoice_id)
		VALUES ($1, $2)
	`, outboxInvoiceOverdue, invoiceID); err != nil {
		log.Printf("Gagal memasukkan outbox WA overdue %s: %v", invoiceID, err)
		return err
	}
	return nil
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
// RunReminderCycle. Baris PENDING di-claim dalam transaksi singkat (SELECT
// FOR UPDATE SKIP LOCKED) lalu transaksi langsung ditutup, sehingga lock dan
// koneksi DB dilepas SEBELUM I/O lambat (kirim WA + render/upload PDF) dimulai.
// Penandaan hasil (SENT/FAILED) dilakukan per-baris dengan statement pendek.
func (s *ReminderService) ProcessOutbox(ctx context.Context) {
	if s.WhatsApp == nil || !s.WhatsApp.IsConnected() {
		return
	}

	tx, err := s.DB.Begin(ctx)
	if err != nil {
		log.Println("Gagal memulai transaksi klaim outbox:", err)
		return
	}

	rows, err := tx.Query(ctx, `
		SELECT id, notif_type, COALESCE(invoice_id, ''), COALESCE(payment_id, ''), COALESCE(reason, '')
		FROM notification_outbox
		WHERE status = 'PENDING'
		ORDER BY created_at
		LIMIT 50
		FOR UPDATE SKIP LOCKED
	`)
	if err != nil {
		_ = tx.Rollback(ctx)
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
		_ = tx.Rollback(ctx)
		log.Println("Gagal membaca antrian outbox:", err)
		return
	}

	// Klaim selesai: commit segera agar lock baris & koneksi transaksi dilepas
	// sebelum pengiriman WA/PDF (yang lambat) di bawah.
	if err := tx.Commit(ctx); err != nil {
		log.Printf("Gagal menutup transaksi klaim outbox: %v", err)
		return
	}

	log.Printf("Outbox processing: %d antrian PENDING diklaim.", len(pending))
	if len(pending) == 0 {
		return
	}

	sent := 0
	failed := 0
	for _, r := range pending {
		// I/O (WA + PDF) BERJALAN DI LUAR transaksi: tidak ada lock/transaksi
		// yang menggenggam koneksi DB selama pengiriman berlangsung.
		if err := s.deliverOutbox(ctx, r); err != nil {
			failed++
			log.Printf("Outbox %s (%s) gagal: %v", r.NotifType, r.ID, err)
			// Statement pendek (auto-commit). Guard status='PENDING' agar tidak
			// menimpa baris yang sudah SENT oleh proses lain.
			_, _ = s.DB.Exec(ctx, `
				UPDATE notification_outbox
				SET attempts = attempts + 1, error_message = $2,
				    status = CASE WHEN attempts + 1 >= $3 THEN 'FAILED' ELSE status END
				WHERE id = $1 AND status = 'PENDING'
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
	case outboxInvoiceOverdue:
		return s.deliverOverdueWA(ctx, r.InvoiceID)
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

// deliverOverdueWA mengirim notifikasi invoice melewati jatuh tempo via WA.
// Dijadwalkan lewat outbox agar ada retry bila WhatsApp sempat down.
func (s *ReminderService) deliverOverdueWA(ctx context.Context, invoiceID string) error {
	inv, err := getInvoiceData(ctx, s.DB, invoiceID)
	if err != nil {
		return fmt.Errorf("gagal ambil data invoice: %v", err)
	}
	if strings.TrimSpace(inv.ClientPhone) == "" {
		return fmt.Errorf("client tidak memiliki nomor telepon")
	}
	if err := s.WhatsApp.Send(inv.ClientPhone, buildOverdueMessage(inv)); err != nil {
		return fmt.Errorf("kirim WA gagal: %v", err)
	}
	log.Printf("Outbox invoice %s: WA overdue terkirim ke %s", inv.InvoiceNumber, inv.ClientPhone)
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