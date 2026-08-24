package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func ClientPaymentRoutes(router *chi.Mux, paymentHandler *handlers.PaymentHandler) {
	router.Get("/api/client/payments", paymentHandler.GetPaymentsByClientID)
	router.Post("/api/client/payments", paymentHandler.CreatePayment)
}