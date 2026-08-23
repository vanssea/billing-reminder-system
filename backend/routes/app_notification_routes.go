package routes

import (
	"github.com/go-chi/chi/v5"

	"billing-reminder-system/handlers"
)

func AppNotificationRoutes(router *chi.Mux, handler *handlers.AppNotificationHandler) {
	router.Route("/api/notifications", func(r chi.Router) {
		r.Get("/", handler.ListNotifications)
		r.Put("/read-all", handler.MarkAllRead)
		r.Put("/{id}/read", handler.MarkRead)
	})
}
