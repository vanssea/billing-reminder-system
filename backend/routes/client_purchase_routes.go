package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func ClientPurchaseRoutes(router *chi.Mux, purchaseHandler *handlers.PurchaseHandler, authService *services.AuthService) {
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService))
		r.Post("/api/client/purchase", purchaseHandler.CreatePurchaseRequest)
		r.Get("/api/client/purchase", purchaseHandler.GetMyPurchaseRequests)
		// Ownership dicek di handler untuk CLIENT.
		r.Get("/api/client/purchase/{id}", purchaseHandler.GetPurchaseRequestByID)
	})
}

func AdminPurchaseRoutes(router *chi.Mux, purchaseHandler *handlers.PurchaseHandler, authService *services.AuthService) {
	router.Route("/api/admin/purchase-requests", func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
		r.Get("/", purchaseHandler.GetAllPurchaseRequests)
		r.Get("/{id}", purchaseHandler.GetPurchaseRequestByID)
		r.Put("/{id}", purchaseHandler.UpdatePurchaseRequestStatus)
	})
}
