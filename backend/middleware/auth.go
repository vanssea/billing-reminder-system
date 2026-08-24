package middleware

import (
	"context"
	"net/http"
	"strings"

	"billing-reminder-system/models"
	"billing-reminder-system/services"
)

type contextKey int

const profileContextKey contextKey = iota

// RequireAuth memvalidasi Bearer token Supabase, memuat profile (beserta role)
// dari database, lalu menyimpannya ke request context. Handler berikutnya
// dapat membacanya lewat ProfileFromContext.
func RequireAuth(authService *services.AuthService) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if !strings.HasPrefix(authHeader, "Bearer ") {
				http.Error(w, "Token tidak ditemukan", http.StatusUnauthorized)
				return
			}

			token := strings.TrimSpace(strings.TrimPrefix(authHeader, "Bearer "))
			if token == "" {
				http.Error(w, "Token tidak ditemukan", http.StatusUnauthorized)
				return
			}

			profile, err := authService.GetProfileByToken(token)
			if err != nil || profile == nil {
				http.Error(w, "Token tidak valid", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), profileContextKey, profile)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// RequireRole memastikan user yang sudah terautentikasi memiliki salah satu
// role yang diizinkan. Role berasal dari database (via RequireAuth), bukan
// dari request.
func RequireRole(allowed ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			profile := ProfileFromContext(r)
			if profile == nil {
				http.Error(w, "Belum terautentikasi", http.StatusUnauthorized)
				return
			}

			for _, role := range allowed {
				if profile.Role == role {
					next.ServeHTTP(w, r)
					return
				}
			}

			http.Error(w, "Akses ditolak untuk role Anda", http.StatusForbidden)
		})
	}
}

// ProfileFromContext mengembalikan profile hasil autentikasi middleware,
// atau nil jika request belum melewati RequireAuth.
func ProfileFromContext(r *http.Request) *models.AuthUser {
	profile, ok := r.Context().Value(profileContextKey).(*models.AuthUser)
	if !ok {
		return nil
	}
	return profile
}
