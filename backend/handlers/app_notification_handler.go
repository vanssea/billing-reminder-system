package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"strings"

	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

type AppNotificationHandler struct {
	Service *services.AppNotificationService
}

func NewAppNotificationHandler(service *services.AppNotificationService) *AppNotificationHandler {
	return &AppNotificationHandler{Service: service}
}

// roleFilter mengubah query param role menjadi daftar target_role
// yang boleh dilihat. Role tidak dikenal hanya melihat notifikasi ALL.
func roleFilter(r *http.Request) []string {
	switch strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("role"))) {
	case "SUPERADMIN":
		return []string{models.NotifRoleSuperadmin, models.NotifRoleAll}
	case "ADMIN":
		return []string{models.NotifRoleAdmin, models.NotifRoleAll}
	default:
		return []string{models.NotifRoleAll}
	}
}

// ListNotifications GET /api/notifications?role=SUPERADMIN&limit=15
// Mengembalikan daftar notifikasi sekaligus jumlah belum dibaca dalam
// satu panggilan agar polling frontend hemat.
func (h *AppNotificationHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	roles := roleFilter(r)

	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit <= 0 {
		limit = 15
	}

	data, err := h.Service.List(r.Context(), roles, limit)
	if err != nil {
		http.Error(w, "Gagal memuat notifikasi", http.StatusInternalServerError)
		return
	}
	if data == nil {
		data = []models.AppNotification{}
	}

	unread, err := h.Service.CountUnread(r.Context(), roles)
	if err != nil {
		http.Error(w, "Gagal menghitung notifikasi", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"data":         data,
		"unread_count": unread,
	})
}

// MarkRead PUT /api/notifications/{id}/read
func (h *AppNotificationHandler) MarkRead(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.ParseInt(chi.URLParam(r, "id"), 10, 64)
	if err != nil || id <= 0 {
		http.Error(w, "ID notifikasi tidak valid", http.StatusBadRequest)
		return
	}

	if err := h.Service.MarkRead(r.Context(), id); err != nil {
		http.Error(w, "Gagal menandai notifikasi dibaca", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// MarkAllRead PUT /api/notifications/read-all?role=SUPERADMIN
func (h *AppNotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	updated, err := h.Service.MarkAllRead(r.Context(), roleFilter(r))
	if err != nil {
		http.Error(w, "Gagal menandai semua notifikasi dibaca", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"updated": updated,
	})
}
