package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"billing-reminder-system/config"
	"billing-reminder-system/handlers"
	"billing-reminder-system/routes"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

// panicRecovery adalah middleware yang menangkap panic di handler agar server
// tidak crash seluruhnya. Panic dicatat ke log dan dikembalikan 500.
func panicRecovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				log.Printf("PANIC RECOVERED: %v | %s %s", rec, r.Method, r.URL.Path)
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func main() {
	// Membaca file .env — log warning jika gagal (bukan fatal agar container
	// tetap berjalan saat env diinjeksi via orchestrator/Railway).
	if err := godotenv.Load(); err != nil {
		log.Println("Peringatan: .env tidak ditemukan, menggunakan variabel env sistem")
	}

	// Koneksi ke database Supabase
	db := config.ConnectDatabase()
	defer db.Close()

	// Membuat service.
	// Koneksi WhatsApp dikelola reminderworker.exe (cron job OS). Backend tidak
	// menyambung WhatsApp (WhatsApp hanya izinkan 1 koneksi per device; 2 koneksi
	// = saling lempar). Set WHATSAPP_DISABLED=false hanya saat perlu pairing ulang.
	// Email tetap aktif di backend.
	var waService *services.WhatsAppService
	if os.Getenv("WHATSAPP_DISABLED") != "true" {
		var waErr error
		waService, waErr = services.NewWhatsAppService()
		if waErr != nil {
			log.Printf("WhatsApp service tidak aktif: %v (notifikasi WA dilewati)", waErr)
		}
	} else {
		log.Println("Mode cron aktif: WhatsApp dikelola reminderworker.exe; WA dari backend dilewati.")
	}
	pdfService := services.NewPDFService()
	emailService := services.NewEmailService()
	if emailService == nil {
		log.Println("Email service tidak aktif: SMTP_HOST belum dikonfigurasi (notifikasi email dilewati)")
	} else {
		log.Println("Email service aktif via SMTP")
	}
	clientService := services.NewClientService(db)
	adminService := services.NewAdminService(db)
	productService := services.NewProductService(db)
	testimonialService := services.NewTestimonialService(db, clientService)
	faqService := services.NewFAQService(db)
	authService := services.NewAuthService(db, clientService)
	invoiceService := services.NewInvoiceService(db, clientService)
	invoiceService.WhatsApp = waService
	invoiceService.Email = emailService
	invoiceService.PDF = pdfService
	paymentService := services.NewPaymentService(db, clientService)
	paymentService.WhatsApp = waService
	paymentService.Email = emailService
	purchaseService := services.NewPurchaseService(db, clientService, productService)
	purchaseService.InvoiceService = invoiceService
	reminderService := services.NewReminderService(db)
	reminderService.WhatsApp = waService
	reminderService.Email = emailService
	reminderService.PDF = pdfService
	appNotificationService := services.NewAppNotificationService(db)
	settingsService := services.NewSettingsService(db)

	// Membuat handler
	clientHandler := handlers.NewClientHandler(clientService, authService)
	adminHandler := handlers.NewAdminHandler(adminService)
	productHandler := handlers.NewProductHandler(productService)
	testimonialHandler := handlers.NewTestimonialHandler(testimonialService)
	faqHandler := handlers.NewFAQHandler(faqService)
	authHandler := handlers.NewAuthHandler(authService)
	invoiceHandler := handlers.NewInvoiceHandler(invoiceService, authService)
	paymentHandler := handlers.NewPaymentHandler(paymentService, authService)
	purchaseHandler := handlers.NewPurchaseHandler(purchaseService, authService)
	reminderHandler := handlers.NewReminderHandler(reminderService)
	whatsappHandler := handlers.NewWhatsAppHandler(waService, pdfService)
	emailHandler := handlers.NewEmailHandler(emailService)
	appNotificationHandler := handlers.NewAppNotificationHandler(appNotificationService, authService)
	settingsHandler := handlers.NewSettingsHandler(settingsService)

	// Setup router
	router := chi.NewRouter()

	// Panic recovery — SELALU di awal sebelum middleware lain
	router.Use(panicRecovery)

	// CORS — baca allowed origins dari env var, fallback ke localhost untuk dev
	corsOrigins := os.Getenv("CORS_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "http://localhost:5173,http://127.0.0.1:5173"
	}
	allowedOrigins := strings.Split(corsOrigins, ",")

	router.Use(cors.Handler(cors.Options{
		AllowedOrigins:   allowedOrigins,
		AllowedMethods: []string{
			"GET",
			"POST",
			"PUT",
			"PATCH",
			"DELETE",
			"OPTIONS",
		},
		AllowedHeaders: []string{
			"Accept",
			"Authorization",
			"Content-Type",
			"X-CSRF-Token",
		},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Routes
	routes.ClientProfileRoutes(router, clientHandler, authService)
	routes.ClientRoutes(router, clientHandler, authService)
	routes.AdminRoutes(router, adminHandler, authService)
	routes.ProductRoutes(router, productHandler, authService)
	routes.TestimonialRoutes(router, testimonialHandler, authService)
	routes.FAQRoutes(router, faqHandler, authService)
	routes.AuthRoutes(router, authHandler)
	routes.ClientInvoiceRoutes(router, invoiceHandler, authService)
	routes.ClientPaymentRoutes(router, paymentHandler, authService)
	routes.ClientPurchaseRoutes(router, purchaseHandler, authService)
	routes.AdminPurchaseRoutes(router, purchaseHandler, authService)
	routes.InvoiceRoutes(router, invoiceHandler, authService)
	routes.ReminderRoutes(router, reminderHandler, authService)
	routes.PaymentRoutes(router, paymentHandler, authService)
	routes.WhatsAppRoutes(router, whatsappHandler, authService)
	routes.EmailRoutes(router, emailHandler, authService)
	routes.AppNotificationRoutes(router, appNotificationHandler, authService)
	routes.SettingsRoutes(router, settingsHandler, authService)

	// Pengiriman reminder otomatis ditangani reminderworker.exe (cron job OS,
	// dijalankan tiap 1 menit oleh Windows Task Scheduler). Tidak ada scheduler
	// in-process di backend agar tidak ada pengiriman ganda.

	// Menjalankan watcher notifikasi invoice overdue untuk lonceng admin
	go appNotificationService.StartOverdueWatcher(context.Background())

	// Port — baca dari env var, fallback ke 8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Menjalankan server
	server := &http.Server{
		Addr:         ":" + port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 120 * time.Second, // render PDF + upload WhatsApp bisa lama
		IdleTimeout:  60 * time.Second,
	}

	log.Println("=================================")
	log.Println("Backend Billing Reminder berjalan!")
	log.Printf("Server: http://localhost:%s", port)
	log.Println("=================================")

	// Graceful shutdown — tangkap SIGINT/SIGTERM untuk shutdown yang bersih
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		sig := <-sigCh
		log.Printf("Signal %v diterima, melakukan graceful shutdown...", sig)

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()
		if err := server.Shutdown(ctx); err != nil {
			log.Printf("Graceful shutdown error: %v", err)
		}
	}()

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal("Server error:", err)
	}

	log.Println("Server berhenti dengan bersih.")
}
