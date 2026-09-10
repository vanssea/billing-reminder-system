package routes

import (
	"os"

	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func EmailRoutes(r chi.Router, handler *handlers.EmailHandler, authService *services.AuthService) {
	r.Route("/api/email", func(r chi.Router) {
		r.Group(func(r chi.Router) {
			r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
			r.Get("/status", handler.GetStatus)
		})

		if os.Getenv("APP_ENV") == "development" {
			r.Group(func(r chi.Router) {
				r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
				r.Post("/test", handler.TestSend)
			})
		}
	})
}