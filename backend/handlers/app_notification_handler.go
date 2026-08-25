package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

type AppNotificationHandler struct {
	Service     *services.AppNotificationService
	AuthService *services.AuthService
}

func NewAppNotificationHandler(service *services.AppNotificationService, authService *services.AuthService) *AppNotificationHandler {
	return &AppNotificationHandler{Service: service, AuthService: authService}
}

// notificationScope menentukan scope notifikasi berdasarkan identitas
// terautentikasi (middleware), BUKAN dari parameter request.
//
//	ADMIN/SUPERADMIN -> feed internal yang sama (ADMIN + SUPERADMIN + ALL)
//	CLIENT           -> hanya notifikasi yang ditujukan ke profile-nya
func notificationScope(r *http.Request) (roles []string, profileID string) {
	profile := middleware.ProfileFromContext(r)
	if profile == nil {
		return []string{models.NotifRoleAll}, ""
	}

	switch profile.Role {
	case models.RoleSuperadmin, models.RoleAdmin:
		return []string{models.NotifRoleSuperadmin, models.NotifRoleAdmin, models.NotifRoleAll}, ""
	case models.RoleClient:
		return []string{models.NotifRoleClient}, profile.ID
	default:
		return []string{models.NotifRoleAll}, ""
	}
}

// ListNotifications GET /api/notifications?limit=15
// Mengembalikan daftar notifikasi sekaligus jumlah belum dibaca dalam
// satu panggilan agar polling frontend hemat.
func (h *AppNotificationHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	roles, profileID := notificationScope(r)

	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit <= 0 {
		limit = 15
	}

	data, err := h.Service.List(r.Context(), roles, limit, profileID)
	if err != nil {
		log.Printf("ListNotifications: %v", err)
		http.Error(w, "Gagal memuat notifikasi", http.StatusInternalServerError)
		return
	}
	if data == nil {
		data = []models.AppNotification{}
	}

	unread, err := h.Service.CountUnread(r.Context(), roles, profileID)
	if err != nil {
		log.Printf("CountUnread: %v", err)
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

	roles, profileID := notificationScope(r)

	updated, err := h.Service.MarkRead(r.Context(), id, roles, profileID)
	if err != nil {
		log.Printf("MarkRead %d: %v", id, err)
		http.Error(w, "Gagal menandai notifikasi dibaca", http.StatusInternalServerError)
		return
	}
	if updated == 0 {
		http.Error(w, "Notifikasi tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "ok"})
}

// MarkAllRead PUT /api/notifications/read-all
func (h *AppNotificationHandler) MarkAllRead(w http.ResponseWriter, r *http.Request) {
	roles, profileID := notificationScope(r)

	updated, err := h.Service.MarkAllRead(r.Context(), roles, profileID)
	if err != nil {
		log.Printf("MarkAllRead: %v", err)
		http.Error(w, "Gagal menandai semua notifikasi dibaca", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "ok",
		"updated": updated,
	})
}
