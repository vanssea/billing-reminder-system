package main

import (
	"context"
	"fmt"
	"log"

	"billing-reminder-system/config"

	"github.com/joho/godotenv"
)

// Migrasi keamanan RLS untuk notification_outbox (idempotent). Jalankan dari
// folder backend:
//
//	go run ./cmd/dbmigrate_outbox_rls
//
// Latar belakang: notification_outbox berada di schema public sehingga dapat
// diekspos Supabase PostgREST. RLS diaktifkan tanpa menambah policy untuk role
// anon/authenticated (tanpa policy, RLS menolak seluruh akses role non-service).
//
// Backend (INSERT) dan reminderworker (SELECT/UPDATE) memakai koneksi postgres
// (service role, DATABASE_URL) yang mem-bypass RLS, sehingga alur kerja outbox
// tidak berubah. Frontend tidak pernah mengakses tabel ini (hanya Auth + Storage).
func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Gagal membaca file .env")
	}

	db := config.ConnectDatabase()
	defer db.Close()
	ctx := context.Background()

	// Pastikan tabel ada (idempotent) supaya migrasi aman walau dijalankan
	// sebelum cmd/setupoutbox.
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
		log.Fatal("Gagal memastikan tabel notification_outbox:", err)
	}

	// Enable RLS. TIDAK ada policy untuk anon/authenticated: RLS menolak semua
	// akses (SELECT/INSERT/UPDATE/DELETE) untuk role tersebut. Hanya role service
	// (postgres/service_role) yang mem-bypass RLS yang dapat mengakses.
	if _, err := db.Exec(ctx, `ALTER TABLE public.notification_outbox ENABLE ROW LEVEL SECURITY`); err != nil {
		log.Fatal("Gagal mengaktifkan RLS notification_outbox:", err)
	}

	if _, err := db.Exec(ctx, `
		COMMENT ON TABLE public.notification_outbox IS
		'Antrian WA yang diproses reminderworker. RLS aktif tanpa policy anon/authenticated; hanya service role yang dapat mengakses.'
	`); err != nil {
		log.Fatal("Gagal menambah komentar tabel:", err)
	}

	fmt.Println("RLS notification_outbox diaktifkan (tanpa policy anon/authenticated).")

	// ---- Verifikasi ----
	var role string
	if err := db.QueryRow(ctx, `SELECT current_user`).Scan(&role); err != nil {
		log.Fatal("Gagal membaca current_user:", err)
	}
	fmt.Printf("Role koneksi (service role backend/worker): %s\n", role)

	var rlsOn bool
	if err := db.QueryRow(ctx,
		`SELECT c.relrowsecurity FROM pg_class c WHERE c.oid = 'public.notification_outbox'::regclass`,
	).Scan(&rlsOn); err != nil {
		log.Fatal("Gagal memeriksa status RLS:", err)
	}
	fmt.Printf("RLS aktif: %v\n", rlsOn)

	var policyCount int
	if err := db.QueryRow(ctx,
		`SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notification_outbox'`,
	).Scan(&policyCount); err != nil {
		log.Fatal("Gagal memeriksa jumlah policy:", err)
	}
	fmt.Printf("Jumlah policy notification_outbox: %d (0 = anon/authenticated tidak punya akses)\n", policyCount)

	// Self-test akses role service (role yang dipakai backend & worker):
	// INSERT, SELECT, UPDATE. Dijalankan dalam transaksi lalu di-rollback agar
	// tidak meninggalkan data uji di antrian nyata.
	tx, err := db.Begin(ctx)
	if err != nil {
		log.Fatal("Gagal memulai transaksi verifikasi:", err)
	}
	defer tx.Rollback(ctx)

	var id string
	if err := tx.QueryRow(ctx,
		`INSERT INTO public.notification_outbox (notif_type) VALUES ('__SELFTEST__') RETURNING id::text`,
	).Scan(&id); err != nil {
		log.Fatal("INSERT role service GAGAL (backend akan terganggu):", err)
	}

	var status string
	if err := tx.QueryRow(ctx,
		`SELECT status FROM public.notification_outbox WHERE id = $1`, id,
	).Scan(&status); err != nil {
		log.Fatal("SELECT role service GAGAL (worker akan terganggu):", err)
	}

	tag, err := tx.Exec(ctx,
		`UPDATE public.notification_outbox SET status = 'SENT', attempts = attempts + 1, error_message = NULL, sent_at = now() WHERE id = $1`, id,
	)
	if err != nil {
		log.Fatal("UPDATE role service GAGAL (worker akan terganggu):", err)
	}
	if tag.RowsAffected() != 1 {
		log.Fatalf("UPDATE role service memengaruhi %d baris (harus 1)", tag.RowsAffected())
	}

	fmt.Println("Self-test role service (INSERT/SELECT/UPDATE PENDING->SENT) berhasil; data di-rollback.")
	fmt.Println("Migrasi RLS notification_outbox selesai.")
}