package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

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
	clients, err := h.Service.GetClients()
	if err != nil {
		http.Error(w, "Gagal mengambil data clients", http.StatusInternalServerError)
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

	client, err := h.Service.CreateClient(req)
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

	client, err := h.Service.GetClientByID(id)
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

	client, err := h.Service.UpdateClient(id, req)
	if err != nil {
		http.Error(w, "Gagal mengupdate client: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(client)
}
func (h *ClientHandler) DeleteClient(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.Service.DeleteClient(id)
	if err != nil {
		http.Error(w, "Gagal menghapus client: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *ClientHandler) GetClientByProfileID(w http.ResponseWriter, r *http.Request) {
	profileID := chi.URLParam(r, "profile_id")

	client, err := h.Service.GetClientByProfileID(profileID)
	if err != nil {
		http.Error(w, "Client tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(client)
}

func (h *ClientHandler) CreateOrUpdateClientProfile(w http.ResponseWriter, r *http.Request) {
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

	var req services.UpdateClientRequest
	err = json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	client, err := h.Service.CreateOrUpdateClientByProfileID(profile.ID, req)
	if err != nil {
		http.Error(w, "Gagal menyimpan profil: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(client)
}