package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func ClientRoutes(router *chi.Mux, clientHandler *handlers.ClientHandler) {
	// Rute Baru (Dashboard Admin - Punya Vanessa)
	router.Route("/api/admin/clients", func(r chi.Router) {
		r.Get("/", clientHandler.GetClients)
		r.Post("/", clientHandler.CreateClient)
		r.Get("/{id}", clientHandler.GetClientByID)
		r.Put("/{id}", clientHandler.UpdateClient)
		r.Patch("/{id}/status", clientHandler.UpdateClientStatus)
	})

	// Rute Lama (Backup Dashboard Superadmin - Punya Teman)
	router.Delete("/api/clients/{id}", clientHandler.DeleteClient)
}