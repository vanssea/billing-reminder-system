package services

import (
	"context"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type FAQService struct {
	DB *pgxpool.Pool
}

func NewFAQService(db *pgxpool.Pool) *FAQService {
	return &FAQService{
		DB: db,
	}
}

func scanFAQ(row pgx.Row) (*models.FAQ, error) {
	var faq models.FAQ

	err := row.Scan(
		&faq.ID,
		&faq.Question,
		&faq.Answer,
		&faq.Status,
		&faq.DisplayOrder,
		&faq.CreatedAt,
		&faq.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	return &faq, nil
}

func (s *FAQService) GetFAQs() ([]models.FAQ, error) {
	query := `
		SELECT
			id,
			question,
			answer,
			status,
			display_order,
			created_at,
			updated_at
		FROM faqs
		ORDER BY display_order ASC
	`

	rows, err := s.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var faqs []models.FAQ

	for rows.Next() {
		faq, err := scanFAQ(rows)
		if err != nil {
			return nil, err
		}

		faqs = append(faqs, *faq)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return faqs, nil
}

func (s *FAQService) GetFAQByID(id string) (*models.FAQ, error) {
	query := `
		SELECT
			id,
			question,
			answer,
			status,
			display_order,
			created_at,
			updated_at
		FROM faqs
		WHERE id = $1
	`

	return scanFAQ(s.DB.QueryRow(context.Background(), query, id))
}

func (s *FAQService) CreateFAQ(req models.CreateFAQRequest) (*models.FAQ, error) {
	query := `
		INSERT INTO faqs (
			question,
			answer,
			status,
			display_order
		)
		VALUES ($1, $2, $3, $4)
		RETURNING
			id,
			question,
			answer,
			status,
			display_order,
			created_at,
			updated_at
	`

	return scanFAQ(s.DB.QueryRow(
		context.Background(),
		query,
		req.Question,
		req.Answer,
		req.Status,
		req.DisplayOrder,
	))
}

func (s *FAQService) UpdateFAQ(id string, req models.UpdateFAQRequest) (*models.FAQ, error) {
	query := `
		UPDATE faqs
		SET
			question = $1,
			answer = $2,
			status = $3,
			display_order = $4,
			updated_at = now()
		WHERE id = $5
		RETURNING
			id,
			question,
			answer,
			status,
			display_order,
			created_at,
			updated_at
	`

	return scanFAQ(s.DB.QueryRow(
		context.Background(),
		query,
		req.Question,
		req.Answer,
		req.Status,
		req.DisplayOrder,
		id,
	))
}

func (s *FAQService) DeleteFAQ(id string) error {
	query := `
		DELETE FROM faqs
		WHERE id = $1
	`

	_, err := s.DB.Exec(context.Background(), query, id)

	return err
}