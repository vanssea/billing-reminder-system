package routes

import (
	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

func AdminRoutes(router *chi.Mux, adminHandler *handlers.AdminHandler) {
	router.Get("/api/admins", adminHandler.GetAdmins)
	router.Post("/api/admins", adminHandler.CreateAdmin)
	router.Get("/api/admins/{id}", adminHandler.GetAdminByID)
	router.Put("/api/admins/{id}", adminHandler.UpdateAdmin)
	router.Delete("/api/admins/{id}", adminHandler.DeleteAdmin)
	router.Get("/api/admin/dashboard", adminHandler.GetDashboardSummary)
	router.Get("/api/super-admin/dashboard", adminHandler.GetSuperAdminDashboard)
	router.Get("/api/super-admin/status", adminHandler.SuperAdminStatus)
}