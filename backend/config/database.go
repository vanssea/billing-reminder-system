package config

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5/pgxpool"
)

func ConnectDatabase() *pgxpool.Pool {
	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		log.Fatal("DATABASE_URL tidak ditemukan")
	}

	pool, err := pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatal("Gagal membuat koneksi ke Supabase:", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatal("Database tidak merespons:", err)
	}

	log.Println("Berhasil terhubung ke Supabase!")

	return pool
}