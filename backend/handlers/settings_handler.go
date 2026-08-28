package handlers

import (
	"encoding/json"
	"net/http"

	"billing-reminder-system/middleware"
	"billing-reminder-system/services"
)

type SettingsHandler struct {
	Service *services.SettingsService
}

func NewSettingsHandler(service *services.SettingsService) *SettingsHandler {
	return &SettingsHandler{
		Service: service,
	}
}

func (h *SettingsHandler) GetSettings(w http.ResponseWriter, r *http.Request) {
	settings, err := h.Service.GetSettings(r.Context())
	if err != nil {
		http.Error(w, "Gagal mengambil pengaturan", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(settings); err != nil {
		http.Error(w, "Gagal mengirim response", http.StatusInternalServerError)
		return
	}
}

func (h *SettingsHandler) UpdateSettings(w http.ResponseWriter, r *http.Request) {
	var req services.UpdateReminderSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	updatedBy := ""
	if profile := middleware.ProfileFromContext(r); profile != nil {
		updatedBy = profile.ID
	}

	settings, err := h.Service.UpdateReminderSettings(r.Context(), req, updatedBy)
	if err != nil {
		http.Error(w, "Gagal menyimpan pengaturan: "+err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(settings); err != nil {
		http.Error(w, "Gagal mengirim response", http.StatusInternalServerError)
		return
	}
}