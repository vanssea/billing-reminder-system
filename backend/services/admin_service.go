package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminService struct {
	DB *pgxpool.Pool
}

func NewAdminService(db *pgxpool.Pool) *AdminService {
	return &AdminService{
		DB: db,
	}
}

func (s *AdminService) GetAdmins() ([]models.Admin, error) {
	query := `
		SELECT
			p.id,
			p.full_name,
			u.email,
			p.phone,
			p.role,
			p.created_at,
			p.updated_at
		FROM profiles p
		JOIN auth.users u ON u.id = p.id
		WHERE p.role = 'ADMIN'
		ORDER BY p.created_at DESC
	`

	rows, err := s.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var admins []models.Admin

	for rows.Next() {
		var admin models.Admin

		err := rows.Scan(
			&admin.ID,
			&admin.FullName,
			&admin.Email,
			&admin.Phone,
			&admin.Role,
			&admin.CreatedAt,
			&admin.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		admins = append(admins, admin)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return admins, nil
}
func (s *AdminService) CreateAdmin(req models.CreateAdminRequest) (*models.Admin, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceRoleKey := os.Getenv("SUPABASE_SERVICE_KEY")

	if supabaseURL == "" || serviceRoleKey == "" {
		return nil, fmt.Errorf("SUPABASE_URL atau SUPABASE_SERVICE_KEY belum diset")
	}

	// Request ke Supabase Auth Admin API
	payload := map[string]interface{}{
		"email":         req.Email,
		"password":      req.Password,
		"email_confirm": true,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	authURL := supabaseURL + "/auth/v1/admin/users"

	httpReq, err := http.NewRequest(
		"POST",
		authURL,
		bytes.NewBuffer(body),
	)
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("apikey", serviceRoleKey)
	httpReq.Header.Set("Authorization", "Bearer "+serviceRoleKey)

	client := &http.Client{}

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errorResponse map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errorResponse)

		return nil, fmt.Errorf("gagal membuat user auth: %v", errorResponse)
	}

	var authUser struct {
		ID string `json:"id"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&authUser); err != nil {
		return nil, err
	}

	// Masukkan user ke profiles
	query := `
		INSERT INTO profiles (
			id,
			full_name,
			phone,
			role
		)
		VALUES ($1, $2, $3, 'ADMIN')
		RETURNING
			id,
			full_name,
			phone,
			role,
			created_at,
			updated_at
	`

	var admin models.Admin

	err = s.DB.QueryRow(
		context.Background(),
		query,
		authUser.ID,
		req.FullName,
		req.Phone,
	).Scan(
		&admin.ID,
		&admin.FullName,
		&admin.Phone,
		&admin.Role,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	admin.Email = req.Email

	return &admin, nil
}
func (s *AdminService) GetAdminByID(id string) (*models.Admin, error) {
	query := `
		SELECT
			p.id,
			p.full_name,
			u.email,
			p.phone,
			p.role,
			p.created_at,
			p.updated_at
		FROM profiles p
		JOIN auth.users u ON u.id = p.id
		WHERE p.id = $1
		  AND p.role = 'ADMIN'
	`

	var admin models.Admin

	err := s.DB.QueryRow(
		context.Background(),
		query,
		id,
	).Scan(
		&admin.ID,
		&admin.FullName,
		&admin.Email,
		&admin.Phone,
		&admin.Role,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &admin, nil
}
func (s *AdminService) UpdateAdmin(id string, req models.UpdateAdminRequest) (*models.Admin, error) {
	query := `
		UPDATE profiles
		SET
			full_name = $1,
			role = $2,
			phone = $3,
			updated_at = NOW()
		WHERE id = $4
		  AND role IN ('ADMIN', 'SUPERADMIN')
		RETURNING
			id,
			full_name,
			phone,
			role,
			created_at,
			updated_at
	`

	var admin models.Admin

	err := s.DB.QueryRow(
		context.Background(),
		query,
		req.FullName,
		req.Role,
		req.Phone,
		id,
	).Scan(
		&admin.ID,
		&admin.FullName,
		&admin.Phone,
		&admin.Role,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Ambil email dari auth.users
	err = s.DB.QueryRow(
		context.Background(),
		`SELECT email FROM auth.users WHERE id = $1`,
		id,
	).Scan(&admin.Email)

	if err != nil {
		return nil, err
	}

	return &admin, nil
}
func (s *AdminService) DeleteAdmin(id string) error {
	supabaseURL := os.Getenv("SUPABASE_URL")
	secretKey := os.Getenv("SUPABASE_SERVICE_KEY")

	if supabaseURL == "" || secretKey == "" {
		return fmt.Errorf("SUPABASE_URL atau SUPABASE_SERVICE_KEY belum diset")
	}

	// Hapus user dari Supabase Auth
	url := fmt.Sprintf("%s/auth/v1/admin/users/%s", supabaseURL, id)

	req, err := http.NewRequest(http.MethodDelete, url, nil)
	if err != nil {
		return err
	}

	req.Header.Set("apikey", secretKey)
	req.Header.Set("Authorization", "Bearer "+secretKey)

	client := &http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)

		return fmt.Errorf(
			"gagal menghapus user dari Supabase Auth: status %d: %s",
			resp.StatusCode,
			string(body),
		)
	}

	// Hapus profile
	_, err = s.DB.Exec(
		context.Background(),
		`DELETE FROM profiles WHERE id = $1`,
		id,
	)

	if err != nil {
		return fmt.Errorf("gagal menghapus profile: %w", err)
	}

	return nil
}