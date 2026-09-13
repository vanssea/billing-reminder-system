package routes

import (
	"time"

	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"

	"github.com/go-chi/chi/v5"
)

func AuthRoutes(router *chi.Mux, authHandler *handlers.AuthHandler) {
	// Register publik → batasi 10 request/IP per menit untuk mencegah
	// penciptaan akun massal (spam).
	router.With(middleware.RateLimit(10, time.Minute)).Post("/api/auth/register", authHandler.Register)
	router.Get("/api/auth/me", authHandler.Me)
}