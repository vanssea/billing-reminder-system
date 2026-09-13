# Billing Reminder System

Sistem reminder tagihan dengan **Go** (backend/chimera), **React + Vite + Tailwind** (frontend), **Supabase** (Postgres + Auth). Mengingatkan client sebelum dan sesudah jatuh tempo via **WhatsApp** (whatsmeow) dan **email** (SMTP), serta membuat **invoice PDF** via headless Chrome/Chromium.

## Arsitektur

| Bagian | Lokasi | Cara berjalan |
| ------ | ------ | ------------- |
| Backend (HTTP API) | `backend/` (`main.go`) | Service utama (Railway/web deployment) |
| Worker reminder/cron | `backend/cmd/reminderworker` | Dijalankan tiap 1 menit oleh cron OS/service |
| Frontend | `src/` | React + Vite; deploy ke Vercel |
| Database & Auth | Supabase | Postgres + Auth (`auth.users`, `profiles`) |

Backend TIDAK menjalankan scheduler in-process. Pengiriman reminder & outbox WhatsApp dikerjakan oleh worker cron. Keduanya dilindungi PostgreSQL advisory lock agar tidak terjadi pengiriman ganda.

## Prasyarat

- Go 1.23
- Node.js + npm (Vite 8)
- Project Supabase (URL, anon key, service role key, database pooler URL)
- Chrome/Chromium tersedia untuk render PDF (lihat [PDF & dependency](#pdf--dependency-chromechromium))

## Menjalankan Backend

```bash
cd backend
go build ./...
go run .        # HTTP server di :PORT (default 8080)
```

Setup env:

```bash
cp .env.example .env   # isi dengan nilai nyata
```

Variabel penting (lihat `backend/.env.example`):

- `PORT`, `APP_ENV` (gunakan `production` di deployment; mode `development` menyalakan route `/api/whatsapp/test` dan `/api/email/test`)
- `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- `CORS_ORIGINS` (daftar origin frontend, dipisah koma)
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, `SMTP_FROM_NAME`
- `WHATSAPP_DISABLED`, `WA_SESSIONS_DB_PATH` (lihat [WhatsApp](#whatsapp))
- `CHROME_PATH` (opsional; default deteksi otomatis)

### Worker reminder (cron)

```bash
cd backend
go run ./cmd/reminderworker   # satu siklus: reminder jatuh tempo + overdue + outbox WA/email
```

CC dijadwalkan tiap 1 menit oleh cron OS (Linux crontab / Windows Task Scheduler). Binary hasil build: `go build -o reminderworker.exe ./cmd/reminderworker/`.

### Utility migrasi / setup database (development only)

```bash
go run ./cmd/setupoutbox                      # buat tabel/RLS/index notification_outbox
go run ./cmd/dbmigrate_settings               # migrasi pengaturan reminder
go run ./cmd/dbmigrate_security               # indeks/constraint keamanan
go run ./cmd/dbmigrate_outbox_rls             # aktivasi RLS + self-test
go run ./cmd/dbmigrate_invoice_billing_cycle  # kolom billing_cycle invoice
go run ./cmd/dbmigrate_app_notifications      # kolom/tabel notifikasi aplikasi
go run ./cmd/dbreset                          # reset data uji local (jangan di production)
```

Skema tabel & trigger inti (mis. `handle_new_user` untuk membuat profile) dibuat via Supabase SQL editor/console; perintah di atas hanya migrasi tambahan.

## Menjalankan Frontend

```bash
npm install
cp .env.example .env   # isi VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev            # Vite dev server
npm run build          # build produksi -> dist/
npm run lint           # ESLint
```

Variabel frontend (lihat `.env.example`):

- `VITE_API_URL` — URL backend (di local `http://localhost:8080`)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase (anon key aman untuk frontend)

## Persistence WhatsApp Session

- Sesi bot WhatsApp disimpan di file DB SQLite yang diatur `WA_SESSIONS_DB_PATH`.
- Di deployment (Railway), arahkan ke **volume persisten** (mis. `/data/wa_sessions.db`) agar sesi tidak hilang saat redeploy.
- `WHATSAPP_DISABLED=true` → worker cron yang menghubungkan WhatsApp; `false` → backend yang menghubungkan (dipakai untuk pairing ulang via `POST /api/whatsapp/pair`). Hanya SATU proses boleh terhubung ke perangkat yang sama. Lihat komentar `backend/main.go` dan `backend/cmd/reminderworker/main.go`.
- Sesi pertama kali dibuat dengan pairing (kode 8 digit atau QR). Jangan commit file `wa_sessions.db` (sudah di `.gitignore`).

## PDF & dependency (Chrome/Chromium)

Invoice PDF dirender dengan `chromedp` (headless browser):

- `findBrowserPath()` memakai `CHROME_PATH` jika di-set, lalu fallback ke Chrome/Edge standar.
- Image `backend/Dockerfile.web` & `backend/Dockerfile.worker` sudah memasang `chromium` dan menetapkan `CHROME_PATH=/usr/bin/chromium`.
- Untuk run non-container, pastikan Chrome/Chromium terpasang atau set `CHROME_PATH`.
- Template PDF: `backend/templates/invoice.html` (harus ikut di-deploy/COPY).

## Deployment

**Frontend (Vercel):**

1. Build command: `npm run build`; output `dist/`.
2. Env: `VITE_API_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

**Backend (Railway, Dockerfile.web):** service utama.

- Env: `PORT`, `APP_ENV=production`, `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `CORS_ORIGINS`, `SMTP_*`, `WHATSAPP_DISABLED`, `WA_SESSIONS_DB_PATH`, `CHROME_PATH`.
- Mount volume persisten untuk `WA_SESSIONS_DB_PATH`.

**Worker/cron (Railway, Dockerfile.worker):** service cron dengan schedule `*/1 * * * *` (tiap menit), env yang sama, dan volume persisten yang sama untuk sesi WA.

> Dari sisi frontend, pagar tak perlu proxy Vite untuk produksi: API URL diambil dari `VITE_API_URL` (Vercel → Railway). Proxy Vite hanya membantu development lokal bila ingin.

## Catatan Keamanan

- Jangan commit `.env` (sudah di `.gitignore`); gunakan `.env.example` + secret manager platform.
- Sesuaikan `CORS_ORIGINS` hanya dengan origin yang dikenal.
- `SUPABASE_SERVICE_KEY` hanya dipakai di backend (bukan frontend).