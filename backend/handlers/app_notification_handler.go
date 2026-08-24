package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"

	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

var errMissingToken = errors.New("bearer token tidak ditemukan")

type AppNotificationHandler struct {
	Service *services.AppNotificationService
	Auth    *services.AuthService
}

func NewAppNotificationHandler(service *services.AppNotificationService, authService *services.AuthService) *AppNotificationHandler {
	return &AppNotificationHandler{Service: service, Auth: authService}
}

// roleFilter mengubah query param role menjadi daftar target_role yang
// boleh dilihat. ADMIN dan SUPERADMIN melihat feed internal yang sama;
// CLIENT memiliki feed terpisah (notifikasi khusus akunnya).
func roleFilter(r *http.Request) []string {
	switch strings.ToUpper(strings.TrimSpace(r.URL.Query().Get("role"))) {
	case "SUPERADMIN":
		return []string{models.NotifRoleSuperadmin, models.NotifRoleAdmin, models.NotifRoleAll}
	case "ADMIN":
		return []string{models.NotifRoleSuperadmin, models.NotifRoleAdmin, models.NotifRoleAll}
	case "CLIENT":
		return []string{models.NotifRoleClient}
	default:
		return []string{models.NotifRoleAll}
	}
}

// clientProfileID mengambil ID profile dari Bearer token pada request.
// Wajib untuk role CLIENT agar notifikasi hanya menampilkan miliknya sendiri.
func (h *AppNotificationHandler) clientProfileID(r *http.Request) (string, error) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return "", errMissingToken
	}

	token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
	if token == "" {
		return "", errMissingToken
	}

	user, err := h.Auth.GetProfileByToken(token)
	if err != nil {
		return "", err
	}

	return user.ID, nil
}

func containsRole(roles []string, role string) bool {
	for _, r := range roles {
		if r == role {
			return true
		}
	}
	return false
}

// ListNotifications GET /api/notifications?role=SUPERADMIN&limit=15
// Mengembalikan daftar notifikasi sekaligus jumlah belum dibaca dalam
// satu panggilan agar polling frontend hemat.
func (h *AppNotificationHandler) ListNotifications(w http.ResponseWriter, r *http.Request) {
	roles := roleFilter(r)

	profileID := ""
	if containsRole(roles, models.NotifRoleClient) {
		var err error
		profileID, err = h.clientProfileID(r)
		if err != nil {
			http.Error(w, "Token tidak valid", http.StatusUnauthorized)
			return
		}
	}

	limit, err := strconv.Atoi(r.URL.Query().Get("limit"))
	if err != nil || limit <= 0 {
		limit = 15
	}

	data, err := h.Service.List(r.Context(), roles, limit, profileID)
	if err != nil {
		http.Error(w, "Gagal memuat notifikasi", http.StatusInternalServerError)
		return
	}
	if data == nil {
		data = []models.AppNotification{}
	}

	unread, err := h.Service.CountUnread(r.Context(), roles, profileID)
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
	roles := roleFilter(r)

	profileID := ""
	if containsRole(roles, models.NotifRoleClient) {
		var err error
		profileID, err = h.clientProfileID(r)
		if err != nil {
			http.Error(w, "Token tidak valid", http.StatusUnauthorized)
			return
		}
	}

	updated, err := h.Service.MarkAllRead(r.Context(), roles, profileID)
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
