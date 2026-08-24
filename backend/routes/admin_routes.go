package routes

import (
	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

func AdminRoutes(router *chi.Mux, adminHandler *handlers.AdminHandler, authService *services.AuthService) {
	// Manajemen ADMIN: khusus SUPERADMIN.
	router.Route("/api/admins", func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleSuperadmin))
		r.Get("/", adminHandler.GetAdmins)
		r.Post("/", adminHandler.CreateAdmin)
		r.Get("/{id}", adminHandler.GetAdminByID)
		r.Put("/{id}", adminHandler.UpdateAdmin)
		r.Delete("/{id}", adminHandler.DeleteAdmin)
	})

	// Dashboard internal.
	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
		r.Get("/api/admin/dashboard", adminHandler.GetDashboardSummary)
	})

	router.Group(func(r chi.Router) {
		r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleSuperadmin))
		r.Get("/api/super-admin/dashboard", adminHandler.GetSuperAdminDashboard)
		r.Get("/api/super-admin/status", adminHandler.SuperAdminStatus)
	})
}
