package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func ReminderRoutes(r chi.Router, handler *handlers.ReminderHandler, authService *services.AuthService) {
	r.Route("/api/reminders", func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
		r.Get("/", handler.GetReminders)
		r.Post("/{id}/retry", handler.RetryReminder)
	})
}
