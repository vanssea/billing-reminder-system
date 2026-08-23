package main

import (
	"context"
	"log"
	"net/http"
	"time"

	"billing-reminder-system/config"
	"billing-reminder-system/handlers"
	"billing-reminder-system/routes"
	"billing-reminder-system/services"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

func main() {
	// Membaca file .env
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Gagal membaca file .env")
	}

	// Koneksi ke database Supabase
	db := config.ConnectDatabase()
	defer db.Close()

	// Membuat service
	pdfService := services.NewPDFService()
	waService, waErr := services.NewWhatsAppService()
	if waErr != nil {
		log.Printf("WhatsApp service tidak aktif: %v (notifikasi WA dilewati)", waErr)
	}
	clientService := services.NewClientService(db)
	adminService := services.NewAdminService(db)
	productService := services.NewProductService(db)
	testimonialService := services.NewTestimonialService(db)
	faqService := services.NewFAQService(db)
	authService := services.NewAuthService(db)
	invoiceService := services.NewInvoiceService(db)
	invoiceService.WhatsApp = waService
	invoiceService.PDF = pdfService
	reminderService := services.NewReminderService(db)
	reminderService.WhatsApp = waService
	reminderService.PDF = pdfService
	paymentService := services.NewPaymentService(db)
	paymentService.WhatsApp = waService
	appNotificationService := services.NewAppNotificationService(db)

	// Membuat handler
	clientHandler := handlers.NewClientHandler(clientService)
	adminHandler := handlers.NewAdminHandler(adminService)
	productHandler := handlers.NewProductHandler(productService)
	testimonialHandler := handlers.NewTestimonialHandler(testimonialService)
	faqHandler := handlers.NewFAQHandler(faqService)
	authHandler := handlers.NewAuthHandler(authService)
	invoiceHandler := handlers.NewInvoiceHandler(invoiceService)
	reminderHandler := handlers.NewReminderHandler(reminderService)
	paymentHandler := handlers.NewPaymentHandler(paymentService)
	whatsappHandler := handlers.NewWhatsAppHandler(waService, pdfService)
	appNotificationHandler := handlers.NewAppNotificationHandler(appNotificationService)

	// Setup router
	router := chi.NewRouter()

	// CORS
	router.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		},
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
	routes.ClientRoutes(router, clientHandler)
	routes.AdminRoutes(router, adminHandler)
	routes.ProductRoutes(router, productHandler)
	routes.TestimonialRoutes(router, testimonialHandler)
	routes.FAQRoutes(router, faqHandler)
	routes.AuthRoutes(router, authHandler)
	routes.InvoiceRoutes(router, invoiceHandler)
	routes.ReminderRoutes(router, reminderHandler)
	routes.PaymentRoutes(router, paymentHandler)
	routes.WhatsAppRoutes(router, whatsappHandler)
	routes.AppNotificationRoutes(router, appNotificationHandler)

	// Menjalankan scheduler reminder di background (H-30 s/d H-1 + overdue)
	go reminderService.StartReminderScheduler(context.Background())

	// Menjalankan watcher notifikasi invoice overdue untuk lonceng admin
	go appNotificationService.StartOverdueWatcher(context.Background())

	// Menjalankan server
	server := &http.Server{
		Addr:         ":8080",
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 120 * time.Second, // render PDF + upload WhatsApp bisa lama
		IdleTimeout:  60 * time.Second,
	}

	log.Println("=================================")
	log.Println("Backend Billing Reminder berjalan!")
	log.Println("Server: http://localhost:8080")
	log.Println("API Clients: http://localhost:8080/api/clients")
	log.Println("API Admins: http://localhost:8080/api/admins")
	log.Println("API Products: http://localhost:8080/api/products")
	log.Println("API Testimonials: http://localhost:8080/api/testimonials")
	log.Println("API FAQs: http://localhost:8080/api/faqs")
	log.Println("API Auth: http://localhost:8080/api/auth/me")
	log.Println("API Invoices: http://localhost:8080/api/invoices")
	log.Println("API Reminders: http://localhost:8080/api/reminders")
	log.Println("API Payments: http://localhost:8080/api/payments")
	log.Println("API Notifications: http://localhost:8080/api/notifications")
	log.Println("=================================")

	err = server.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		log.Fatal("Server error:", err)
	}
}