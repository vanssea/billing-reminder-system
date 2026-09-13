package services

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net"
	"net/smtp"
	"os"
	"strings"
)

// EmailService menangani pengiriman email via SMTP.
type EmailService struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
	FromName string
}

// NewEmailService membuat EmailService dari variabel lingkungan.
// Jika SMTP_HOST kosong, mengembalikan nil (email dinonaktifkan).
func NewEmailService() *EmailService {
	host := strings.TrimSpace(os.Getenv("SMTP_HOST"))
	if host == "" {
		return nil
	}

	return &EmailService{
		Host:     host,
		Port:     strings.TrimSpace(os.Getenv("SMTP_PORT")),
		Username: strings.TrimSpace(os.Getenv("SMTP_USERNAME")),
		Password: strings.TrimSpace(os.Getenv("SMTP_PASSWORD")),
		From:     strings.TrimSpace(os.Getenv("SMTP_FROM")),
		FromName: strings.TrimSpace(os.Getenv("SMTP_FROM_NAME")),
	}
}

func (s *EmailService) addr() string {
	port := s.Port
	if port == "" {
		port = "587"
	}
	return net.JoinHostPort(s.Host, port)
}

func (s *EmailService) from() string {
	if s.FromName != "" {
		return fmt.Sprintf("%s <%s>", s.FromName, s.From)
	}
	return s.From
}

// Send mengirim email teks/HTML ke satu alamat.
func (s *EmailService) Send(to, subject, htmlBody string) error {
	if s == nil {
		return fmt.Errorf("email service belum dikonfigurasi")
	}

	var buf bytes.Buffer

	buf.WriteString("MIME-Version: 1.0\r\n")
	buf.WriteString("Content-Type: text/html; charset=\"UTF-8\"\r\n")
	buf.WriteString(fmt.Sprintf("From: %s\r\n", s.from()))
	buf.WriteString(fmt.Sprintf("To: %s\r\n", to))
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", subject))
	buf.WriteString("\r\n")
	buf.WriteString(htmlBody)

	auth := smtp.PlainAuth("", s.Username, s.Password, s.Host)

	addr := s.addr()

	// Split multiple recipients
	recipients := strings.Split(to, ",")

	return smtp.SendMail(addr, auth, s.From, recipients, buf.Bytes())
}

const reminderEmailHTML = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f7;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<div style="background:linear-gradient(135deg,#3525cd,#5b44f3);padding:28px 32px;color:#fff;">
  <p style="margin:0;font-size:14px;opacity:0.8;">Billing Reminder</p>
  <h2 style="margin:4px 0 0;font-size:20px;">Pengingat Pembayaran Invoice</h2>
</div>
<div style="padding:28px 32px;">
  <p style="color:#464555;margin:0 0 16px;">Halo <b>{{.ClientName}}</b>,</p>
  <p style="color:#464555;margin:0 0 20px;">Kami ingin mengingatkan bahwa invoice berikut masih menunggu pembayaran:</p>

  <table style="width:100%;border-collapse:collapse;margin:0 0 20px;border:1px solid #e8e6ee;border-radius:8px;overflow:hidden;">
    <tr style="background:#faf9fc;">
      <td style="padding:10px 16px;color:#8b8898;font-size:13px;border-bottom:1px solid #e8e6ee;">Invoice</td>
      <td style="padding:10px 16px;font-weight:bold;color:#191c1e;font-size:13px;border-bottom:1px solid #e8e6ee;">{{.InvoiceNumber}}</td>
    </tr>
    <tr>
      <td style="padding:10px 16px;color:#8b8898;font-size:13px;border-bottom:1px solid #e8e6ee;">Total</td>
      <td style="padding:10px 16px;font-weight:bold;color:#191c1e;font-size:13px;border-bottom:1px solid #e8e6ee;">Rp {{.Total}}</td>
    </tr>
    <tr style="background:#faf9fc;">
      <td style="padding:10px 16px;color:#8b8898;font-size:13px;border-bottom:1px solid #e8e6ee;">Jatuh Tempo</td>
      <td style="padding:10px 16px;font-weight:bold;color:#191c1e;font-size:13px;border-bottom:1px solid #e8e6ee;">{{.DueDate}}</td>
    </tr>
    <tr>
      <td style="padding:10px 16px;color:#8b8898;font-size:13px;">Status</td>
      <td style="padding:10px 16px;font-weight:bold;color:#dc2626;font-size:13px;">{{.Status}}</td>
    </tr>
  </table>

  <p style="color:#464555;margin:0 0 16px;">Mohon melakukan pembayaran sebelum tanggal jatuh tempo.</p>
  <p style="color:#464555;margin:0 0 16px;">Jika pembayaran sudah dilakukan, silakan abaikan email ini.</p>

  <p style="color:#9996a5;font-size:12px;margin:24px 0 0;">Terima kasih.<br><b>Billing Reminder</b></p>
