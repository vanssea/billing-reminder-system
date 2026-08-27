package main

import (
	"context"
	"log"

	"billing-reminder-system/config"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Gagal membaca file .env")
	}

	db := config.ConnectDatabase()
	defer db.Close()

	const schema = `
	ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly';
	`

	if _, err := db.Exec(context.Background(), schema); err != nil {
		log.Fatal("Gagal menambah kolom billing_cycle ke invoice_items:", err)
	}

	log.Println("Kolom billing_cycle pada invoice_items siap.")
}
