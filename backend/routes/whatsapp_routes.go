package routes

import (
	"os"

	"billing-reminder-system/handlers"

	"github.com/go-chi/chi/v5"
)

// WhatsAppRoutes mendaftarkan route WhatsApp. Endpoint /test dan /test-pdf
// adalah tool development untuk mengirim pesan lewat bot sehingga hanya
// terdaftar ketika APP_ENV=development. Pada mode lain route tidak ada dan
// permintaan anonim mendapat 404, sedangkan GET /status tetap tersedia.
func WhatsAppRoutes(r chi.Router, handler *handlers.WhatsAppHandler) {
	r.Route("/api/whatsapp", func(r chi.Router) {
		r.Get("/status", handler.GetStatus)

		if os.Getenv("APP_ENV") == "development" {
			r.Post("/test", handler.TestSend)
			r.Post("/test-pdf", handler.TestSendPDF)
		}
	})
}