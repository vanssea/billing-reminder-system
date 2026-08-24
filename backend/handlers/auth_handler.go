package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"net/mail"
	"strings"

	"billing-reminder-system/models"
	"billing-reminder-system/services"
)

// isValidEmail memvalidasi format email dengan parser standar.
func isValidEmail(email string) bool {
	address, err := mail.ParseAddress(email)
	if err != nil {
		return false
	}
	// ParseAddress menerima format "Nama <email@domain>"; pastikan input
	// benar-benar hanya alamat email.
	return strings.EqualFold(address.Address, email)
}

type AuthHandler struct {
	Service *services.AuthService
}

func NewAuthHandler(service *services.AuthService) *AuthHandler {
	return &AuthHandler{
		Service: service,
	}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var req models.RegisterRequest

	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	req.FullName = strings.TrimSpace(req.FullName)
	req.Email = strings.TrimSpace(req.Email)

	if req.FullName == "" {
		http.Error(w, "Nama lengkap wajib diisi", http.StatusBadRequest)
		return
	}

	if !isValidEmail(req.Email) {
		http.Error(w, "Format email tidak valid", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 8 {
		http.Error(w, "Password minimal 8 karakter", http.StatusBadRequest)
		return
	}

	profile, err := h.Service.Register(req)
	if err != nil {
		status := http.StatusInternalServerError
		message := "Gagal melakukan registrasi"

		if strings.Contains(err.Error(), "sudah terdaftar") {
			status = http.StatusConflict
			message = "Email sudah terdaftar"
		} else {
			log.Printf("Register %s: %v", req.Email, err)
		}

		http.Error(w, message, status)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)

	json.NewEncoder(w).Encode(profile)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")

	if !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Token tidak ditemukan", http.StatusUnauthorized)
		return
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")

	profile, err := h.Service.GetProfileByToken(token)
	if err != nil {
		http.Error(w, "Token tidak valid", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(profile)
}