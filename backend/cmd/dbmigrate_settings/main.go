package main

import (
	"context"
	"log"

	"billing-reminder-system/config"

	"github.com/joho/godotenv"
)

// Migrasi idempoten untuk tabel pengaturan global aplikasi (app_settings)
// dan seed default pengaturan reminder (Settings V1).
// Jalankan dari folder backend: go run ./cmd/dbmigrate_settings
func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Gagal membaca file .env")
	}

	db := config.ConnectDatabase()
	defer db.Close()

	const schema = `
	CREATE TABLE IF NOT EXISTS app_settings (
		key TEXT PRIMARY KEY,
		value JSONB NOT NULL,
		updated_by TEXT,
		updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	INSERT INTO app_settings (key, value, updated_by, updated_at)
	VALUES (
		'reminder_settings',
		'{"enabled_types":["H-30","H-14","H-10","H-7","H-3","H-1"],"send_time":"08:00"}'::jsonb,
		'seed',
		now()
	)
	ON CONFLICT (key) DO NOTHING;
	`

	if _, err := db.Exec(context.Background(), schema); err != nil {
		log.Fatal("Gagal membuat tabel app_settings:", err)
	}

	log.Println("Tabel app_settings siap di Supabase.")
}