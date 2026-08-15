package handlers

import (
	"encoding/json"
	"net/http"

	"billing-reminder-system/services"
)

type ClientHandler struct {
	Service *services.ClientService
}

func NewClientHandler(service *services.ClientService) *ClientHandler {
	return &ClientHandler{
		Service: service,
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