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
// Siklus ini memakai advisory lock PostgreSQL sehingga tidak akan terjadi
// pengiriman ganda.
// WhatsApp hanya izinkan satu koneksi per device. Aturan kepemilikan koneksi
// (XOR dengan backend main.go):
//   - WHATSAPP_DISABLED=true  -> worker yang menyambung WA (mode cron normal).
//   - WHATSAPP_DISABLED=false/kosong -> worker melewatkan WA (digunakan saat
//     pairing ulang lewat backend /api/whatsapp/pair).
func main() {
	loadEnv()

	started := time.Now()

	logFile, err := setupFileLogger()
	if err != nil {
		log.Printf("Peringatan: gagal membuka file log: %v (log hanya ke console)", err)
	} else {
		defer logFile.Close()
	}
	logInfo("Worker started")

	// Antrian lock ini opsional namun mencegah tumpang-tindih antar sesi worker
	// (mis. run sebelumnya > 1 menit). Implementasi konkurensi ganda tetap
	// dilindungi oleh pg_try_advisory_lock di dalam RunReminderCycle.
	db := config.ConnectDatabase()
	defer db.Close()

	pdfService := services.NewPDFService()

	// Koneksi WhatsApp dimiliki worker hanya saat WHATSAPP_DISABLED=true.
	// Saat false, backend memegang koneksi untuk keperluan pairing ulang; worker
	// ikut connect akan membuat dua koneksi ke device yang sama (saling lempar).
	var waService *services.WhatsAppService
	if os.Getenv("WHATSAPP_DISABLED") == "true" {
		var waErr error
		waService, waErr = services.NewWhatsAppService()
		if waErr != nil {
			log.Printf("WhatsApp service tidak aktif: %v (WA dilewati)", waErr)
		} else {
			// NewWhatsAppService terhubung secara async; tunggu sebentar secara sinkron.
			connCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
			connected := waService.WaitUntilConnected(connCtx)
			cancel()
			if connected {
				log.Println("WhatsApp terhubung.")
			} else {
				log.Println("WhatsApp belum terhubung dalam 30 detik; lanjut tanpa WA.")
			}
		}
	} else {
		log.Println("WHATSAPP_DISABLED=false: koneksi WA dipegang backend (mode pairing); worker melewati WA.")
	}

	emailService := services.NewEmailService()
	if emailService == nil {
		log.Println("Email service tidak aktif: SMTP_HOST belum dikonfigurasi")
	}

	reminderService := services.NewReminderService(db)
	reminderService.WhatsApp = waService
	reminderService.Email = emailService
	reminderService.PDF = pdfService

	logInfo("Reminder cycle started")
	ran, err := reminderService.RunReminderCycle(context.Background())
	if err != nil {
		logError("Reminder cycle error: %v", err)
		os.Exit(1)
	}
	if ran {
		logInfo("Reminder cycle selesai duration=%s", time.Since(started).Round(time.Millisecond))
	} else {
		logInfo("Cycle dilewati: proses lain memegang lock reminder (advisory lock).")
	}

	// Kirim notifikasi WA yang dijadwalkan backend lewat tabel outbox
	// (invoice baru, pembayaran disetujui/ditolak).
	// Dilindungi advisory lock terpisah agar dua worker overlap tidak mengirim
	// outbox yang sama dua kali.
	logInfo("Outbox processing started")
	outboxRelease, outboxLocked := reminderService.TryAcquireOutboxLock(context.Background())
	if outboxLocked {
		reminderService.ProcessOutbox(context.Background())
		outboxRelease()
	} else {
		logInfo("Outbox dilewati: proses lain memegang lock outbox.")
	}

	if waService != nil {
		waService.Close()
	}
	logInfo("Worker finished duration=%s", time.Since(started).Round(time.Millisecond))
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