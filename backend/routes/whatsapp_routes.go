package routes

import (
	"os"

	"billing-reminder-system/handlers"
	"billing-reminder-system/middleware"
	"billing-reminder-system/models"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
)

// WhatsAppRoutes mendaftarkan route WhatsApp. Endpoint /test dan /test-pdf
// adalah tool development untuk mengirim pesan lewat bot sehingga hanya
// terdaftar ketika APP_ENV=development. Pada mode lain route tidak ada dan
// permintaan anonim mendapat 404, sedangkan GET /status tetap tersedia.
func WhatsAppRoutes(r chi.Router, handler *handlers.WhatsAppHandler, authService *services.AuthService) {
	r.Route("/api/whatsapp", func(r chi.Router) {
		r.Get("/status", handler.GetStatus)

		if os.Getenv("APP_ENV") == "development" {
			r.Group(func(r chi.Router) {
				// Defense-in-depth: tool test juga dibatasi untuk staff internal.
				r.Use(middleware.RequireAuth(authService), middleware.RequireRole(models.RoleAdmin, models.RoleSuperadmin))
				r.Post("/test", handler.TestSend)
				r.Post("/test-pdf", handler.TestSendPDF)
			})
		}
	})
}
