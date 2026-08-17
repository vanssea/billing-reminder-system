package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func TestimonialRoutes(router *chi.Mux, testimonialHandler *handlers.TestimonialHandler) {
	router.Get("/api/testimonials", testimonialHandler.GetTestimonials)
	router.Post("/api/testimonials", testimonialHandler.CreateTestimonial)
	router.Get("/api/testimonials/{id}", testimonialHandler.GetTestimonialByID)
	router.Put("/api/testimonials/{id}", testimonialHandler.UpdateTestimonial)
	router.Delete("/api/testimonials/{id}", testimonialHandler.DeleteTestimonial)
}