</div>
</div>
</body>
</html>`

// reminderEmailData adalah data yang di-pass ke template email reminder.
type reminderEmailData struct {
	ClientName    string
	InvoiceNumber string
	DueDate       string
	Total         string
	Status        string
	ReminderType  string
}

// renderReminderEmail merender template HTML email reminder.
// Template di-parse satu kali saat init (lokal di <html>.Parse) agar tidak
// diparse ulang pada setiap pengiriman.
func renderReminderEmail(data reminderEmailData) (string, error) {
	var buf bytes.Buffer
	if err := reminderEmailTmpl.Execute(&buf, data); err != nil {
		return "", err
	}

	return buf.String(), nil
}

// SendReminderEmail mengirim email pengingat invoice ke client.
func (s *EmailService) SendReminderEmail(
	to, clientName, invoiceNumber, dueDate, total, status, reminderType string,
) error {
	if s == nil {
		return fmt.Errorf("email service belum dikonfigurasi")
	}
	if strings.TrimSpace(to) == "" {
		return fmt.Errorf("alamat email kosong")
	}

	subject := fmt.Sprintf("Pengingat Pembayaran Invoice %s", invoiceNumber)

	body, err := renderReminderEmail(reminderEmailData{
		ClientName:    clientName,
		InvoiceNumber: invoiceNumber,
		DueDate:       dueDate,
		Total:         total,
		Status:        status,
		ReminderType:  reminderType,
	})
	if err != nil {
		log.Printf("Gagal render template email reminder: %v", err)
		// Fallback ke body plain
		body = fmt.Sprintf(`<p>Halo %s,</p><p>Invoice <b>%s</b> sebesar <b>%s</b> jatuh tempo pada <b>%s</b>.</p><p>Status: <b>%s</b></p><p>Mohon melakukan pembayaran sebelum jatuh tempo.</p>`,
			template.HTMLEscapeString(clientName),
			template.HTMLEscapeString(invoiceNumber),
			template.HTMLEscapeString(total),
			template.HTMLEscapeString(dueDate),
			template.HTMLEscapeString(status))
	}

	return s.Send(to, subject, body)
}

// renderHTMLEmail merender template shell email dengan data yang sudah di-escape
// secara otomatis oleh html/template (mencegah XSS/HTML injection).
func renderHTMLEmail(data any) (string, error) {
	var buf bytes.Buffer
	if err := emailShellTmpl.Execute(&buf, data); err != nil {
		return "", err
	}
	return buf.String(), nil
}

const emailShell = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f7;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
{{.HeaderHTML}}
<div style="padding:28px 32px;">
{{.BodyHTML}}
<p style="color:#9996a5;font-size:12px;margin:24px 0 0;">Billing Reminder System</p>
</div>
</div>
</body>
</html>`

// Template email diparse satu kali saat init dan aman dieksekusi bersamaan
// (html/template mendukung concurrent Execute).
var (
	reminderEmailTmpl = template.Must(template.New("reminder").Parse(reminderEmailHTML))
	emailShellTmpl    = template.Must(template.New("email-shell").Parse(emailShell))
)

type emailShellData struct {
	HeaderHTML template.HTML
	BodyHTML   template.HTML
}

// dangerBanner membungkus teks dalam banner HTML (dipakai untuk alasan
// penolakan dan overdue). Data sudah di-escape oleh pemanggil sebelum masuk sini.
func dangerBanner(text template.HTML) template.HTML {
	return template.HTML(`<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:0 0 16px;"><p style="color:#dc2626;font-weight:bold;margin:0 0 4px;">Alasan:</p><p style="color:#464555;margin:0;">` + string(text) + `</p></div>`)
}

