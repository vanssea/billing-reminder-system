package config

import (
	"context"
	"log"
	"os"

	"github.com/jackc/pgx/v5"
)

func ConnectDatabase() *pgx.Conn {
	databaseURL := os.Getenv("DATABASE_URL")

	if databaseURL == "" {
		log.Fatal("DATABASE_URL tidak ditemukan")
	}

	conn, err := pgx.Connect(context.Background(), databaseURL)
	if err != nil {
		log.Fatal("Gagal terhubung ke Supabase:", err)
	}

	err = conn.Ping(context.Background())
	if err != nil {
		log.Fatal("Database tidak merespons:", err)
	}

	log.Println("Berhasil terhubung ke Supabase!")

	return conn
}