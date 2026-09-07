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
func SendInvoiceCreatedWhatsApp(db *pgxpool.Pool, wa *WhatsAppService, email *EmailService, pdf *PDFService, invoiceID string) {
	if err := SendInvoiceToClient(db, wa, email, pdf, invoiceID); err != nil {
		log.Printf("Invoice notifikasi otomatis gagal untuk %s: %v", invoiceID, err)
	}
}

// SendInvoiceToClient mengirim pesan teks + PDF invoice ke WhatsApp
// dan email ke client secara sinkron.
func SendInvoiceToClient(db *pgxpool.Pool, wa *WhatsAppService, email *EmailService, pdf *PDFService, invoiceID string) error {
	hasWhatsApp := whatsappReady(wa)
	hasEmail := email != nil

	if !hasWhatsApp && !hasEmail {
		return fmt.Errorf("WhatsApp dan Email belum tersedia")
	}

	inv, err := getInvoiceData(context.Background(), db, invoiceID)
	if err != nil {
		return fmt.Errorf("gagal ambil data invoice: %v", err)
	}

	// Kirim via WhatsApp
	if hasWhatsApp {
		if strings.TrimSpace(inv.ClientPhone) == "" {
			log.Printf("Invoice WhatsApp dilewati untuk %s: client tidak memiliki nomor telepon", inv.InvoiceNumber)
		} else {
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
			} else {
				log.Printf("Invoice WhatsApp teks terkirim untuk %s ke %s", inv.InvoiceNumber, inv.ClientPhone)

				if pdf != nil {
					pdfBytes, err := pdf.RenderInvoicePDF(inv)
					if err == nil {
						fileName := "Invoice-" + strings.ReplaceAll(inv.InvoiceNumber, "/", "-") + ".pdf"
						if err := wa.SendDocument(inv.ClientPhone, fileName, pdfBytes); err != nil {
							log.Printf("Invoice WhatsApp PDF gagal untuk %s: %v", inv.InvoiceNumber, err)
						} else {
							log.Printf("Invoice WhatsApp PDF terkirim untuk %s ke %s", inv.InvoiceNumber, inv.ClientPhone)
						}
					} else {
						log.Printf("Invoice WhatsApp: gagal generate PDF untuk %s: %v", inv.InvoiceNumber, err)
					}
				}
			}
		}
	}

	// Kirim via Email
	if hasEmail && strings.TrimSpace(inv.ClientEmail) != "" {
		if err := email.SendInvoiceCreatedEmail(
			inv.ClientEmail,
			inv.ClientCompany,
			inv.InvoiceNumber,
			formatTanggalIndo(inv.DueDate),
			formatRupiah(inv.Total),
		); err != nil {
			log.Printf("Invoice email gagal untuk %s ke %s: %v", inv.InvoiceNumber, inv.ClientEmail, err)
		} else {
			log.Printf("Invoice email terkirim untuk %s ke %s", inv.InvoiceNumber, inv.ClientEmail)
		}
	}

	return nil
}

type paymentNotification struct {
	InvoiceNumber string
	ClientCompany string
	ClientPIC     string
	Phone         string
	ClientEmail   string
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
			COALESCE(c.email, ''),
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
		&n.ClientEmail,
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
func sendPaymentApprovedWhatsApp(db *pgxpool.Pool, wa *WhatsAppService, email *EmailService, paymentID string) {
	n, err := fetchPaymentNotification(db, paymentID)
	if err != nil {
		log.Printf("Payment notification gagal untuk payment %s: %v", paymentID, err)
		return
	}

	// Kirim via WhatsApp
	if whatsappReady(wa) && strings.TrimSpace(n.Phone) != "" {
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
		} else {
			log.Printf("Payment confirmation WA terkirim untuk %s ke %s", n.InvoiceNumber, n.Phone)
		}
	}

	// Kirim via Email
	if email != nil && strings.TrimSpace(n.ClientEmail) != "" {
		if err := email.SendPaymentApprovedEmail(
			n.ClientEmail,
			n.ClientCompany,
			n.InvoiceNumber,
			formatRupiah(n.Amount),
		); err != nil {
			log.Printf("Payment confirmation email gagal untuk %s ke %s: %v", n.InvoiceNumber, n.ClientEmail, err)
		} else {
			log.Printf("Payment confirmation email terkirim untuk %s ke %s", n.InvoiceNumber, n.ClientEmail)
		}
	}
}

// sendPaymentRejectedWhatsApp memberi tahu client bahwa pembayarannya
// ditolak beserta alasannya.
func sendPaymentRejectedWhatsApp(db *pgxpool.Pool, wa *WhatsAppService, email *EmailService, paymentID, reason string) {
	n, err := fetchPaymentNotification(db, paymentID)
	if err != nil {
		log.Printf("Payment rejection notification gagal untuk payment %s: %v", paymentID, err)
		return
	}

	// Kirim via WhatsApp
	if whatsappReady(wa) && strings.TrimSpace(n.Phone) != "" {
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
		} else {
			log.Printf("Payment rejection WA terkirim untuk %s ke %s", n.InvoiceNumber, n.Phone)
		}
	}

	// Kirim via Email
	if email != nil && strings.TrimSpace(n.ClientEmail) != "" {
		if err := email.SendPaymentRejectedEmail(
			n.ClientEmail,
			n.ClientCompany,
			n.InvoiceNumber,
			formatRupiah(n.Amount),
			reason,
		); err != nil {
			log.Printf("Payment rejection email gagal untuk %s ke %s: %v", n.InvoiceNumber, n.ClientEmail, err)
		} else {
			log.Printf("Payment rejection email terkirim untuk %s ke %s", n.InvoiceNumber, n.ClientEmail)
		}
	}
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
		SELECT o.id, COALESCE(c.phone, ''), COALESCE(c.email, '')
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
		Email string
	}

	var overdueRows []overdueRow
	for rows.Next() {
		var r overdueRow
		if err := rows.Scan(&r.ID, &r.Phone, &r.Email); err != nil {
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
			log.Printf("Overdue notification gagal untuk invoice %s: %v", r.ID, err)
			continue
		}

		// Kirim via WhatsApp
		if whatsappReady(s.WhatsApp) && strings.TrimSpace(r.Phone) != "" {
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
			} else {
				log.Printf("Overdue WhatsApp terkirim untuk %s ke %s", inv.InvoiceNumber, r.Phone)
			}
		}

		// Kirim via Email
		if s.Email != nil && strings.TrimSpace(r.Email) != "" {
			if err := s.Email.SendOverdueEmail(
				r.Email,
				inv.ClientCompany,
				inv.InvoiceNumber,
				formatRupiah(inv.Total),
				formatTanggalIndo(inv.DueDate),
			); err != nil {
				log.Printf("Overdue email gagal untuk %s ke %s: %v", inv.InvoiceNumber, r.Email, err)
			} else {
				log.Printf("Overdue email terkirim untuk %s ke %s", inv.InvoiceNumber, r.Email)
			}
		}
	}
}
