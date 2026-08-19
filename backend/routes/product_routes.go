package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func ProductRoutes(router *chi.Mux, productHandler *handlers.ProductHandler) {
	router.Get("/api/products", productHandler.GetProducts)
	router.Post("/api/products", productHandler.CreateProduct)
	router.Get("/api/products/{id}", productHandler.GetProductByID)
	router.Put("/api/products/{id}", productHandler.UpdateProduct)
	router.Delete("/api/products/{id}", productHandler.DeleteProduct)
}