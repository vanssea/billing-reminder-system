package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"billing-reminder-system/services"
)

type WhatsAppHandler struct {
	Service *services.WhatsAppService
	PDF     *services.PDFService
}

func NewWhatsAppHandler(service *services.WhatsAppService, pdf *services.PDFService) *WhatsAppHandler {
	return &WhatsAppHandler{
		Service: service,
		PDF:     pdf,
	}
}

func (h *WhatsAppHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	status := map[string]any{
		"connected": h.Service != nil && h.Service.IsConnected(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func (h *WhatsAppHandler) TestSend(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil {
		http.Error(w, "WhatsApp service tidak tersedia", http.StatusServiceUnavailable)
		return
	}

	var req struct {
		Phone   string `json:"phone"`
		Message string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	if req.Phone == "" || req.Message == "" {
		http.Error(w, "phone dan message wajib diisi", http.StatusBadRequest)
		return
	}

	if err := h.Service.Send(req.Phone, req.Message); err != nil {
		http.Error(w, "Gagal mengirim pesan: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"sent":    true,
		"phone":   req.Phone,
		"message": req.Message,
	})
}

// TestSendPDF membuat PDF invoice dummy lalu mengirimkannya sebagai
// dokumen WhatsApp ke nomor yang diberikan.
func (h *WhatsAppHandler) TestSendPDF(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil || h.PDF == nil {
		http.Error(w, "WhatsApp/PDF service tidak tersedia", http.StatusServiceUnavailable)
		return
	}

	var req struct {
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}
	if req.Phone == "" {
		http.Error(w, "phone wajib diisi", http.StatusBadRequest)
		return
	}

	dummy := &services.InvoiceData{
		InvoiceNumber: "INV/2026/08/001",
		InvoiceDate:   time.Date(2026, 8, 12, 0, 0, 0, 0, time.Local),
		DueDate:       time.Date(2026, 9, 11, 0, 0, 0, 0, time.Local),
		Status:        "UNPAID",
		Subtotal:      2000000,
		Tax:           220000,
		Total:         2220000,
		ClientCompany: "PT Maju Jaya Abadi",
		ClientPIC:     "Budi Santoso",
		ClientEmail:   "budi@majujaya.co.id",
		ClientAddress: "Jl. Pemuda No. 45, Karawaci, Tangerang, Banten 15810",
		Items: []services.InvoiceItemData{
			{Name: "Web Hosting Business", Qty: 2, Price: 750000, Total: 1500000},
			{Name: "Domain .com", Qty: 1, Price: 150000, Total: 150000},
			{Name: "SSL Certificate", Qty: 1, Price: 350000, Total: 350000},
		},
	}

	pdfBytes, err := h.PDF.RenderInvoicePDF(dummy)
	if err != nil {
		http.Error(w, "Gagal membuat PDF: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fileName := "Invoice-INV-2026-08-001.pdf"
	if err := h.Service.SendDocument(req.Phone, fileName, pdfBytes); err != nil {
		http.Error(w, "Gagal mengirim dokumen: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"sent":      true,
		"phone":     req.Phone,
		"file_name": fileName,
		"size":      len(pdfBytes),
	})
}