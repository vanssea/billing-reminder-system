package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"

	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
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
	limit := 0
	if raw := r.URL.Query().Get("limit"); raw != "" {
		if n, err := strconv.Atoi(raw); err == nil && n > 0 {
			limit = n
		}
	}

	testimonials, err := h.Service.GetTestimonials(limit)
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

func (h *TestimonialHandler) GetClientEligibility(w http.ResponseWriter, r *http.Request) {
	profile := middleware.ProfileFromContext(r)
	if profile == nil {
		http.Error(w, "Belum terautentikasi", http.StatusUnauthorized)
		return
	}

	eligibility, err := h.Service.GetClientEligibility(profile.ID)
	if err != nil {
		// Akun baru belum punya baris clients: anggap belum memenuhi syarat,
		// bukan error.
		if errors.Is(err, pgx.ErrNoRows) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(models.TestimonialEligibilityResponse{
				HasApprovedPurchase: false,
				HasTestimonial:      false,
				ApprovedPurchases:   []models.PurchaseRequestModel{},
			})
			return
		}
		http.Error(w, "Gagal memeriksa kelayakan testimoni", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(eligibility)
}

func (h *TestimonialHandler) CreateClientTestimonial(w http.ResponseWriter, r *http.Request) {	profile := middleware.ProfileFromContext(r)
	if profile == nil {
		http.Error(w, "Belum terautentikasi", http.StatusUnauthorized)
		return
	}

	var req models.CreateClientTestimonialRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	if req.Quote == "" {
		http.Error(w, "Testimoni wajib diisi", http.StatusBadRequest)
		return
	}
	if req.Rating < 1 || req.Rating > 5 {
		http.Error(w, "Rating harus antara 1 dan 5", http.StatusBadRequest)
		return
	}

	testimonial, err := h.Service.CreateClientTestimonial(profile.ID, req)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(testimonial)
}