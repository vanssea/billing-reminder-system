package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func TestimonialRoutes(router *chi.Mux, testimonialHandler *handlers.TestimonialHandler, authService *services.AuthService) {
	// Baca publik (landing page).
	router.Get("/api/testimonials", testimonialHandler.GetTestimonials)
	router.Get("/api/testimonials/{id}", testimonialHandler.GetTestimonialByID)

	// Tulis hanya untuk staff internal.
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
		r.Post("/api/testimonials", testimonialHandler.CreateTestimonial)
		r.Put("/api/testimonials/{id}", testimonialHandler.UpdateTestimonial)
		r.Delete("/api/testimonials/{id}", testimonialHandler.DeleteTestimonial)
	})
}
