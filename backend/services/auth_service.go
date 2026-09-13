package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// profileCacheTTL menentukan berapa lama profil hasil autentikasi disimpan
// sebelum divalidasi ulang ke Supabase. Nilai kecil menyeimbangkan performa
// (mengurangi HTTP call per request) dengan keamanan (token yang di-revoke
// tetap diakui paling lama TTL ini).
const profileCacheTTL = 60 * time.Second

type profileCacheEntry struct {
	profile   *models.AuthUser
	expiresAt time.Time
}

type AuthService struct {
	DB            *pgxpool.Pool
	ClientService *ClientService

	cacheMu     sync.Mutex
	profileCache map[string]profileCacheEntry
}

func NewAuthService(db *pgxpool.Pool, clientService *ClientService) *AuthService {
	return &AuthService{
		DB:            db,
		ClientService: clientService,
		profileCache:  make(map[string]profileCacheEntry),
	}
}

func (s *AuthService) Register(req models.RegisterRequest) (*models.AuthUser, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceRoleKey := os.Getenv("SUPABASE_SERVICE_KEY")

	if supabaseURL == "" || serviceRoleKey == "" {
		return nil, fmt.Errorf("SUPABASE_URL atau SUPABASE_SERVICE_KEY belum diset")
	}

	// Buat user di Supabase Auth via Admin API
	payload := map[string]interface{}{
		"email":         req.Email,
		"password":      req.Password,
		"email_confirm": true,
		"user_metadata": map[string]interface{}{
			"full_name": req.FullName,
		},
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	authURL := supabaseURL + "/auth/v1/admin/users"

	httpReq, err := http.NewRequest(http.MethodPost, authURL, bytes.NewBuffer(body))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("apikey", serviceRoleKey)
	httpReq.Header.Set("Authorization", "Bearer "+serviceRoleKey)

	client := &http.Client{Timeout: 15 * time.Second}

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errorResponse map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errorResponse)

		msg, _ := errorResponse["msg"].(string)
		if strings.Contains(strings.ToLower(msg), "already been registered") {
			return nil, fmt.Errorf("email sudah terdaftar")
		}

		return nil, fmt.Errorf("gagal membuat user auth: %v", errorResponse)
	}

	var authUser struct {
		ID string `json:"id"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&authUser); err != nil {
		return nil, err
	}

	// Tunggu profil dibuat oleh trigger (retry 3x)
	var profile models.AuthUser
	for i := 0; i < 3; i++ {
		err = s.DB.QueryRow(
			context.Background(),
			`SELECT id, full_name, role FROM profiles WHERE id = $1`,
			authUser.ID,
		).Scan(&profile.ID, &profile.FullName, &profile.Role)
		if err == nil {
			break
		}
		time.Sleep(100 * time.Millisecond)
	}

	if err != nil {
		return nil, fmt.Errorf("profil tidak ditemukan setelah register: %w", err)
	}

	profile.Email = req.Email

	return &profile, nil
}

func (s *AuthService) GetProfileByToken(token string) (*models.AuthUser, error) {
	// Cache hit: profil masih valid dalam jendela TTL, hindari HTTP call.
	s.cacheMu.Lock()
	if entry, ok := s.profileCache[token]; ok && time.Now().Before(entry.expiresAt) {
		profile := entry.profile
		s.cacheMu.Unlock()
		return profile, nil
	}
	s.cacheMu.Unlock()

	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceRoleKey := os.Getenv("SUPABASE_SERVICE_KEY")

	if supabaseURL == "" || serviceRoleKey == "" {
		return nil, fmt.Errorf("SUPABASE_URL atau SUPABASE_SERVICE_KEY belum diset")
	}

	// Validasi token melalui Supabase Auth
	req, err := http.NewRequest(http.MethodGet, supabaseURL+"/auth/v1/user", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("apikey", serviceRoleKey)
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{Timeout: 15 * time.Second}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, fmt.Errorf("token tidak valid")
	}

	var authUser struct {
		ID    string `json:"id"`
		Email string `json:"email"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&authUser); err != nil {
		return nil, err
	}

	// Ambil profil dari tabel profiles
	var profile models.AuthUser
	profile.ID = authUser.ID
	profile.Email = authUser.Email

	err = s.DB.QueryRow(
		context.Background(),
		`SELECT full_name, role FROM profiles WHERE id = $1`,
		authUser.ID,
	).Scan(&profile.FullName, &profile.Role)

	if err != nil {
		if err == pgx.ErrNoRows {
			profile.FullName = authUser.Email
			profile.Role = "CLIENT"
			// User tanpa profile (belum di-provisioning) dianggap CLIENT.
			log.Printf("PERINGATAN: user %s (%s) tidak memiliki profile, default CLIENT",
				authUser.ID, authUser.Email)
			s.cacheProfile(token, &profile)
			return &profile, nil
		}
		return nil, err
	}

	s.cacheProfile(token, &profile)

	return &profile, nil
}

// cacheProfile menyimpan profil dengan TTL agar request berikutnya tidak
// memanggil Supabase berulang kali.
func (s *AuthService) cacheProfile(token string, profile *models.AuthUser) {
	s.cacheMu.Lock()
	s.profileCache[token] = profileCacheEntry{
		profile:   profile,
		expiresAt: time.Now().Add(profileCacheTTL),
	}
	s.cacheMu.Unlock()
}
