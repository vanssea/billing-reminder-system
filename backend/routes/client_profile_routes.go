package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func ClientProfileRoutes(router *chi.Mux, clientHandler *handlers.ClientHandler) {
	router.Put("/api/clients/profile", clientHandler.CreateOrUpdateClientProfile)
}