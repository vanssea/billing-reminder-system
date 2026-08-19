package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func ReminderRoutes(r chi.Router, handler *handlers.ReminderHandler) {
	r.Route("/api/reminders", func(r chi.Router) {
		r.Get("/", handler.GetReminders)
		r.Post("/{id}/retry", handler.RetryReminder)
	})
}