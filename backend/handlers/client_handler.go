package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

type ClientHandler struct {
	Service     *services.ClientService
	AuthService *services.AuthService
}

func NewClientHandler(clientService *services.ClientService, authService *services.AuthService) *ClientHandler {
	return &ClientHandler{
		Service:     clientService,
		AuthService: authService,
	}
}

func (h *ClientHandler) GetClients(w http.ResponseWriter, r *http.Request) {
	page, _ := strconv.Atoi(r.URL.Query().Get("page"))
	limit, _ := strconv.Atoi(r.URL.Query().Get("limit"))
	search := r.URL.Query().Get("search")
	status := r.URL.Query().Get("status")

	clients, err := h.Service.GetClients(r.Context(), search, status, page, limit)
	if err != nil {
		http.Error(w, "Gagal mengambil data clients: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(clients)
}

func (h *ClientHandler) CreateClient(w http.ResponseWriter, r *http.Request) {
	var req services.CreateClientRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	profile := middleware.ProfileFromContext(r)
	if profile == nil {
		http.Error(w, "Belum terautentikasi", http.StatusUnauthorized)
		return
	}
	client, err := h.Service.CreateClient(r.Context(), profile.ID, req)
	if err != nil {
		http.Error(w, "Gagal membuat client: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(client)
}

func (h *ClientHandler) GetClientByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	client, err := h.Service.GetClientByID(r.Context(), id)
	if err != nil {
		http.Error(w, "Client tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(client)
}

func (h *ClientHandler) UpdateClient(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req services.UpdateClientRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	profile := middleware.ProfileFromContext(r)
	if profile == nil {
		http.Error(w, "Belum terautentikasi", http.StatusUnauthorized)
		return
	}
	client, err := h.Service.UpdateClient(r.Context(), profile.ID, id, req)
	if err != nil {
		http.Error(w, "Gagal mengupdate client: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(client)
}

func (h *ClientHandler) UpdateClientStatus(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")
	var req struct {
		Status string `json:"status"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	profile := middleware.ProfileFromContext(r)
	if profile == nil {
		http.Error(w, "Belum terautentikasi", http.StatusUnauthorized)
		return
	}
	err := h.Service.UpdateClientStatus(r.Context(), profile.ID, id, req.Status)
	if err != nil {
		http.Error(w, "Gagal mengubah status client: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ClientHandler) DeleteClient(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.Service.DeleteClient(id)
	if err != nil {
		if errors.Is(err, services.ErrClientHasInvoices) {
			http.Error(w, err.Error(), http.StatusConflict)
			return
		}
		http.Error(w, "Gagal menghapus client: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ClientHandler) GetClientByProfileID(w http.ResponseWriter, r *http.Request) {
	profileID := chi.URLParam(r, "profile_id")

	// CLIENT dan role non-staf hanya boleh mengakses data client miliknya;
	// ADMIN/SUPERADMIN boleh melihat semua.
	if profile := middleware.ProfileFromContext(r); profile != nil && !models.IsStaffRole(profile.Role) {
		if profileID != profile.ID {
			http.Error(w, "Client tidak ditemukan", http.StatusNotFound)
			return
		}
	}

	client, err := h.Service.GetClientByProfileID(profileID)
	if err != nil {
		http.Error(w, "Client tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(client)
}

func (h *ClientHandler) CreateOrUpdateClientProfile(w http.ResponseWriter, r *http.Request) {
	// Identitas dari middleware: profile_id selalu milik token, bukan body.
	profile := middleware.ProfileFromContext(r)
	if profile == nil {
		http.Error(w, "Belum terautentikasi", http.StatusUnauthorized)
		return
	}

	var req services.UpdateClientRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	client, err := h.Service.CreateOrUpdateClientByProfileID(profile.ID, req)
	if err != nil {
		log.Printf("CreateOrUpdateClientProfile %s: %v", profile.ID, err)
		http.Error(w, "Gagal menyimpan profil", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(client)
}