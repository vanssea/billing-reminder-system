package handlers

import (
	"encoding/json"
	"net/http"

	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

type ReminderHandler struct {
	Service *services.ReminderService
}

func NewReminderHandler(service *services.ReminderService) *ReminderHandler {
	return &ReminderHandler{
		Service: service,
	}
}

func (h *ReminderHandler) GetReminders(w http.ResponseWriter, r *http.Request) {
	reminders, err := h.Service.GetReminders(r.Context())
	if err != nil {
		http.Error(
			w,
			"Gagal mengambil data reminder",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")

	if err := json.NewEncoder(w).Encode(reminders); err != nil {
		http.Error(
			w,
			"Gagal mengirim response",
			http.StatusInternalServerError,
		)
		return
	}
}

func (h *ReminderHandler) RetryReminder(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	if id == "" {
		http.Error(w, "ID reminder wajib diisi", http.StatusBadRequest)
		return
	}

	reminder, err := h.Service.RetryReminder(r.Context(), id)
	if err != nil {
		http.Error(
			w,
			"Gagal melakukan retry reminder",
			http.StatusInternalServerError,
		)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(reminder)
}