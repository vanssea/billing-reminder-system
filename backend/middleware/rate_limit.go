package middleware

import (
	"net"
	"net/http"
	"sync"
	"time"
)

// rateLimiter membatasi jumlah request per IP menggunakan sliding window.
type rateLimiter struct {
	mu        sync.Mutex
	window    time.Duration
	max       int
	visitors  map[string][]time.Time
	lastClean time.Time
}

// newRateLimiter membuat limiter dengan limit `max` request per `window`.
func newRateLimiter(max int, window time.Duration) *rateLimiter {
	return &rateLimiter{
		window:    window,
		max:       max,
		visitors:  make(map[string][]time.Time),
		lastClean: time.Now(),
	}
}

// allow memeriksa apakah request dari IP tertentu masih diizinkan.
func (rl *rateLimiter) allow(ip string) bool {
	now := time.Now()

	rl.mu.Lock()
	defer rl.mu.Unlock()

	// Bersihkan entri lama secara berkala agar map tidak membengkak.
	if now.Sub(rl.lastClean) > time.Minute {
		for k, ts := range rl.visitors {
			cutoff := now.Add(-rl.window)
			kept := ts[:0]
			for _, t := range ts {
				if t.After(cutoff) {
					kept = append(kept, t)
				}
			}
			if len(kept) == 0 {
				delete(rl.visitors, k)
			} else {
				rl.visitors[k] = kept
			}
		}
		rl.lastClean = now
	}

	cutoff := now.Add(-rl.window)
	kept := make([]time.Time, 0, len(rl.visitors[ip])+1)
	for _, t := range rl.visitors[ip] {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}

	if len(kept) >= rl.max {
		rl.visitors[ip] = kept
		return false
	}

	rl.visitors[ip] = append(kept, now)
	return true
}

// RateLimit mengembalikan middleware HTTP yang menolak 429 bila IP melampaui
// `limit` request dalam `window` waktu.
func RateLimit(limit int, window time.Duration) func(http.Handler) http.Handler {
	limiter := newRateLimiter(limit, window)

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ip, _, err := net.SplitHostPort(r.RemoteAddr)
			if err != nil {
				ip = r.RemoteAddr
			}
			// Dukungan proxy/load balancer: pakai X-Forwarded-For terdepan.
			if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
				if first := firstIP(xff); first != "" {
					ip = first
				}
			}

			if !limiter.allow(ip) {
				http.Error(w, "Terlalu banyak permintaan, coba lagi nanti", http.StatusTooManyRequests)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// firstIP mengambil IP pertama dari daftar X-Forwarded-For.
func firstIP(xff string) string {
	end := len(xff)
	for i := 0; i < len(xff); i++ {
		if xff[i] == ',' {
			end = i
			break
		}
	}
	return xff[:end]
}