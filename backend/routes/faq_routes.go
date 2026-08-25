package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func FAQRoutes(router *chi.Mux, faqHandler *handlers.FAQHandler, authService *services.AuthService) {
	// Baca publik (landing page).
	router.Get("/api/faqs", faqHandler.GetFAQs)
	router.Get("/api/faqs/{id}", faqHandler.GetFAQByID)

	// Tulis hanya untuk staff internal.
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
		r.Post("/api/faqs", faqHandler.CreateFAQ)
		r.Put("/api/faqs/{id}", faqHandler.UpdateFAQ)
		r.Delete("/api/faqs/{id}", faqHandler.DeleteFAQ)
	})
}
