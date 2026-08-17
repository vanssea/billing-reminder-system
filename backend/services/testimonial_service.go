package services

import (
	"context"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TestimonialService struct {
	DB *pgxpool.Pool
}

func NewTestimonialService(db *pgxpool.Pool) *TestimonialService {
	return &TestimonialService{
		DB: db,
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
		&testimonial.CreatedAt,
		&testimonial.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &testimonial, nil
}

func (s *TestimonialService) GetTestimonials() ([]models.Testimonial, error) {
	query := `
		SELECT
			id,
			name,
			role,
			quote,
			initials,
			tone,
			rating,
			status,
			display_order,
			created_at,
			updated_at
		FROM testimonials
		ORDER BY display_order ASC
	`

	rows, err := s.DB.Query(context.Background(), query)
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
			id,
			name,
			role,
			quote,
			initials,
			tone,
			rating,
			status,
			display_order,
			created_at,
			updated_at
		FROM testimonials
		WHERE id = $1
	`

	return scanTestimonial(s.DB.QueryRow(context.Background(), query, id))
}

func (s *TestimonialService) CreateTestimonial(req models.CreateTestimonialRequest) (*models.Testimonial, error) {
	query := `
		INSERT INTO testimonials (
			name,
			role,
			quote,
			initials,
			tone,
			rating,
			status,
			display_order
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
		RETURNING
			id,
			name,
			role,
			quote,
			initials,
			tone,
			rating,
			status,
			display_order,
			created_at,
			updated_at
	`

	return scanTestimonial(s.DB.QueryRow(
		context.Background(),
		query,
		req.Name,
		req.Role,
		req.Quote,
		req.Initials,
		req.Tone,
		req.Rating,
		req.Status,
		req.DisplayOrder,
	))
}

func (s *TestimonialService) UpdateTestimonial(id string, req models.UpdateTestimonialRequest) (*models.Testimonial, error) {
	query := `
		UPDATE testimonials
		SET
			name = $1,
			role = $2,
			quote = $3,
			initials = $4,
			tone = $5,
			rating = $6,
			status = $7,
			display_order = $8,
			updated_at = now()
		WHERE id = $9
		RETURNING
			id,
			name,
			role,
			quote,
			initials,
			tone,
			rating,
			status,
			display_order,
			created_at,
			updated_at
	`

	return scanTestimonial(s.DB.QueryRow(
		context.Background(),
		query,
		req.Name,
		req.Role,
		req.Quote,
		req.Initials,
		req.Tone,
		req.Rating,
		req.Status,
		req.DisplayOrder,
		id,
	))
}

func (s *TestimonialService) DeleteTestimonial(id string) error {
	query := `
		DELETE FROM testimonials
		WHERE id = $1
	`

	_, err := s.DB.Exec(context.Background(), query, id)

	return err
}