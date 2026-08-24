package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

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
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Token tidak ditemukan", http.StatusUnauthorized)
		return
	}
	token := strings.TrimPrefix(authHeader, "Bearer ")

	profile, err := h.AuthService.GetProfileByToken(token)
	if err != nil {
		http.Error(w, "Token tidak valid", http.StatusUnauthorized)
		return
	}

	client, err := h.Service.GetClientByProfileID(profile.ID)
	if err != nil {
		if err == pgx.ErrNoRows {
			http.Error(w, "Client tidak ditemukan", http.StatusNotFound)
		} else {
			http.Error(w, "Gagal memverifikasi client: "+err.Error(), http.StatusInternalServerError)
		}
		return
	}

	invoices, err := h.Service.GetInvoicesByClientID(client.ID)
	if err != nil {
		http.Error(w, "Gagal mengambil data invoice", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(invoices)
}

func (h *InvoiceHandler) GetInvoiceByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	invoice, err := h.Service.GetInvoiceByID(id)
	if err != nil {
		http.Error(w, "Gagal mengambil invoice", http.StatusInternalServerError)
		return
	}
	if invoice == nil {
		http.Error(w, "Invoice tidak ditemukan", http.StatusNotFound)
		return
	}

	timeline, err := h.Service.GetInvoiceTimeline(invoice)
	if err != nil {
		http.Error(w, "Gagal mengambil timeline", http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"invoice":  invoice,
		"timeline": timeline,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func (h *InvoiceHandler) CreateInvoice(w http.ResponseWriter, r *http.Request) {
	var req models.CreateInvoiceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	invoice, err := h.Service.CreateInvoice(req)
	if err != nil {
		http.Error(w, "Gagal membuat invoice: "+err.Error(), http.StatusInternalServerError)
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
		http.Error(w, "Gagal mengupdate invoice: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
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