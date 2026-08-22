package routes

import (
	"github.com/go-chi/chi/v5"

	"billing-reminder-system/handlers"
)

func PaymentRoutes(router *chi.Mux, handler *handlers.PaymentHandler) {
	router.Route("/api/payments", func(r chi.Router) {
		r.Get("/", handler.GetPayments)
		r.Get("/{id}", handler.GetPaymentByID)

		r.Put("/{id}/verify", handler.VerifyPayment)
		r.Put("/{id}/approve", handler.ApprovePayment)
		r.Put("/{id}/reject", handler.RejectPayment)
	})
}
