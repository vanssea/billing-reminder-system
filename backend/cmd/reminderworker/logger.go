package main

import (
	"io"
	"log"
	"os"
	"path/filepath"
)

// resolveBackendDir mencari direktori proyek backend (yang berisi .env), dimulai
// dari direktori kerja lalu naik ke folder binary. Task Scheduler memanggil via
// VBS dengan working directory = folder backend, tetapi fallback ini membuat
// logger tetap konsisten walau binary dijalankan dari lokasi lain.
func resolveBackendDir() string {
	search := func(start string) string {
		for dir := start; ; dir = filepath.Dir(dir) {
			if _, err := os.Stat(filepath.Join(dir, ".env")); err == nil {
				return dir
			}
			if dir == filepath.Dir(dir) {
				return ""
			}
		}
	}
	if cwd, err := os.Getwd(); err == nil {
		if dir := search(cwd); dir != "" {
			return dir
		}
	}
	if exe, err := os.Executable(); err == nil {
		if dir := search(filepath.Dir(exe)); dir != "" {
			return dir
		}
	}
	return "."
}

// setupFileLogger mengarahkan seluruh output log worker (termasuk pesan log
// dari package services) ke konsol DAN file persistent logs/reminderworker.log.
// Directory log dibuat otomatis jika belum ada. Aman saat dijalankan
// non-interactive oleh Task Scheduler karena file IO tidak membutuhkan jendela
// konsol. Token/password/data isi pesan tidak pernah dicatat ke file ini.
func setupFileLogger() (*os.File, error) {
	baseDir := resolveBackendDir()
	logsDir := filepath.Join(baseDir, "logs")
	if err := os.MkdirAll(logsDir, 0o755); err != nil {
		return nil, err
	}
	f, err := os.OpenFile(
		filepath.Join(logsDir, "reminderworker.log"),
		os.O_CREATE|os.O_APPEND|os.O_WRONLY,
		0o644,
	)
	if err != nil {
		return nil, err
	}
	log.SetOutput(io.MultiWriter(os.Stdout, f))
	log.SetFlags(log.LstdFlags)
	return f, nil
}

// logInfo menulis baris log berlevel INFO dengan timestamp (LstdFlags).
func logInfo(format string, args ...any) {
	log.Printf("[INFO] "+format, args...)
}

// logError menulis baris log berlevel ERROR dengan timestamp (LstdFlags).
func logError(format string, args ...any) {
	log.Printf("[ERROR] "+format, args...)
}