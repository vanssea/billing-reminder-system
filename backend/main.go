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

	// Membuat handler
	clientHandler := handlers.NewClientHandler(clientService)
	adminHandler := handlers.NewAdminHandler(adminService)

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
	routes.ClientRoutes(router, clientHandler)
	routes.AdminRoutes(router, adminHandler)

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
	log.Println("=================================")

	err = server.ListenAndServe()
	if err != nil && err != http.ErrServerClosed {
		log.Fatal("Server error:", err)
	}
}