package handlers

import (
	"encoding/json"
	"net/http"

	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

type InvoiceHandler struct {
	Service *services.InvoiceService
}

func NewInvoiceHandler(service *services.InvoiceService) *InvoiceHandler {
	return &InvoiceHandler{
		Service: service,
	}
}

func (h *InvoiceHandler) GetInvoices(w http.ResponseWriter, r *http.Request) {
	invoices, err := h.Service.GetInvoices()

	if err != nil {
		http.Error(w, "Gagal mengambil invoice", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(invoices)
}

func (h *InvoiceHandler) GetInvoiceByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	invoice, err := h.Service.GetInvoiceByID(id)

	if err != nil {
		http.Error(w, "Invoice tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(invoice)
}

func (h *InvoiceHandler) CreateInvoice(w http.ResponseWriter, r *http.Request) {
	var req models.CreateInvoiceRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Request tidak valid", http.StatusBadRequest)
		return
	}

	invoice, err := h.Service.CreateInvoice(req)

	if err != nil {
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
		http.Error(w, "Request tidak valid", http.StatusBadRequest)
		return
	}

	invoice, err := h.Service.UpdateInvoice(id, req)

	if err != nil {
		http.Error(w, "Gagal memperbarui invoice", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(invoice)
}

func (h *InvoiceHandler) DeleteInvoice(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.Service.DeleteInvoice(id)

	if err != nil {
		http.Error(w, "Gagal menghapus invoice", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}