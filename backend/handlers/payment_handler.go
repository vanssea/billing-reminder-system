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
			log.Printf("GetPaymentsByClientID: gagal memverifikasi client %s: %v", profile.ID, err)
			http.Error(w, "Gagal memverifikasi client", http.StatusInternalServerError)
		}
		return
	}

	payments, err := h.Service.GetPaymentsByClientID(client.ID)
	if err != nil {
		log.Printf("GetPaymentsByClientID: %v", err)
		http.Error(w, "Gagal mengambil data pembayaran", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payments)
}

func (h *PaymentHandler) GetPaymentByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	profile := middleware.ProfileFromContext(r)

	// CLIENT dan role non-staf hanya boleh melihat payment miliknya sendiri.
	if profile != nil && !models.IsStaffRole(profile.Role) {
		client, err := h.Service.GetClientByProfileID(profile.ID)
		if err != nil {
			http.Error(w, "Client tidak ditemukan", http.StatusNotFound)
			return
		}

		owned, err := h.Service.PaymentBelongsToClient(r.Context(), id, client.ID)
		if err != nil {
			log.Printf("PaymentBelongsToClient: %v", err)
			http.Error(w, "Gagal mengambil pembayaran", http.StatusInternalServerError)
			return
		}
		if !owned {
			http.Error(w, "Pembayaran tidak ditemukan", http.StatusNotFound)
			return
		}
	}

	payment, err := h.Service.GetPaymentByID(id)
	if err != nil {
		log.Printf("GetPaymentByID: %v", err)
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

func (h *PaymentHandler) GetPayments(w http.ResponseWriter, r *http.Request) {
	payments, err := h.Service.GetPayments(r.Context())
	if err != nil {
		http.Error(w, "Gagal mengambil data pembayaran", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payments)
}

func (h *PaymentHandler) ApprovePayment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.ApprovePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	// verified_by diambil dari identitas terautentikasi, bukan dari body.
	if profile := middleware.ProfileFromContext(r); profile != nil {
		req.VerifiedBy = &profile.ID
	}

	payment, err := h.Service.ApprovePayment(r.Context(), id, req)
	if err != nil {
		message := err.Error()

		if strings.Contains(message, "tidak ditemukan") {
			http.Error(w, message, http.StatusNotFound)
			return
		}

		if strings.Contains(message, "sudah") {
			http.Error(w, message, http.StatusConflict)
			return
		}

		if strings.Contains(message, "dibatalkan") || strings.Contains(message, "belum dikirim") {
			http.Error(w, message, http.StatusConflict)
			return
		}

		log.Printf("ApprovePayment %s: %v", id, err)
		http.Error(w, "Gagal menyetujui pembayaran", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payment)
}

func (h *PaymentHandler) RejectPayment(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.RejectPaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	// verified_by diambil dari identitas terautentikasi, bukan dari body.
	if profile := middleware.ProfileFromContext(r); profile != nil {
		req.VerifiedBy = &profile.ID
	}

	payment, err := h.Service.RejectPayment(r.Context(), id, req)
	if err != nil {
		message := err.Error()

		if strings.Contains(message, "tidak ditemukan") {
			http.Error(w, message, http.StatusNotFound)
			return
		}

		if strings.Contains(message, "sudah") {
			http.Error(w, message, http.StatusConflict)
			return
		}

		log.Printf("RejectPayment %s: %v", id, err)
		http.Error(w, "Gagal menolak pembayaran", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(payment)
}

func (h *PaymentHandler) CreatePayment(w http.ResponseWriter, r *http.Request) {
	profile := middleware.ProfileFromContext(r)
	if profile == nil {
		http.Error(w, "Belum terautentikasi", http.StatusUnauthorized)
		return
	}

	var req models.CreatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	// CLIENT hanya boleh membuat payment untuk invoice miliknya sendiri.
	client, err := h.Service.GetClientByProfileID(profile.ID)
	if err != nil {
		http.Error(w, "Client tidak ditemukan", http.StatusNotFound)
		return
	}

	if !models.IsStaffRole(profile.Role) {
		owned, err := h.Service.InvoiceBelongsToClient(r.Context(), req.InvoiceID, client.ID)
		if err != nil {
			log.Printf("InvoiceBelongsToClient: %v", err)
			http.Error(w, "Gagal memvalidasi invoice", http.StatusInternalServerError)
			return
		}
		if !owned {
			http.Error(w, "Invoice tidak ditemukan", http.StatusForbidden)
			return
		}
	}

	payment, err := h.Service.CreatePayment(req)
	if err != nil {
		message := err.Error()

		if strings.Contains(message, "tidak ditemukan") {
			http.Error(w, message, http.StatusNotFound)
			return
		}

		if strings.Contains(message, "tidak dapat") {
			http.Error(w, message, http.StatusConflict)
			return
		}

		log.Printf("CreatePayment: %v", err)
		http.Error(w, "Gagal membuat pembayaran", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(payment)
}

func (h *PaymentHandler) UpdatePayment(w http.ResponseWriter, r *http.Request) {
	// Handler ini tidak diekspos via route (dead code). Guard defensif:
	// hanya staff (ADMIN/SUPERADMIN) yang boleh memanggil bila diekspos.
	profile := middleware.ProfileFromContext(r)
	if profile == nil || (profile.Role != models.RoleAdmin && profile.Role != models.RoleSuperadmin) {
		http.Error(w, "Akses ditolak", http.StatusForbidden)
		return
	}

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
	// Handler ini tidak diekspos via route (dead code). Guard defensif:
	// hanya staff (ADMIN/SUPERADMIN) yang boleh memanggil bila diekspos.
	profile := middleware.ProfileFromContext(r)
	if profile == nil || (profile.Role != models.RoleAdmin && profile.Role != models.RoleSuperadmin) {
		http.Error(w, "Akses ditolak", http.StatusForbidden)
		return
	}

	id := chi.URLParam(r, "id")

	err := h.Service.DeletePayment(id)
	if err != nil {
		http.Error(w, "Gagal menghapus pembayaran: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
