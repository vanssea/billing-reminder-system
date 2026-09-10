package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

type InvoiceHandler struct {
	Service     *services.InvoiceService
	AuthService *services.AuthService
}

func NewInvoiceHandler(service *services.InvoiceService, authService *services.AuthService) *InvoiceHandler {
	return &InvoiceHandler{
		Service:     service,
		AuthService: authService,
	}
}

func (h *InvoiceHandler) GetInvoicesByClientID(w http.ResponseWriter, r *http.Request) {
	profile := middleware.ProfileFromContext(r)
	if profile == nil {
		http.Error(w, "Belum terautentikasi", http.StatusUnauthorized)
		return
	}

	client, err := h.Service.GetClientByProfileID(profile.ID)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Client tidak ditemukan", http.StatusNotFound)
		} else {
			log.Printf("GetInvoicesByClientID: gagal memverifikasi client %s: %v", profile.ID, err)
			http.Error(w, "Gagal memverifikasi client", http.StatusInternalServerError)
		}
		return
	}

	invoices, err := h.Service.GetInvoicesByClientID(client.ID)
	if err != nil {
		log.Printf("GetInvoicesByClientID: %v", err)
		http.Error(w, "Gagal mengambil data invoice", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoices)
}

func (h *InvoiceHandler) GetInvoices(w http.ResponseWriter, r *http.Request) {
	invoices, err := h.Service.GetInvoices()
	if err != nil {
		http.Error(w, "Gagal mengambil data invoice", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoices)
}

func (h *InvoiceHandler) fetchInvoice(idOrNumber string) (*models.Invoice, error) {
	invoice, err := h.Service.GetInvoiceByID(idOrNumber)
	if err == nil && invoice != nil {
		return invoice, nil
	}
	return h.Service.GetInvoiceByNumber(idOrNumber)
}

func (h *InvoiceHandler) GetInvoiceByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	profile := middleware.ProfileFromContext(r)

	if profile != nil && !models.IsStaffRole(profile.Role) {
		client, err := h.Service.GetClientByProfileID(profile.ID)
		if err != nil {
			http.Error(w, "Client tidak ditemukan", http.StatusNotFound)
			return
		}

		invoice, err := h.fetchInvoice(id)
		if err != nil {
			log.Printf("GetInvoiceByID: %v", err)
			http.Error(w, "Gagal mengambil invoice", http.StatusInternalServerError)
			return
		}
		if invoice == nil || invoice.ClientID != client.ID {
			http.Error(w, "Invoice tidak ditemukan", http.StatusNotFound)
			return
		}

		h.serveInvoiceDetail(w, invoice)
		return
	}

	invoice, err := h.fetchInvoice(id)
	if err != nil {
		log.Printf("GetInvoiceByID: %v", err)
		http.Error(w, "Gagal mengambil invoice", http.StatusInternalServerError)
		return
	}
	if invoice == nil {
		http.Error(w, "Invoice tidak ditemukan", http.StatusNotFound)
		return
	}

	h.serveInvoiceDetail(w, invoice)
}

func (h *InvoiceHandler) serveInvoiceDetail(w http.ResponseWriter, invoice *models.Invoice) {
	timeline, err := h.Service.GetInvoiceTimeline(invoice)
	if err != nil {
		log.Printf("GetInvoiceTimeline: %v", err)
		http.Error(w, "Gagal mengambil timeline", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"invoice":  invoice,
		"timeline": timeline,
	})
}

func (h *InvoiceHandler) CreateInvoice(w http.ResponseWriter, r *http.Request) {
	var req models.CreateInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	// created_by selalu diambil dari identitas terautentikasi, bukan body.
	if profile := middleware.ProfileFromContext(r); profile != nil {
		req.CreatedBy = &profile.ID
	}

	invoice, err := h.Service.CreateInvoice(req)
	if err != nil {
		log.Printf("CreateInvoice: %v", err)
		http.Error(w, "Gagal membuat invoice", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(invoice)
}

func (h *InvoiceHandler) UpdateInvoice(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.UpdateInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	invoice, err := h.Service.UpdateInvoice(id, req)
	if err != nil {
		if strings.Contains(err.Error(), "tidak dapat") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		http.Error(w, "Gagal mengupdate invoice: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoice)
}

func (h *InvoiceHandler) SendInvoice(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	invoice, delivery, err := h.Service.SendInvoice(id)

	if err != nil {
		message := err.Error()

		if strings.Contains(message, "ditemukan") {
			http.Error(w, message, http.StatusNotFound)
			return
		}

		if strings.Contains(message, "hanya invoice") {
			http.Error(w, message, http.StatusBadRequest)
			return
		}

		http.Error(w, message, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if delivery != nil {
		json.NewEncoder(w).Encode(map[string]any{
			"invoice":  invoice,
			"delivery": delivery,
		})
		return
	}

	json.NewEncoder(w).Encode(invoice)
}

func (h *InvoiceHandler) DeleteInvoice(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.Service.DeleteInvoice(id)
	if err != nil {
		http.Error(w, "Gagal menghapus invoice: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
