package handlers

import (
	"encoding/json"
	"net/http"

	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

type FAQHandler struct {
	Service *services.FAQService
}

func NewFAQHandler(service *services.FAQService) *FAQHandler {
	return &FAQHandler{
		Service: service,
	}
}

func (h *FAQHandler) GetFAQs(w http.ResponseWriter, r *http.Request) {
	faqs, err := h.Service.GetFAQs()
	if err != nil {
		http.Error(w, "Gagal mengambil data faqs", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(faqs)
}
func (h *FAQHandler) CreateFAQ(w http.ResponseWriter, r *http.Request) {
	var req models.CreateFAQRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	faq, err := h.Service.CreateFAQ(req)
	if err != nil {
		http.Error(w, "Gagal membuat faq: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(faq)
}
func (h *FAQHandler) GetFAQByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	faq, err := h.Service.GetFAQByID(id)
	if err != nil {
		http.Error(w, "FAQ tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(faq)
}
func (h *FAQHandler) UpdateFAQ(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.UpdateFAQRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	faq, err := h.Service.UpdateFAQ(id, req)
	if err != nil {
		http.Error(w, "Gagal mengupdate faq: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(faq)
}
func (h *FAQHandler) DeleteFAQ(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.Service.DeleteFAQ(id)
	if err != nil {
		http.Error(w, "Gagal menghapus faq: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}