package routes

import (
	"github.com/go-chi/chi/v5"

	"billing-reminder-system/handlers"
)

func InvoiceRoutes(router *chi.Mux, handler *handlers.InvoiceHandler) {
	router.Route("/api/invoices", func(r chi.Router) {
		r.Get("/", handler.GetInvoices)
		r.Post("/", handler.CreateInvoice)

		r.Get("/{id}", handler.GetInvoiceByID)
		r.Put("/{id}", handler.UpdateInvoice)
		r.Delete("/{id}", handler.DeleteInvoice)
	})
}