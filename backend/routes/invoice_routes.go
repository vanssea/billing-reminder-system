package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func InvoiceRoutes(router *chi.Mux, handler *handlers.InvoiceHandler, authService *services.AuthService) {
	router.Route("/api/invoices", func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))

		r.Get("/", handler.GetInvoices)
		r.Post("/", handler.CreateInvoice)

		r.Get("/{id}", handler.GetInvoiceByID)
		r.Put("/{id}", handler.UpdateInvoice)
		r.Post("/{id}/send", handler.SendInvoice)
		r.Delete("/{id}", handler.DeleteInvoice)
	})
}
