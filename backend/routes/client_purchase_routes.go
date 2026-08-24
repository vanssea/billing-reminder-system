package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func ClientPurchaseRoutes(router *chi.Mux, purchaseHandler *handlers.PurchaseHandler) {
	router.Post("/api/client/purchase", purchaseHandler.CreatePurchaseRequest)
	router.Get("/api/client/purchase", purchaseHandler.GetMyPurchaseRequests)
	router.Get("/api/client/purchase/{id}", purchaseHandler.GetPurchaseRequestByID)
}

func AdminPurchaseRoutes(router *chi.Mux, purchaseHandler *handlers.PurchaseHandler) {
	router.Get("/api/admin/purchase-requests", purchaseHandler.GetMyPurchaseRequests)
	router.Get("/api/admin/purchase-requests/{id}", purchaseHandler.GetPurchaseRequestByID)
	router.Put("/api/admin/purchase-requests/{id}", purchaseHandler.UpdatePurchaseRequestStatus)
}