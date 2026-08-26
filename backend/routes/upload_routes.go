package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func UploadRoutes(router *chi.Mux, uploadHandler *handlers.UploadHandler, authService *services.AuthService) {
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService))
		r.Post("/api/upload/payment-proof", uploadHandler.UploadPaymentProof)
	})
}
