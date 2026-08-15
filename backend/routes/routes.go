package routes

import (

	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func SetupRoutes(clientHandler *handlers.ClientHandler) *chi.Mux {
	router := chi.NewRouter()

	router.Get("/api/clients", clientHandler.GetClients)

	return router
}