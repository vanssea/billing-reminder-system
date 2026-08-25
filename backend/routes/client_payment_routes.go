package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func ClientPaymentRoutes(router *chi.Mux, paymentHandler *handlers.PaymentHandler, authService *services.AuthService) {
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService))
		r.Get("/api/client/payments", paymentHandler.GetPaymentsByClientID)
		// Kepemilikan invoice divalidasi di handler: CLIENT tidak boleh
		// membuat payment untuk invoice client lain.
		r.Post("/api/client/payments", paymentHandler.CreatePayment)
	})
}
