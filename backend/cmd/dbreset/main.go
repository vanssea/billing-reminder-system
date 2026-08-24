package main

import (
	"context"
	"fmt"
	"log"

	"billing-reminder-system/config"

	"github.com/joho/godotenv"
)

// dbreset mengarahkan nomor HP client PT ABC Indonesia ke nomor tujuan
// lalu mereset reminder INV-2026-006 H-1 agar dikirim ulang sekarang.
func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Gagal membaca file .env")
	}

	db := config.ConnectDatabase()
	defer db.Close()

	ctx := context.Background()

	phone := "082337910990"

	_, err := db.Exec(ctx, `
		UPDATE clients SET phone = $1
		WHERE company_name = 'PT ABC Indonesia'
	`, phone)
	if err != nil {
		log.Fatal("Gagal update nomor client:", err)
	}

	tag, err := db.Exec(ctx, `
		UPDATE reminders r
		SET status = 'PENDING', sent_at = NULL, error_message = NULL, scheduled_at = NOW()
		FROM invoices i
		WHERE i.id = r.invoice_id
		  AND i.invoice_number = 'INV-2026-006'
		  AND r.reminder_type = 'H-1'
	`)
	if err != nil {
		log.Fatal("Gagal reset reminder:", err)
	}

	fmt.Printf("Berhasil! Nomor client -> %s, reminder direset (%d baris).\n", phone, tag.RowsAffected())
	fmt.Println("Scheduler akan mengirim dalam <= 1 menit.")
}
