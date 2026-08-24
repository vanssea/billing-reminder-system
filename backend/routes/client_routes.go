package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func ClientRoutes(router *chi.Mux, clientHandler *handlers.ClientHandler) {
	// Rute Lama (Superadmin)
	router.Get("/api/clients", clientHandler.GetClients)
	router.Post("/api/clients", clientHandler.CreateClient)
	router.Get("/api/clients/{id}", clientHandler.GetClientByID)
	router.Get("/api/clients/profile/{profile_id}", clientHandler.GetClientByProfileID)
	router.Put("/api/clients/{id}", clientHandler.UpdateClient)
	router.Delete("/api/clients/{id}", clientHandler.DeleteClient)

	// Rute Baru (Dashboard Admin)
	router.Route("/api/admin/clients", func(r chi.Router) {
		r.Get("/", clientHandler.GetClients)
		r.Post("/", clientHandler.CreateClient)
		r.Get("/{id}", clientHandler.GetClientByID)
		r.Put("/{id}", clientHandler.UpdateClient)
		r.Patch("/{id}/status", clientHandler.UpdateClientStatus)
	})
}