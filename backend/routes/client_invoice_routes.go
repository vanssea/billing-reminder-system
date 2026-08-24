package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func ClientInvoiceRoutes(router *chi.Mux, invoiceHandler *handlers.InvoiceHandler) {
	router.Get("/api/client/invoices", invoiceHandler.GetInvoicesByClientID)
	router.Get("/api/client/invoices/{id}", invoiceHandler.GetInvoiceByID)
}