// SendInvoiceCreatedEmail mengirim email notifikasi invoice baru.
func (s *EmailService) SendInvoiceCreatedEmail(
	to, clientName, invoiceNumber, dueDate, total string,
) error {
	if s == nil {
		return fmt.Errorf("email service belum dikonfigurasi")
	}
	if strings.TrimSpace(to) == "" {
		return fmt.Errorf("alamat email kosong")
	}

	subject := fmt.Sprintf("Tagihan Baru - Invoice %s", invoiceNumber)

	headerHTML := template.HTML(`<div style="background:linear-gradient(135deg,#3525cd,#5b44f3);padding:28px 32px;color:#fff;">
<h2 style="margin:0;font-size:20px;">Tagihan Baru</h2>
</div>`)

	bodyHTML := template.HTML(fmt.Sprintf(
		`<p style="color:#464555;margin:0 0 16px;">Halo <b>%s</b>,</p>
<p style="color:#464555;margin:0 0 16px;">Tagihan invoice <b>%s</b> sebesar <b>%s</b> telah dibuat.</p>
<table style="width:100%%;border-collapse:collapse;margin:16px 0;">
<tr><td style="padding:8px 0;color:#8b8898;">Jatuh Tempo</td><td style="padding:8px 0;font-weight:bold;color:#191c1e;">%s</td></tr>
</table>
<p style="color:#464555;margin:0 0 16px;">Silakan melakukan pembayaran sebelum tanggal jatuh tempo.</p>`,
		template.HTMLEscapeString(clientName),
		template.HTMLEscapeString(invoiceNumber),
		template.HTMLEscapeString(total),
		template.HTMLEscapeString(dueDate),
	))

	body, err := renderHTMLEmail(emailShellData{
		HeaderHTML: headerHTML,
		BodyHTML:   bodyHTML,
	})
	if err != nil {
		log.Printf("Gagal render email invoice baru: %v", err)
		body = fmt.Sprintf("<p>Halo %s,</p><p>Tagihan invoice <b>%s</b> sebesar <b>%s</b> telah dibuat. Jatuh tempo <b>%s</b>.</p>",
			template.HTMLEscapeString(clientName),
			template.HTMLEscapeString(invoiceNumber),
			template.HTMLEscapeString(total),
			template.HTMLEscapeString(dueDate))
	}

	return s.Send(to, subject, body)
}

// SendPaymentApprovedEmail mengirim email konfirmasi pembayaran disetujui.
func (s *EmailService) SendPaymentApprovedEmail(
	to, clientName, invoiceNumber, amount string,
) error {
	if s == nil {
		return fmt.Errorf("email service belum dikonfigurasi")
	}
	if strings.TrimSpace(to) == "" {
		return fmt.Errorf("alamat email kosong")
	}

	subject := fmt.Sprintf("Pembayaran Diterima - Invoice %s", invoiceNumber)

	headerHTML := template.HTML(`<div style="background:linear-gradient(135deg,#0d9488,#14b8a6);padding:28px 32px;color:#fff;">
<h2 style="margin:0;font-size:20px;">Pembayaran Diterima</h2>
</div>`)

	bodyHTML := template.HTML(fmt.Sprintf(
		`<p style="color:#464555;margin:0 0 16px;">Halo <b>%s</b>,</p>
<p style="color:#464555;margin:0 0 16px;">Pembayaran untuk invoice <b>%s</b> sebesar <b>%s</b> telah berhasil diverifikasi.</p>
<p style="color:#0d9488;font-weight:bold;margin:0 0 16px;">Status: PAID</p>`,
		template.HTMLEscapeString(clientName),
		template.HTMLEscapeString(invoiceNumber),
		template.HTMLEscapeString(amount),
	))

	body, err := renderHTMLEmail(emailShellData{
		HeaderHTML: headerHTML,
		BodyHTML:   bodyHTML,
	})
	if err != nil {
		log.Printf("Gagal render email pembayaran diterima: %v", err)
		body = fmt.Sprintf("<p>Halo %s,</p><p>Pembayaran untuk invoice <b>%s</b> sebesar <b>%s</b> telah berhasil diverifikasi.</p>",
			template.HTMLEscapeString(clientName),
			template.HTMLEscapeString(invoiceNumber),
			template.HTMLEscapeString(amount))
	}

	return s.Send(to, subject, body)
}

