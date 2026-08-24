package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func ClientRoutes(router *chi.Mux, clientHandler *handlers.ClientHandler, authService *services.AuthService) {
	staff := middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin)

	// Rute Lama (Superadmin) — kini dilindungi untuk staff internal.
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), staff)
		r.Get("/api/clients", clientHandler.GetClients)
		r.Post("/api/clients", clientHandler.CreateClient)
		r.Get("/api/clients/{id}", clientHandler.GetClientByID)
		r.Put("/api/clients/{id}", clientHandler.UpdateClient)
		r.Delete("/api/clients/{id}", clientHandler.DeleteClient)
	})

	// Profil milik sendiri: user login mana pun, namun CLIENT hanya boleh
	// melihat profile_id miliknya (dicek di handler).
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService))
		r.Get("/api/clients/profile/{profile_id}", clientHandler.GetClientByProfileID)
	})

	// Rute Baru (Dashboard Admin).
	router.Route("/api/admin/clients", func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), staff)
		r.Get("/", clientHandler.GetClients)
		r.Post("/", clientHandler.CreateClient)
		r.Get("/{id}", clientHandler.GetClientByID)
		r.Put("/{id}", clientHandler.UpdateClient)
		r.Patch("/{id}/status", clientHandler.UpdateClientStatus)
	})
}
