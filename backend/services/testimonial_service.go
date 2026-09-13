package services

import (
	"context"
	"fmt"
	"strings"
	"unicode"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TestimonialService struct {
	DB           *pgxpool.Pool
	ClientService *ClientService
}

func NewTestimonialService(db *pgxpool.Pool, clientService *ClientService) *TestimonialService {
	return &TestimonialService{
		DB:           db,
		ClientService: clientService,
	}
}

func scanTestimonial(row pgx.Row) (*models.Testimonial, error) {
	var testimonial models.Testimonial

	err := row.Scan(
		&testimonial.ID,
		&testimonial.Name,
		&testimonial.Role,
		&testimonial.Quote,
		&testimonial.Initials,
		&testimonial.Tone,
		&testimonial.Rating,
		&testimonial.Status,
		&testimonial.DisplayOrder,
		&testimonial.ClientID,
		&testimonial.PurchaseID,
		&testimonial.CreatedByID,
		&testimonial.CreatedAt,
		&testimonial.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &testimonial, nil
}

func (s *TestimonialService) GetTestimonials(limit int) ([]models.Testimonial, error) {
	query := `
		SELECT
			id, name, role, quote, initials, tone, rating, status,
			display_order, client_id, purchase_id, created_by_id,
			created_at, updated_at
		FROM testimonials
		ORDER BY display_order ASC
	`
	args := []any{}
	if limit > 0 {
		if limit > 50 {
			limit = 50
		}
		query += ` LIMIT $1`
		args = append(args, limit)
	}

	rows, err := s.DB.Query(context.Background(), query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var testimonials []models.Testimonial

	for rows.Next() {
		testimonial, err := scanTestimonial(rows)
		if err != nil {
			return nil, err
		}

		testimonials = append(testimonials, *testimonial)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return testimonials, nil
}

func (s *TestimonialService) GetTestimonialByID(id string) (*models.Testimonial, error) {
	query := `
		SELECT
			id, name, role, quote, initials, tone, rating, status,
			display_order, client_id, purchase_id, created_by_id,
			created_at, updated_at
		FROM testimonials
		WHERE id = $1
	`

	return scanTestimonial(s.DB.QueryRow(context.Background(), query, id))
}

func (s *TestimonialService) CreateTestimonial(req models.CreateTestimonialRequest) (*models.Testimonial, error) {
	query := `
		INSERT INTO testimonials (
			name, role, quote, initials, tone, rating, status,
			display_order
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING
			id, name, role, quote, initials, tone, rating, status,
			display_order, client_id, purchase_id, created_by_id,
			created_at, updated_at
	`

	return scanTestimonial(s.DB.QueryRow(
		context.Background(),
		query,
		req.Name, req.Role, req.Quote, req.Initials,
		req.Tone, req.Rating, req.Status, req.DisplayOrder,
	))
}

func (s *TestimonialService) UpdateTestimonial(id string, req models.UpdateTestimonialRequest) (*models.Testimonial, error) {
	query := `
		UPDATE testimonials
		SET
			name = $1, role = $2, quote = $3, initials = $4,
			tone = $5, rating = $6, status = $7, display_order = $8,
			updated_at = now()
		WHERE id = $9
		RETURNING
			id, name, role, quote, initials, tone, rating, status,
			display_order, client_id, purchase_id, created_by_id,
			created_at, updated_at
	`

	return scanTestimonial(s.DB.QueryRow(
		context.Background(),
		query,
		req.Name, req.Role, req.Quote, req.Initials,
		req.Tone, req.Rating, req.Status, req.DisplayOrder,
		id,
	))
}

func (s *TestimonialService) DeleteTestimonial(id string) error {
	query := `DELETE FROM testimonials WHERE id = $1`
	_, err := s.DB.Exec(context.Background(), query, id)
	return err
}

func (s *TestimonialService) HasTestimonialByClientID(clientID string) (bool, error) {
	query := `SELECT EXISTS(SELECT 1 FROM testimonials WHERE client_id = $1)`
	var exists bool
	err := s.DB.QueryRow(context.Background(), query, clientID).Scan(&exists)
	if err != nil {
		return false, err
	}
	return exists, nil
}

// initialsFromName mengambil huruf pertama tiap kata (maks 2 huruf),
// aman untuk UTF-8. Contoh: "Raka Pratama" -> "RP".
func initialsFromName(name string) string {
	parts := strings.Fields(name)
	if len(parts) == 0 {
		return ""
	}
	initials := ""
	for i, p := range parts {
		if i >= 2 {
			break
		}
		for _, r := range p {
			initials += string(unicode.ToUpper(r))
			break
		}
	}
	return initials
}

func (s *TestimonialService) HasApprovedPurchaseByClientID(clientID string) (bool, *string, error) {
	query := `
		SELECT id FROM purchase_requests
		WHERE client_id = $1 AND status = 'APPROVED'
		ORDER BY created_at DESC
		LIMIT 1
	`
	var purchaseID string
	err := s.DB.QueryRow(context.Background(), query, clientID).Scan(&purchaseID)
	if err != nil {
		if err == pgx.ErrNoRows {
			return false, nil, nil
		}
		return false, nil, err
	}
	return true, &purchaseID, nil
}

func (s *TestimonialService) GetApprovedPurchasesByClientID(clientID string) ([]models.PurchaseRequestModel, error) {
	query := `
		SELECT
			id, client_id, profile_id, product_id, product_name, billing_cycle, amount, status, admin_notes, created_at, updated_at
		FROM purchase_requests
		WHERE client_id = $1 AND status = 'APPROVED'
		ORDER BY created_at DESC
	`

	rows, err := s.DB.Query(context.Background(), query, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	requests := []models.PurchaseRequestModel{}
	for rows.Next() {
		var req models.PurchaseRequestModel
		if err := rows.Scan(
			&req.ID,
			&req.ClientID,
			&req.ProfileID,
			&req.ProductID,
			&req.ProductName,
			&req.BillingCycle,
			&req.Amount,
			&req.Status,
			&req.AdminNotes,
			&req.CreatedAt,
			&req.UpdatedAt,
		); err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, rows.Err()
}

func (s *TestimonialService) GetClientEligibility(profileID string) (*models.TestimonialEligibilityResponse, error) {
	client, err := s.ClientService.GetClientByProfileID(profileID)
	if err != nil {
		return nil, fmt.Errorf("client tidak ditemukan: %w", err)
	}

	approved, err := s.GetApprovedPurchasesByClientID(client.ID)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil riwayat pembelian: %w", err)
	}

	hasTestimonial, err := s.HasTestimonialByClientID(client.ID)
	if err != nil {
		return nil, fmt.Errorf("gagal memeriksa testimoni yang sudah ada: %w", err)
	}

	return &models.TestimonialEligibilityResponse{
		HasApprovedPurchase: len(approved) > 0,
		HasTestimonial:      hasTestimonial,
		ApprovedPurchases:   approved,
	}, nil
}

func (s *TestimonialService) CreateClientTestimonial(profileID string, req models.CreateClientTestimonialRequest) (*models.Testimonial, error) {
	client, err := s.ClientService.GetClientByProfileID(profileID)
	if err != nil {
		return nil, fmt.Errorf("client tidak ditemukan: %w", err)
	}

	hasTestimonial, err := s.HasTestimonialByClientID(client.ID)
	if err != nil {
		return nil, fmt.Errorf("gagal memeriksa testimoni yang sudah ada: %w", err)
	}
	if hasTestimonial {
		return nil, fmt.Errorf("Anda sudah pernah memberikan testimoni")
	}

	hasApprovedPurchase, purchaseID, err := s.HasApprovedPurchaseByClientID(client.ID)
	if err != nil {
		return nil, fmt.Errorf("gagal memeriksa riwayat pembelian: %w", err)
	}
	if !hasApprovedPurchase {
		return nil, fmt.Errorf("Anda harus memiliki pembelian yang disetujui sebelum dapat memberikan testimoni")
	}

	// Nama pembeli otomatis dari data client (pic_name), fallback ke company.
	buyerName := strings.TrimSpace(client.PICName)
	if buyerName == "" {
		buyerName = strings.TrimSpace(client.CompanyName)
	}

	initials := initialsFromName(buyerName)
	if initials == "" {
		initials = buyerName
	}

	company := strings.TrimSpace(client.CompanyName)
	var roleParam any
	if company == "" {
		roleParam = nil
	} else {
		roleParam = company
	}

	query := `
		INSERT INTO testimonials (
			name, role, quote, initials, tone, rating, status,
			display_order, client_id, purchase_id, created_by_id
		)
		SELECT $1, $2, $3, $4, $5, $6, 'ACTIVE', $7, $8, $9, $10
		RETURNING
			id, name, role, quote, initials, tone, rating, status,
			display_order, client_id, purchase_id, created_by_id,
			created_at, updated_at
	`

	testimonial, err := scanTestimonial(s.DB.QueryRow(
		context.Background(),
		query,
		buyerName, roleParam, req.Quote, initials, "brand", req.Rating,
		6, client.ID, purchaseID, client.ID,
	))
	if err != nil {
		return nil, err
	}

	return testimonial, nil
}