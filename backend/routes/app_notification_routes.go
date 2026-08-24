package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func AppNotificationRoutes(router *chi.Mux, appNotificationHandler *handlers.AppNotificationHandler, authService *services.AuthService) {
	// Identitas dan role ditentukan dari JWT, bukan query param.
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService))
		r.Get("/api/notifications", appNotificationHandler.ListNotifications)
		r.Put("/api/notifications/read-all", appNotificationHandler.MarkAllRead)
		r.Put("/api/notifications/{id}/read", appNotificationHandler.MarkRead)
	})
}
