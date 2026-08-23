package handlers

import (
	"encoding/json"
	"net/http"

	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

type AdminHandler struct {
	Service *services.AdminService
}

func NewAdminHandler(service *services.AdminService) *AdminHandler {
	return &AdminHandler{
		Service: service,
	}
}

func (h *AdminHandler) GetAdmins(w http.ResponseWriter, r *http.Request) {
	admins, err := h.Service.GetAdmins()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(admins)
}

func (h *AdminHandler) CreateAdmin(w http.ResponseWriter, r *http.Request) {
	var req models.CreateAdminRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	admin, err := h.Service.CreateAdmin(req)
	if err != nil {
		http.Error(w, "Gagal membuat admin: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(admin)
}

func (h *AdminHandler) GetAdminByID(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	admin, err := h.Service.GetAdminByID(id)
	if err != nil {
		http.Error(w, "Admin tidak ditemukan", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(admin)
}

func (h *AdminHandler) UpdateAdmin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	var req models.UpdateAdminRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	admin, err := h.Service.UpdateAdmin(id, req)
	if err != nil {
		http.Error(w, "Gagal mengupdate admin: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(admin)
}

func (h *AdminHandler) DeleteAdmin(w http.ResponseWriter, r *http.Request) {
	id := chi.URLParam(r, "id")

	err := h.Service.DeleteAdmin(id)
	if err != nil {
		http.Error(
			w,
			"Gagal menghapus admin: "+err.Error(),
			http.StatusInternalServerError,
		)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *AdminHandler) GetDashboardSummary(w http.ResponseWriter, r *http.Request) {
	summary, err := h.Service.GetDashboardSummary()
	if err != nil {
		http.Error(w, "Gagal memuat dashboard: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(summary)
}

func (h *AdminHandler) GetSuperAdminDashboard(w http.ResponseWriter, r *http.Request) {
	dashboard, err := h.Service.GetSuperAdminDashboard()
	if err != nil {
		http.Error(w, "Gagal memuat dashboard superadmin: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dashboard)
}

func (h *AdminHandler) SuperAdminStatus(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "super admin route aktif tanpa login",
	})
}