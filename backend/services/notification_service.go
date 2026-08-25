package services

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/jackc/pgx/v5/pgxpool"
)

func whatsappReady(wa *WhatsAppService) bool {
	return wa != nil && wa.IsConnected()
}

// SendInvoiceCreatedWhatsApp mengirim pesan teks + PDF invoice ke client
// saat invoice pertama kali dibuat dengan status SENT.
// Wrapper fire-and-forget untuk alur otomatis (create/update invoice).
func SendInvoiceCreatedWhatsApp(db *pgxpool.Pool, wa *WhatsAppService, pdf *PDFService, invoiceID string) {
	if err := SendInvoiceToClient(db, wa, pdf, invoiceID); err != nil {
		log.Printf("Invoice WhatsApp otomatis gagal untuk %s: %v", invoiceID, err)
	}
}

// SendInvoiceToClient mengirim pesan teks + PDF invoice ke nomor WhatsApp
// client secara sinkron dan mengembalikan error bila ada langkah yang
// gagal, sehingga pemanggil bisa melaporkan hasil yang sebenarnya.
func SendInvoiceToClient(db *pgxpool.Pool, wa *WhatsAppService, pdf *PDFService, invoiceID string) error {
	if !whatsappReady(wa) {
		return fmt.Errorf("whatsapp belum terhubung")
	}
	if pdf == nil {
		return fmt.Errorf("pdf service tidak tersedia")
	}

	inv, err := getInvoiceData(context.Background(), db, invoiceID)
	if err != nil {
		return fmt.Errorf("gagal ambil data invoice: %v", err)
	}

	if strings.TrimSpace(inv.ClientPhone) == "" {
		return fmt.Errorf("client %s tidak memiliki nomor whatsapp", inv.ClientCompany)
	}

	message := fmt.Sprintf(`🔔 *Tagihan Baru*

Halo, *%s*,

Tagihan invoice *%s* sebesar *Rp %s*
telah dibuat.

📅 Jatuh tempo: *%s*

Silakan melakukan pembayaran sebelum tanggal jatuh tempo.

Terima kasih.
*Billing Reminder*`,
		inv.ClientCompany,
		inv.InvoiceNumber,
		formatRupiah(inv.Total),
		formatTanggalIndo(inv.DueDate),
	)

	if err := wa.Send(inv.ClientPhone, message); err != nil {
		log.Printf("Invoice WhatsApp gagal terkirim untuk %s ke %s: %v", inv.InvoiceNumber, inv.ClientPhone, err)
		return fmt.Errorf("gagal kirim pesan whatsapp: %v", err)
	}
	log.Printf("Invoice WhatsApp teks terkirim untuk %s ke %s", inv.InvoiceNumber, inv.ClientPhone)

	pdfBytes, err := pdf.RenderInvoicePDF(inv)
	if err != nil {
		log.Printf("Invoice WhatsApp: teks terkirim tapi gagal generate PDF untuk %s: %v", inv.InvoiceNumber, err)
		return fmt.Errorf("pesan teks terkirim tetapi gagal membuat PDF invoice: %v", err)
	}

	fileName := "Invoice-" + strings.ReplaceAll(inv.InvoiceNumber, "/", "-") + ".pdf"
	if err := wa.SendDocument(inv.ClientPhone, fileName, pdfBytes); err != nil {
		log.Printf("Invoice WhatsApp: teks terkirim tapi gagal kirim PDF untuk %s: %v", inv.InvoiceNumber, err)
		return fmt.Errorf("pesan teks terkirim tetapi gagal mengirim PDF: %v", err)
	}
	log.Printf("Invoice WhatsApp PDF terkirim untuk %s ke %s", inv.InvoiceNumber, inv.ClientPhone)
	return nil
}

type paymentNotification struct {
	InvoiceNumber string
	ClientCompany string
	ClientPIC     string
	Phone         string
	Amount        float64
	Status        string
}

