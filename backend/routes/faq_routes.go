package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func FAQRoutes(router *chi.Mux, faqHandler *handlers.FAQHandler) {
	router.Get("/api/faqs", faqHandler.GetFAQs)
	router.Post("/api/faqs", faqHandler.CreateFAQ)
	router.Get("/api/faqs/{id}", faqHandler.GetFAQByID)
	router.Put("/api/faqs/{id}", faqHandler.UpdateFAQ)
	router.Delete("/api/faqs/{id}", faqHandler.DeleteFAQ)
}