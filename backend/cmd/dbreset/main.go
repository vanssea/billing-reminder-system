package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"

	"billing-reminder-system/config"

	"github.com/joho/godotenv"
)

// dbreset mengarahkan nomor HP client PT ABC Indonesia ke nomor tujuan
// lalu mereset reminder INV-2026-006 H-1 agar dikirim ulang sekarang.
// Nomor testing diambil dari environment variable TEST_WHATSAPP_NUMBER
// agar tidak ada nomor pribadi/test yang hardcoded di source code.
func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Gagal membaca file .env")
	}

	phone := strings.TrimSpace(os.Getenv("TEST_WHATSAPP_NUMBER"))
	if phone == "" {
		log.Fatal("Environment variable TEST_WHATSAPP_NUMBER belum diset. Contoh: set TEST_WHATSAPP_NUMBER=6281234567890 lalu jalankan ulang.")
	}

	db := config.ConnectDatabase()
	defer db.Close()

	ctx := context.Background()

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