func fetchPaymentNotification(db *pgxpool.Pool, paymentID string) (*paymentNotification, error) {
	var n paymentNotification

	err := db.QueryRow(context.Background(), `
		SELECT
			i.invoice_number,
			c.company_name,
			COALESCE(c.pic_name, ''),
			COALESCE(c.phone, ''),
			p.amount,
			p.status
		FROM payments p
		JOIN invoices i ON i.id = p.invoice_id
		JOIN clients c ON c.id = i.client_id
		WHERE p.id = $1
	`, paymentID).Scan(
		&n.InvoiceNumber,
		&n.ClientCompany,
		&n.ClientPIC,
		&n.Phone,
		&n.Amount,
		&n.Status,
	)
	if err != nil {
		return nil, err
	}

	return &n, nil
}

// sendPaymentApprovedWhatsApp memberi tahu client bahwa pembayarannya
// telah diverifikasi dan invoice menjadi PAID.
func sendPaymentApprovedWhatsApp(db *pgxpool.Pool, wa *WhatsAppService, paymentID string) {
	if !whatsappReady(wa) {
		log.Printf("Payment confirmation WA dilewati untuk payment %s: WhatsApp belum terhubung", paymentID)
		return
	}

	n, err := fetchPaymentNotification(db, paymentID)
	if err != nil {
		log.Printf("Payment confirmation WA gagal untuk payment %s: %v", paymentID, err)
		return
	}

	if strings.TrimSpace(n.Phone) == "" {
		log.Printf("Payment confirmation WA dilewati untuk %s: client tidak memiliki nomor telepon", n.InvoiceNumber)
		return
	}

	message := fmt.Sprintf(`✅ *Pembayaran Berhasil*

Halo, *%s*,

Pembayaran untuk invoice *%s*
sebesar *Rp %s* telah berhasil diverifikasi.

Status: *PAID*

Terima kasih.
*Billing Reminder*`,
		n.ClientCompany,
		n.InvoiceNumber,
		formatRupiah(n.Amount),
	)

	if err := wa.Send(n.Phone, message); err != nil {
		log.Printf("Payment confirmation WA gagal terkirim untuk %s ke %s: %v", n.InvoiceNumber, n.Phone, err)
		return
	}
	log.Printf("Payment confirmation WA terkirim untuk %s ke %s (payment approved)", n.InvoiceNumber, n.Phone)
}

// sendPaymentRejectedWhatsApp memberi tahu client bahwa pembayarannya
// ditolak beserta alasannya.
func sendPaymentRejectedWhatsApp(db *pgxpool.Pool, wa *WhatsAppService, paymentID, reason string) {
	if !whatsappReady(wa) {
		log.Printf("Payment rejection WA dilewati untuk payment %s: WhatsApp belum terhubung", paymentID)
		return
	}

	n, err := fetchPaymentNotification(db, paymentID)
	if err != nil {
		log.Printf("Payment rejection WA gagal untuk payment %s: %v", paymentID, err)
		return
	}

	if strings.TrimSpace(n.Phone) == "" {
		log.Printf("Payment rejection WA dilewati untuk %s: client tidak memiliki nomor telepon", n.InvoiceNumber)
		return
	}

	message := fmt.Sprintf(`⚠️ *Pembayaran Tidak Dapat Diverifikasi*

Halo, *%s*,

Pembayaran untuk invoice *%s*
sebesar *Rp %s* belum dapat kami verifikasi.

Status: *REJECTED*

Alasan:
%s

Silakan melakukan pembayaran kembali atau menghubungi pihak terkait.

Terima kasih.
*Billing Reminder*`,
		n.ClientCompany,
		n.InvoiceNumber,
		formatRupiah(n.Amount),
		reason,
	)

	if err := wa.Send(n.Phone, message); err != nil {
		log.Printf("Payment rejection WA gagal terkirim untuk %s ke %s: %v", n.InvoiceNumber, n.Phone, err)
		return
	}
	log.Printf("Payment rejection WA terkirim untuk %s ke %s (payment rejected)", n.InvoiceNumber, n.Phone)
}

