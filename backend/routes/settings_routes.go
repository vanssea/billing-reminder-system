package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func SettingsRoutes(router *chi.Mux, settingsHandler *handlers.SettingsHandler, authService *services.AuthService) {
	// Pengaturan global sistem: khusus SUPERADMIN.
	router.Route("/api/admin/settings", func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleSuperadmin))
		r.Get("/", settingsHandler.GetSettings)
		r.Put("/", settingsHandler.UpdateSettings)
	})
}