// SendPaymentRejectedEmail mengirim email notifikasi pembayaran ditolak.
func (s *EmailService) SendPaymentRejectedEmail(
	to, clientName, invoiceNumber, amount, reason string,
) error {
	if s == nil {
		return fmt.Errorf("email service belum dikonfigurasi")
	}
	if strings.TrimSpace(to) == "" {
		return fmt.Errorf("alamat email kosong")
	}

	subject := fmt.Sprintf("Pembayaran Ditolak - Invoice %s", invoiceNumber)

	headerHTML := template.HTML(`<div style="background:linear-gradient(135deg,#dc2626,#ef4444);padding:28px 32px;color:#fff;">
<h2 style="margin:0;font-size:20px;">Pembayaran Ditolak</h2>
</div>`)

	bodyHTML := template.HTML(fmt.Sprintf(
		`<p style="color:#464555;margin:0 0 16px;">Halo <b>%s</b>,</p>
<p style="color:#464555;margin:0 0 16px;">Pembayaran untuk invoice <b>%s</b> sebesar <b>%s</b> belum dapat diverifikasi.</p>
<p style="color:#dc2626;font-weight:bold;margin:0 0 16px;">Status: REJECTED</p>
%s
<p style="color:#464555;margin:0 0 16px;">Silakan melakukan pembayaran kembali atau menghubungi pihak terkait.</p>`,
		template.HTMLEscapeString(clientName),
		template.HTMLEscapeString(invoiceNumber),
		template.HTMLEscapeString(amount),
		string(dangerBanner(template.HTML(template.HTMLEscapeString(reason)))),
	))

	body, err := renderHTMLEmail(emailShellData{
		HeaderHTML: headerHTML,
		BodyHTML:   bodyHTML,
	})
	if err != nil {
		log.Printf("Gagal render email pembayaran ditolak: %v", err)
		body = fmt.Sprintf("<p>Halo %s,</p><p>Pembayaran untuk invoice <b>%s</b> sebesar <b>%s</b> belum dapat diverifikasi.</p><p><b>Alasan:</b> %s</p>",
			template.HTMLEscapeString(clientName),
			template.HTMLEscapeString(invoiceNumber),
			template.HTMLEscapeString(amount),
			template.HTMLEscapeString(reason))
	}

	return s.Send(to, subject, body)
}

// SendOverdueEmail mengirim email notifikasi invoice overdue.
func (s *EmailService) SendOverdueEmail(
	to, clientName, invoiceNumber, total, dueDate string,
) error {
	if s == nil {
		return fmt.Errorf("email service belum dikonfigurasi")
	}
	if strings.TrimSpace(to) == "" {
		return fmt.Errorf("alamat email kosong")
	}

	subject := fmt.Sprintf("PERINGATAN: Invoice %s Melewati Jatuh Tempo", invoiceNumber)

	headerHTML := template.HTML(`<div style="background:linear-gradient(135deg,#dc2626,#f87171);padding:28px 32px;color:#fff;">
<h2 style="margin:0;font-size:20px;">Tagihan Melewati Jatuh Tempo</h2>
</div>`)

	bodyHTML := template.HTML(fmt.Sprintf(
		`<p style="color:#464555;margin:0 0 16px;">Halo <b>%s</b>,</p>
<p style="color:#464555;margin:0 0 16px;">Tagihan <b>%s</b> sebesar <b>%s</b> telah melewati tanggal jatuh tempo <b>%s</b>.</p>
<p style="color:#dc2626;font-weight:bold;margin:0 0 16px;">Status: OVERDUE</p>
<p style="color:#464555;margin:0 0 16px;">Silakan segera melakukan pembayaran.</p>`,
		template.HTMLEscapeString(clientName),
		template.HTMLEscapeString(invoiceNumber),
		template.HTMLEscapeString(total),
		template.HTMLEscapeString(dueDate),
	))

	body, err := renderHTMLEmail(emailShellData{
		HeaderHTML: headerHTML,
		BodyHTML:   bodyHTML,
	})
	if err != nil {
		log.Printf("Gagal render email overdue: %v", err)
		body = fmt.Sprintf("<p>Halo %s,</p><p>Tagihan <b>%s</b> sebesar <b>%s</b> telah melewati jatuh tempo <b>%s</b>.</p><p><b>Status: OVERDUE</b></p>",
			template.HTMLEscapeString(clientName),
			template.HTMLEscapeString(invoiceNumber),
			template.HTMLEscapeString(total),
			template.HTMLEscapeString(dueDate))
	}

	return s.Send(to, subject, body)
}
