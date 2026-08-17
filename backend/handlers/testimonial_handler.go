package handlers

import (
	"encoding/json"
	"net/http"

	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

type TestimonialHandler struct {
	Service *services.TestimonialService
}

func NewTestimonialHandler(service *services.TestimonialService) *TestimonialHandler {
	return &TestimonialHandler{
		Service: service,
	}
}

func (h *TestimonialHandler) GetTestimonials(w http.ResponseWriter, r *http.Request) {
	testimonials, err := h.Service.GetTestimonials()
	if err != nil {
		http.Error(w, "Gagal mengambil data testimonials", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(testimonials)
}
func (h *TestimonialHandler) CreateTestimonial(w http.ResponseWriter, r *http.Request) {
	var req models.CreateTestimonialRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	testimonial, err := h.Service.CreateTestimonial(req)
	if err != nil {
		http.Error(w, "Gagal membuat testimonial: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(testimonial)
}
func (h *TestimonialHandler) GetTestimonialByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	testimonial, err := h.Service.GetTestimonialByID(id)
	if err != nil {
		http.Error(w, "Testimonial tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(testimonial)
}
func (h *TestimonialHandler) UpdateTestimonial(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.UpdateTestimonialRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	testimonial, err := h.Service.UpdateTestimonial(id, req)
	if err != nil {
		http.Error(w, "Gagal mengupdate testimonial: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(testimonial)
}
func (h *TestimonialHandler) DeleteTestimonial(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.Service.DeleteTestimonial(id)
	if err != nil {
		http.Error(w, "Gagal menghapus testimonial: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}