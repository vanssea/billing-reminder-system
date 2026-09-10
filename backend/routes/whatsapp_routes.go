package routes

import (
	"os"
	"time"

	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func WhatsAppRoutes(r chi.Router, handler *handlers.WhatsAppHandler, authService *services.AuthService) {
	r.Route("/api/whatsapp", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
			r.Get("/status", handler.GetStatus)
			// Pairing bisa memicu kode 8 digit baru — batasi 5 percobaan/menit
			// per IP agar admin yang valid sekalipun tidak membanjiri WhatsApp.
			r.With(middleware.RateLimit(5, time.Minute)).Post("/pair", handler.Pair)
		})

		if os.Getenv("APP_ENV") == "development" {
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
				r.Post("/test", handler.TestSend)
				r.Post("/test-pdf", handler.TestSendPDF)
			})
		}
	})
}
