package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"billing-reminder-system/config"

	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Gagal membaca file .env")
	}

	db := config.ConnectDatabase()
	defer db.Close()

	fmt.Println("=== Daftar client (id, nama, HP) ===")
	rows, err := db.Query(context.Background(), `
		SELECT id, company_name, COALESCE(phone, '(kosong)') FROM clients ORDER BY created_at
	`)
	if err != nil {
		log.Fatal("Gagal query clients:", err)
	}
	defer rows.Close()
	for rows.Next() {
		var id, name, phone string
		if err := rows.Scan(&id, &name, &phone); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("- %s | %s | %s\n", id[:8], name, phone)
	}

	fmt.Println("\n=== Reminder INV-2026-006 ===")
	rows2, err := db.Query(context.Background(), `
		SELECT r.reminder_type, r.status, r.scheduled_at,
		       COALESCE(r.sent_at::text, '-'), COALESCE(r.error_message, '-')
		FROM reminders r
		INNER JOIN invoices i ON i.id = r.invoice_id
		WHERE i.invoice_number = 'INV-2026-006'
		ORDER BY r.scheduled_at
	`)
	if err != nil {
		log.Fatal("Gagal query reminders:", err)
	}
	defer rows2.Close()
	for rows2.Next() {
		var rtype, status, sentAt, errMsg string
		var scheduledAt time.Time
		if err := rows2.Scan(&rtype, &status, &scheduledAt, &sentAt, &errMsg); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("- %s | %s | jadwal: %s | terkirim: %s | error: %s\n",
			rtype, status, scheduledAt.Format("02 Jan 15:04"), sentAt, errMsg)
	}
}
