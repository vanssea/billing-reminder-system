package services

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type AuthService struct {
	DB *pgxpool.Pool
}

func NewAuthService(db *pgxpool.Pool) *AuthService {
	return &AuthService{
		DB: db,
	}
}

func (s *AuthService) GetProfileByToken(token string) (*models.AuthUser, error) {
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

	client := &http.Client{}

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
			return &profile, nil
		}
		return nil, err
	}

	return &profile, nil
}