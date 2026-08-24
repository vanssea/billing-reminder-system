package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

type PurchaseHandler struct {
	Service     *services.PurchaseService
	AuthService *services.AuthService
}

func NewPurchaseHandler(service *services.PurchaseService, authService *services.AuthService) *PurchaseHandler {
	return &PurchaseHandler{
		Service:     service,
		AuthService: authService,
	}
}

func (h *PurchaseHandler) CreatePurchaseRequest(w http.ResponseWriter, r *http.Request) {
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

	var req models.PurchaseRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	if req.ProductID == "" {
		http.Error(w, "Product ID wajib diisi", http.StatusBadRequest)
		return
	}
	if req.BillingCycle != "monthly" && req.BillingCycle != "yearly" {
		http.Error(w, "Billing cycle harus monthly atau yearly", http.StatusBadRequest)
		return
	}

	resp, err := h.Service.CreatePurchaseRequest(profile.ID, req)
	if err != nil {
		if strings.Contains(err.Error(), "lengkapi data profil") {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		if strings.Contains(err.Error(), "tidak ditemukan") || strings.Contains(err.Error(), "tidak tersedia") {
			http.Error(w, err.Error(), http.StatusNotFound)
			return
		}
		log.Printf("DB error CreatePurchaseRequest: %v", err)
		http.Error(w, "Gagal membuat permintaan pembelian: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(resp)
}

func (h *PurchaseHandler) GetMyPurchaseRequests(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Token tidak ditemukan", http.StatusUnauthorized)
		return
	}
	token := strings.TrimPrefix(authHeader, "Bearer ")

	profile, err := h.Service.ClientService.GetClientByProfileID(token)
	if err != nil {
		http.Error(w, "Token tidak valid", http.StatusUnauthorized)
		return
	}

	requests, err := h.Service.GetPurchaseRequestsByClientID(profile.ID)
	if err != nil {
		http.Error(w, "Gagal mengambil data permintaan pembelian", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(requests)
}

func (h *PurchaseHandler) GetPurchaseRequestByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	req, err := h.Service.GetPurchaseRequestByID(id)
	if err != nil {
		http.Error(w, "Gagal mengambil data permintaan pembelian", http.StatusInternalServerError)
		return
	}
	if req == nil {
		http.Error(w, "Permintaan pembelian tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(req)
}

func (h *PurchaseHandler) UpdatePurchaseRequestStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req struct {
		Status      string  `json:"status"`
		AdminNotes  *string `json:"admin_notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	validStatuses := map[string]bool{"PENDING": true, "APPROVED": true, "REJECTED": true, "CANCELLED": true}
	if !validStatuses[req.Status] {
		http.Error(w, "Status tidak valid", http.StatusBadRequest)
		return
	}

	updated, err := h.Service.UpdatePurchaseRequestStatus(id, req.Status, req.AdminNotes)
	if err != nil {
		http.Error(w, "Gagal mengupdate status: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updated)
}