// processOverdueInvoices menandai invoice yang melewati jatuh tempo menjadi
// OVERDUE lalu mengirim notifikasi WhatsApp satu kali untuk setiap invoice
// yang BARU berubah status. Invoice yang sudah OVERDUE pada run berikutnya
// tidak lagi cocok dengan filter, sehingga pesan tidak pernah duplikat.
// Reminder milik invoice yang baru OVERDUE dan belum terkirim (PENDING/FAILED,
// sent_at NULL) langsung di-SKIPPED dalam statement yang sama sehingga tidak
// ada reminder menggantung; reminder SENT tidak disentuh.
func (s *ReminderService) processOverdueInvoices(ctx context.Context) {
	rows, err := s.DB.Query(ctx, `
		WITH overdue AS (
			UPDATE invoices
			SET status = 'OVERDUE', updated_at = now()
			WHERE due_date < NOW()
			  AND status IN ('UNPAID', 'SENT')
			RETURNING id, client_id
		),
		skip_reminders AS (
			UPDATE reminders r
			SET status = 'SKIPPED'
			FROM overdue o
			WHERE r.invoice_id = o.id
			  AND r.sent_at IS NULL
			  AND r.status IN ('PENDING', 'FAILED')
		)
		SELECT o.id, COALESCE(c.phone, '')
		FROM overdue o
		JOIN clients c ON c.id = o.client_id
	`)
	if err != nil {
		log.Println("Gagal memproses invoice overdue:", err)
		return
	}
	defer rows.Close()

	type overdueRow struct {
		ID    string
		Phone string
	}

	var overdueRows []overdueRow
	for rows.Next() {
		var r overdueRow
		if err := rows.Scan(&r.ID, &r.Phone); err != nil {
			log.Println("Gagal membaca data invoice overdue:", err)
			return
		}
		overdueRows = append(overdueRows, r)
	}
	if err := rows.Err(); err != nil {
		log.Println("Gagal membaca data invoice overdue:", err)
		return
	}

	if len(overdueRows) == 0 {
		return
	}

	log.Printf("%d invoice baru ditandai OVERDUE", len(overdueRows))

	for _, r := range overdueRows {
		inv, err := getInvoiceData(ctx, s.DB, r.ID)
		if err != nil {
			log.Printf("Overdue WhatsApp gagal untuk invoice %s: %v", r.ID, err)
			continue
		}

		if strings.TrimSpace(r.Phone) == "" {
			log.Printf("Overdue WhatsApp dilewati untuk %s: client tidak memiliki nomor telepon", inv.InvoiceNumber)
			continue
		}

		if !whatsappReady(s.WhatsApp) {
			log.Printf("Overdue WhatsApp gagal untuk %s: WhatsApp belum terhubung", inv.InvoiceNumber)
			continue
		}

		message := fmt.Sprintf(`⏰ *Tagihan Melewati Jatuh Tempo*

Halo, *%s*,

Tagihan *%s*
sebesar *Rp %s*
telah melewati tanggal jatuh tempo *%s*.

Status: *OVERDUE*

Silakan segera melakukan pembayaran.

Terima kasih.
*Billing Reminder*`,
			inv.ClientCompany,
			inv.InvoiceNumber,
			formatRupiah(inv.Total),
			formatTanggalIndo(inv.DueDate),
		)

		if err := s.WhatsApp.Send(r.Phone, message); err != nil {
			log.Printf("Overdue WhatsApp gagal terkirim untuk %s ke %s: %v", inv.InvoiceNumber, r.Phone, err)
			continue
		}
		log.Printf("Overdue WhatsApp terkirim untuk %s ke %s", inv.InvoiceNumber, r.Phone)
	}
}
