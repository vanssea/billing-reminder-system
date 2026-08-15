package routes

import (

	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func SetupRoutes(clientHandler *handlers.ClientHandler) *chi.Mux {
	router := chi.NewRouter()

	router.Get("/api/clients", clientHandler.GetClients)
	router.Post("/api/clients", clientHandler.CreateClient)
	router.Get("/api/clients/{id}", clientHandler.GetClientByID)
	router.Put("/api/clients/{id}", clientHandler.UpdateClient)
	router.Delete("/api/clients/{id}", clientHandler.DeleteClient)
	return router
}