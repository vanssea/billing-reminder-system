package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func ClientInvoiceRoutes(router *chi.Mux, invoiceHandler *handlers.InvoiceHandler, authService *services.AuthService) {
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService))
		r.Get("/api/client/invoices", invoiceHandler.GetInvoicesByClientID)
		// Ownership dicek di handler: CLIENT hanya boleh membuka invoice miliknya.
		r.Get("/api/client/invoices/{id}", invoiceHandler.GetInvoiceByID)
	})
}
