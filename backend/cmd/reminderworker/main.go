package main

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"time"

	"billing-reminder-system/config"
	"billing-reminder-system/services"

	"github.com/joho/godotenv"
)

// reminderworker adalah cron job reminder tagihan yang berdiri sendiri.
// Binary ini dijalankan setiap 1 menit oleh cron OS (Windows Task Scheduler
// / Linux crontab). Setiap jalan ia: menghubungi DB, (opsional) menyambung
// WhatsApp, lalu memproses semua reminder PENDING yang jatuh tempo beserta
// invoice yang melewati jatuh tempo, kemudian keluar.
//
// Siklus ini memakai advisory lock yang sama dengan scheduler in-process
// (main.go), sehingga tidak akan terjadi pengiriman ganda saat keduanya jalan.
// Saat memakai worker ini, set REMINDER_SCHEDULER_DISABLED=true di .env.
func main() {
	loadEnv()

	// Antrian lock ini opsional namun mencegah tumpang-tindih antar sesi worker
	// (mis. run sebelumnya > 1 menit). Implementasi konkurensi ganda tetap
	// dilindungi oleh pg_try_advisory_lock di dalam RunReminderCycle.
	db := config.ConnectDatabase()
	defer db.Close()

	pdfService := services.NewPDFService()
	waService, waErr := services.NewWhatsAppService()
	if waErr != nil {
		log.Printf("WhatsApp service tidak aktif: %v (WA dilewati)", waErr)
	}
	emailService := services.NewEmailService()
	if emailService == nil {
		log.Println("Email service tidak aktif: SMTP_HOST belum dikonfigurasi")
	}

	reminderService := services.NewReminderService(db)
	reminderService.WhatsApp = waService
	reminderService.Email = emailService
	reminderService.PDF = pdfService

	// NewWhatsAppService terhubung secara async; tunggu sebentar secara sinkron.
	if waErr == nil && waService != nil {
		connCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		connected := waService.WaitUntilConnected(connCtx)
		cancel()
		if connected {
			log.Println("WhatsApp terhubung.")
		} else {
			log.Println("WhatsApp belum terhubung dalam 30 detik; lanjut tanpa WA.")
		}
	}

	ran, err := reminderService.RunReminderCycle(context.Background())
	if err != nil {
		log.Printf("Reminder cycle error: %v", err)
		os.Exit(1)
	}
	if ran {
		log.Println("Reminder cycle selesai.")
	} else {
		log.Println("Cycle dilewati: proses lain memegang lock reminder.")
	}

	if waService != nil {
		waService.Close()
	}
}

// loadEnv membaca .env dari direktori kerja, lalu fallback ke folder binary.
// Ini penting karena cron/Windows Task Scheduler bisa memanggil dari mana saja.
func loadEnv() {
	if err := godotenv.Load(); err == nil {
		return
	}
	exe, err := os.Executable()
	if err != nil {
		log.Println("Peringatan: .env tidak ditemukan; gunakan variabel env sistem/cron")
		return
	}
	for dir := filepath.Dir(exe); ; dir = filepath.Dir(dir) {
		p := filepath.Join(dir, ".env")
		if _, err := os.Stat(p); err == nil {
			if err := godotenv.Load(p); err != nil {
				log.Printf("Peringatan: gagal memuat %s: %v", p, err)
			}
			return
		}
		if dir == filepath.Dir(dir) {
			break
		}
	}
	log.Println("Peringatan: .env tidak ditemukan; gunakan variabel env sistem/cron")
}