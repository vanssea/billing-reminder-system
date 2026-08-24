package main

import (
	"context"
	"log"

	"billing-reminder-system/config"

	"github.com/joho/godotenv"
)

// Migrasi keamanan idempoten. Jalankan dari folder backend:
//
//	go run ./cmd/dbmigrate_security
//
// Yang dilakukan:
//  1. Trigger pelindung profiles: user login (via REST Supabase) tidak dapat
//     mengubah kolom `id` maupun `role` miliknya. Koneksi backend (service key,
//     tanpa JWT) tetap diizinkan agar alur resmi (mis. UpdateAdmin oleh
//     SUPERADMIN lewat API) tidak terganggu.
//  2. Aktifkan RLS pada app_notifications + policy baca/tulis per role,
//     sehingga tabel tidak lagi terbuka bagi anon key.
func main() {
	if err := godotenv.Load(); err != nil {
		log.Fatal("Gagal membaca file .env")
	}

	db := config.ConnectDatabase()
	defer db.Close()

	const schema = `
	-- ==========================================================
	-- 1. Proteksi kolom sensitif profiles
	-- ==========================================================
	CREATE OR REPLACE FUNCTION public.protect_profile_columns()
	RETURNS trigger
	LANGUAGE plpgsql
	AS $$
	BEGIN
		-- Jalan tepercaya: backend memakai service key tanpa JWT Supabase.
		IF auth.uid() IS NULL THEN
			RETURN NEW;
		END IF;

		IF NEW.id <> OLD.id THEN
			RAISE EXCEPTION 'kolom id profiles tidak boleh diubah';
		END IF;

		IF NEW.role <> OLD.role THEN
			RAISE EXCEPTION 'perubahan role hanya melalui mekanisme resmi sistem';
		END IF;

		RETURN NEW;
	END;
	$$;

	DROP TRIGGER IF EXISTS trg_protect_profile_columns ON public.profiles;

	CREATE TRIGGER trg_protect_profile_columns
		BEFORE UPDATE ON public.profiles
		FOR EACH ROW
		EXECUTE FUNCTION public.protect_profile_columns();

	-- ==========================================================
	-- 2. RLS untuk app_notifications
	-- ==========================================================
	ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;

	DROP POLICY IF EXISTS "Staff can read internal notifications" ON public.app_notifications;
	CREATE POLICY "Staff can read internal notifications"
		ON public.app_notifications FOR SELECT TO authenticated
		USING (
			target_role IN ('ADMIN', 'SUPERADMIN', 'ALL')
			AND (has_role('ADMIN'::user_role) OR has_role('SUPERADMIN'::user_role))
		);

	DROP POLICY IF EXISTS "Client can read own notifications" ON public.app_notifications;
	CREATE POLICY "Client can read own notifications"
		ON public.app_notifications FOR SELECT TO authenticated
		USING (
			target_role = 'CLIENT'
			AND target_profile_id = auth.uid()::text
		);

	DROP POLICY IF EXISTS "Staff can update internal notifications" ON public.app_notifications;
	CREATE POLICY "Staff can update internal notifications"
		ON public.app_notifications FOR UPDATE TO authenticated
		USING (
			target_role IN ('ADMIN', 'SUPERADMIN', 'ALL')
			AND (has_role('ADMIN'::user_role) OR has_role('SUPERADMIN'::user_role))
		)
		WITH CHECK (
			target_role IN ('ADMIN', 'SUPERADMIN', 'ALL')
			AND (has_role('ADMIN'::user_role) OR has_role('SUPERADMIN'::user_role))
		);

	DROP POLICY IF EXISTS "Client can update own notifications" ON public.app_notifications;
	CREATE POLICY "Client can update own notifications"
		ON public.app_notifications FOR UPDATE TO authenticated
		USING (
			target_role = 'CLIENT'
			AND target_profile_id = auth.uid()::text
		)
		WITH CHECK (
			target_role = 'CLIENT'
			AND target_profile_id = auth.uid()::text
		);
	`

	if _, err := db.Exec(context.Background(), schema); err != nil {
		log.Fatal("Gagal menjalankan migrasi keamanan:", err)
	}

	log.Println("Migrasi keamanan selesai: trigger profiles + RLS app_notifications aktif.")
}
