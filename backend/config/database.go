package config

import (
	"context"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func ConnectDatabase() *pgxpool.Pool {
	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		log.Fatal("DATABASE_URL tidak ditemukan")
	}

	cfg, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		log.Fatal("Gagal memparse konfigurasi database:", err)
	}

	// Tuning connection pool. Supabase di plan gratis/startup punya limit
	// koneksi kecil, jadi kita batasi pool dengan nilai yang wajar.
	cfg.MaxConns = 10
	cfg.MinConns = 1
	cfg.MaxConnLifetime = 30 * time.Minute
	cfg.MaxConnLifetimeJitter = 5 * time.Minute
	cfg.MaxConnIdleTime = 5 * time.Minute
	cfg.HealthCheckPeriod = 1 * time.Minute

	pool, err := pgxpool.NewWithConfig(context.Background(), cfg)
	if err != nil {
		log.Fatal("Gagal membuat koneksi ke Supabase:", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatal("Database tidak merespons:", err)
	}

	log.Println("Berhasil terhubung ke Supabase!")

	return pool
}