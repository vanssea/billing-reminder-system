package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"billing-reminder-system/services"
)

type EmailHandler struct {
	Service *services.EmailService
}

func NewEmailHandler(service *services.EmailService) *EmailHandler {
	return &EmailHandler{
		Service: service,
	}
}

func (h *EmailHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	configured := h.Service != nil

	status := map[string]any{
		"configured":   configured,
		"host":         "",
		"port":         "",
		"from":         "",
		"from_name":    "",
		"description":  "Email service belum dikonfigurasi (isi SMTP_* di backend/.env).",
	}

	if configured {
		status["host"] = h.Service.Host
		status["port"] = h.Service.Port
		status["from"] = h.Service.From
		status["from_name"] = h.Service.FromName
		status["description"] = "Email service aktif."
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func (h *EmailHandler) TestSend(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil {
		http.Error(w, "Email service belum dikonfigurasi. Isi SMTP_* di backend/.env terlebih dahulu.", http.StatusServiceUnavailable)
		return
	}

	var req struct {
		Email   string `json:"email"`
		Subject string `json:"subject"`
		Message string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		http.Error(w, "email wajib diisi", http.StatusBadRequest)
		return
	}

	subject := strings.TrimSpace(req.Subject)
	if subject == "" {
		subject = "Test Email - Billing Reminder"
	}

	message := strings.TrimSpace(req.Message)
	if message == "" {
		message = `<p>Halo,</p><p>Ini adalah email uji coba dari sistem Billing Reminder.</p><p>Jika Anda menerima email ini, konfigurasi SMTP berhasil.</p>`
	}

	body := `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#f4f4f7;padding:24px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">
<div style="background:linear-gradient(135deg,#3525cd,#5b44f3);padding:28px 32px;color:#fff;">
  <h2 style="margin:0;font-size:20px;">Test Email</h2>
</div>
<div style="padding:28px 32px;">
  ` + message + `
  <p style="color:#9996a5;font-size:12px;margin:24px 0 0;">Billing Reminder System</p>
</div>
</div>
</body>
</html>`

	if err := h.Service.Send(req.Email, subject, body); err != nil {
		http.Error(w, "Gagal mengirim email: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"sent":    true,
		"email":   req.Email,
		"subject": subject,
	})
}