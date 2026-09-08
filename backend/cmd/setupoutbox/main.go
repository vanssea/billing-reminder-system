package main

import (
	"context"
	"fmt"
	"log"

	"billing-reminder-system/config"

	"github.com/joho/godotenv"
)

// SetupOutbox membuat tabel notification_outbox (idempotent) yang dipakai
// backend untuk menjadwalkan pengiriman WA lewat reminderworker.exe (cron).
// RLS diaktifkan tanpa policy anon/authenticated; akses hanya via service role.
// Menjalankan perintah ini berulang kali aman.
func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Gagal membaca file .env")
	}

	db := config.ConnectDatabase()
	defer db.Close()

	ctx := context.Background()

	if _, err := db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS public.notification_outbox (
			id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
			notif_type    text NOT NULL,
			invoice_id    text,
			payment_id    text,
			reason        text,
			status        text NOT NULL DEFAULT 'PENDING',
			attempts      integer NOT NULL DEFAULT 0,
			error_message text,
			created_at    timestamptz NOT NULL DEFAULT now(),
			sent_at       timestamptz
		)
	`); err != nil {
		log.Fatal("Gagal membuat tabel notification_outbox:", err)
	}
	fmt.Println("Tabel notification_outbox dibuat.")

	if _, err := db.Exec(ctx, `ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY`); err != nil {
		log.Fatal("Gagal mengaktifkan RLS notification_outbox:", err)
	}
	fmt.Println("RLS notification_outbox diaktifkan (akses hanya via service role).")

	if _, err := db.Exec(ctx, `
		CREATE INDEX IF NOT EXISTS idx_notification_outbox_pending
			ON public.notification_outbox(status)
			WHERE status = 'PENDING'
	`); err != nil {
		log.Fatal("Gagal membuat index outbox:", err)
	}
	fmt.Println("Index antrian pending dibuat.")

	fmt.Println("Setup outbox selesai.")
}