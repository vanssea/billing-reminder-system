package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func ClientRoutes(router *chi.Mux, clientHandler *handlers.ClientHandler) {
	router.Get("/api/clients", clientHandler.GetClients)
	router.Post("/api/clients", clientHandler.CreateClient)
	router.Get("/api/clients/{id}", clientHandler.GetClientByID)
	router.Put("/api/clients/{id}", clientHandler.UpdateClient)
	router.Delete("/api/clients/{id}", clientHandler.DeleteClient)
}