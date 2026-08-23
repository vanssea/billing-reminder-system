package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

type PaymentHandler struct {
	Service *services.PaymentService
}

func NewPaymentHandler(service *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{
		Service: service,
	}
}

func (h *PaymentHandler) writePaymentError(w http.ResponseWriter, err error) {
	message := err.Error()

	if strings.Contains(message, "tidak ditemukan") {
		http.Error(w, message, http.StatusNotFound)
		return
	}

	http.Error(w, message, http.StatusInternalServerError)
}

func (h *PaymentHandler) GetPayments(w http.ResponseWriter, r *http.Request) {
	payments, err := h.Service.GetPayments(r.Context())

	if err != nil {
		h.writePaymentError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(payments)
}

func (h *PaymentHandler) GetPaymentByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	payment, err := h.Service.GetPaymentByID(r.Context(), id)

	if err != nil {
		h.writePaymentError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(payment)
}

func (h *PaymentHandler) ApprovePayment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.ApprovePaymentRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err.Error() != "EOF" {
		http.Error(w, "Request tidak valid", http.StatusBadRequest)
		return
	}

	payment, err := h.Service.ApprovePayment(r.Context(), id, req)

	if err != nil {
		message := err.Error()

		if strings.Contains(message, "tidak ditemukan") {
			http.Error(w, message, http.StatusNotFound)
			return
		}

		if strings.Contains(message, "sudah") || strings.Contains(message, "tidak bisa") {
			http.Error(w, message, http.StatusBadRequest)
			return
		}

		h.writePaymentError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(payment)
}

func (h *PaymentHandler) RejectPayment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.RejectPaymentRequest

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil && err.Error() != "EOF" {
		http.Error(w, "Request tidak valid", http.StatusBadRequest)
		return
	}

	payment, err := h.Service.RejectPayment(r.Context(), id, req)

	if err != nil {
		message := err.Error()

		if strings.Contains(message, "tidak ditemukan") {
			http.Error(w, message, http.StatusNotFound)
			return
		}

		if strings.Contains(message, "sudah") || strings.Contains(message, "tidak bisa") {
			http.Error(w, message, http.StatusBadRequest)
			return
		}

		h.writePaymentError(w, err)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	json.NewEncoder(w).Encode(payment)
}
