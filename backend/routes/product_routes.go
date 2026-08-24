package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func ProductRoutes(router *chi.Mux, productHandler *handlers.ProductHandler, authService *services.AuthService) {
	// Katalog produk bersifat publik (dipakai landing page).
	router.Get("/api/products", productHandler.GetProducts)
	router.Get("/api/products/{id}", productHandler.GetProductByID)

	// Perubahan data produk hanya untuk staff internal.
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
		r.Post("/api/products", productHandler.CreateProduct)
		r.Put("/api/products/{id}", productHandler.UpdateProduct)
		r.Delete("/api/products/{id}", productHandler.DeleteProduct)
	})
}
