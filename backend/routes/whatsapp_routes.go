package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func WhatsAppRoutes(r chi.Router, handler *handlers.WhatsAppHandler) {
	r.Route("/api/whatsapp", func(r chi.Router) {
		r.Get("/status", handler.GetStatus)
		r.Post("/test", handler.TestSend)
		r.Post("/test-pdf", handler.TestSendPDF)
	})
}