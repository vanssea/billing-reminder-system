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

type PaymentHandler struct {
	Service     *services.PaymentService
	AuthService *services.AuthService
}

func NewPaymentHandler(service *services.PaymentService, authService *services.AuthService) *PaymentHandler {
	return &PaymentHandler{
		Service:     service,
		AuthService: authService,
	}
}

func (h *PaymentHandler) GetPaymentsByClientID(w http.ResponseWriter, r *http.Request) {
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

	payments, err := h.Service.GetPaymentsByClientID(client.ID)
	if err != nil {
		http.Error(w, "Gagal mengambil data pembayaran", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payments)
}

func (h *PaymentHandler) GetPaymentByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	payment, err := h.Service.GetPaymentByID(id)
	if err != nil {
		http.Error(w, "Gagal mengambil pembayaran", http.StatusInternalServerError)
		return
	}
	if payment == nil {
		http.Error(w, "Pembayaran tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payment)
}

func (h *PaymentHandler) CreatePayment(w http.ResponseWriter, r *http.Request) {
	var req models.CreatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	payment, err := h.Service.CreatePayment(req)
	if err != nil {
		http.Error(w, "Gagal membuat pembayaran: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(payment)
}

func (h *PaymentHandler) UpdatePayment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.UpdatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	payment, err := h.Service.UpdatePayment(id, req)
	if err != nil {
		http.Error(w, "Gagal mengupdate pembayaran: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payment)
}

func (h *PaymentHandler) DeletePayment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.Service.DeletePayment(id)
	if err != nil {
		http.Error(w, "Gagal menghapus pembayaran: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
