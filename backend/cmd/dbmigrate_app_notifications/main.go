package main

import (
	"context"
	"log"

	"billing-reminder-system/config"

	"github.com/joho/godotenv"
)

// Migrasi idempoten untuk tabel notifikasi aplikasi (lonceng admin/superadmin).
// Jalankan dari folder backend: go run ./cmd/dbmigrate_app_notifications
func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Gagal membaca file .env")
	}

	db := config.ConnectDatabase()
	defer db.Close()

	const schema = `
	CREATE TABLE IF NOT EXISTS app_notifications (
		id BIGSERIAL PRIMARY KEY,
		type TEXT NOT NULL,
		title TEXT NOT NULL,
		message TEXT NOT NULL,
		reference_id TEXT,
		target_role TEXT NOT NULL DEFAULT 'ALL',
		is_read BOOLEAN NOT NULL DEFAULT FALSE,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_app_notifications_target
		ON app_notifications (target_role, is_read, created_at DESC);

	CREATE INDEX IF NOT EXISTS idx_app_notifications_dedup
		ON app_notifications (type, reference_id);
	`

	if _, err := db.Exec(context.Background(), schema); err != nil {
		log.Fatal("Gagal membuat tabel app_notifications:", err)
	}

	log.Println("Tabel app_notifications siap di Supabase.")
}
