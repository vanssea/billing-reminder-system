package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func ClientProfileRoutes(router *chi.Mux, clientHandler *handlers.ClientHandler, authService *services.AuthService) {
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService))
		r.Put("/api/clients/profile", clientHandler.CreateOrUpdateClientProfile)
	})
}
