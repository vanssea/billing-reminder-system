package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func PaymentRoutes(router *chi.Mux, handler *handlers.PaymentHandler, authService *services.AuthService) {
	router.Route("/api/payments", func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService))

		staff := middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin)

		// Daftar seluruh payment: internal saja. Detail by-ID boleh diakses
		// user mana pun yang login, dengan ownership check untuk CLIENT
		// di dalam handler.
		r.With(staff).Get("/", handler.GetPayments)
		r.Get("/{id}", handler.GetPaymentByID)

		// Verifikasi pembayaran hanya untuk staff internal.
		r.With(staff).Put("/{id}/approve", handler.ApprovePayment)
		r.With(staff).Put("/{id}/reject", handler.RejectPayment)
	})
}
