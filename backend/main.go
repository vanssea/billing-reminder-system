package main

import (
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
	clientService := services.NewClientService(db)
	adminService := services.NewAdminService(db)
	productService := services.NewProductService(db)
	testimonialService := services.NewTestimonialService(db)
	faqService := services.NewFAQService(db)
	authService := services.NewAuthService(db, clientService)
	invoiceService := services.NewInvoiceService(db, clientService)
	paymentService := services.NewPaymentService(db, clientService)
	purchaseService := services.NewPurchaseService(db, clientService, productService)

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
	routes.ClientProfileRoutes(router, clientHandler)
	routes.ClientRoutes(router, clientHandler)
	routes.AdminRoutes(router, adminHandler)
	routes.ProductRoutes(router, productHandler)
	routes.TestimonialRoutes(router, testimonialHandler)
	routes.FAQRoutes(router, faqHandler)
	routes.AuthRoutes(router, authHandler)
	routes.ClientInvoiceRoutes(router, invoiceHandler)
	routes.ClientPaymentRoutes(router, paymentHandler)
	routes.ClientPurchaseRoutes(router, purchaseHandler)
	routes.AdminPurchaseRoutes(router, purchaseHandler)

	// Menjalankan server
	server := &http.Server{
		Addr:         ":8080",
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
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
	log.Println("=================================")

	err = server.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		log.Fatal("Server error:", err)
	}
}