package routes

import (
	"os"

	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func WhatsAppRoutes(r chi.Router, handler *handlers.WhatsAppHandler, authService *services.AuthService) {
	r.Get("/whatsapp-pair", handler.ServePairPage)

	r.Route("/api/whatsapp", func(r chi.Router) {
		r.Get("/status", handler.GetStatus)
		r.Post("/pair", handler.Pair)

		if os.Getenv("APP_ENV") == "development" {
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
				r.Post("/test", handler.TestSend)
				r.Post("/test-pdf", handler.TestSendPDF)
			})
		}
	})
}
