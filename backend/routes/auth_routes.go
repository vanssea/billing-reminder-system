package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func AuthRoutes(router *chi.Mux, authHandler *handlers.AuthHandler) {
	router.Post("/api/auth/register", authHandler.Register)
	router.Get("/api/auth/me", authHandler.Me)
}