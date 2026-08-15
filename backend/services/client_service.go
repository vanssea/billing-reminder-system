package services

import (
	"context"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
)

type ClientService struct {
	DB *pgx.Conn
}

func NewClientService(db *pgx.Conn) *ClientService {
	return &ClientService{
		DB: db,
	}
}

type CreateClientRequest struct {
	ProfileID   *string `json:"profile_id"`
	CompanyName string  `json:"company_name"`
	PICName     string  `json:"pic_name"`
	Email       string  `json:"email"`
	Phone       *string `json:"phone"`
	Address     *string `json:"address"`
	Status      string  `json:"status"`
}

func (s *ClientService) GetClients() ([]models.Client, error) {
	query := `
		SELECT
			id,
			profile_id,
			company_name,
			pic_name,
			email,
			phone,
			address,
			status,
			created_at,
			updated_at
		FROM clients
		ORDER BY created_at DESC
	`

	rows, err := s.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var clients []models.Client

	for rows.Next() {
		var client models.Client

		err := rows.Scan(
			&client.ID,
			&client.ProfileID,
			&client.CompanyName,
			&client.PICName,
			&client.Email,
			&client.Phone,
			&client.Address,
			&client.Status,
			&client.CreatedAt,
			&client.UpdatedAt,
		)

		if err != nil {
			return nil, err
		}

		clients = append(clients, client)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return clients, nil
}

func (s *ClientService) CreateClient(req CreateClientRequest) (*models.Client, error) {
	query := `
		INSERT INTO clients (
			profile_id,
			company_name,
			pic_name,
			email,
			phone,
			address,
			status
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING
			id,
			profile_id,
			company_name,
			pic_name,
			email,
			phone,
			address,
			status,
			created_at,
			updated_at
	`

	var client models.Client

	err := s.DB.QueryRow(
		context.Background(),
		query,
		req.ProfileID,
		req.CompanyName,
		req.PICName,
		req.Email,
		req.Phone,
		req.Address,
		req.Status,
	).Scan(
		&client.ID,
		&client.ProfileID,
		&client.CompanyName,
		&client.PICName,
		&client.Email,
		&client.Phone,
		&client.Address,
		&client.Status,
		&client.CreatedAt,
		&client.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &client, nil
}
func (s *ClientService) GetClientByID(id string) (*models.Client, error) {
	query := `
		SELECT
			id,
			profile_id,
			company_name,
			pic_name,
			email,
			phone,
			address,
			status,
			created_at,
			updated_at
		FROM clients
		WHERE id = $1
	`

	var client models.Client

	err := s.DB.QueryRow(
		context.Background(),
		query,
		id,
	).Scan(
		&client.ID,
		&client.ProfileID,
		&client.CompanyName,
		&client.PICName,
		&client.Email,
		&client.Phone,
		&client.Address,
		&client.Status,
		&client.CreatedAt,
		&client.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &client, nil
}
type UpdateClientRequest struct {
	CompanyName string  `json:"company_name"`
	PICName     string  `json:"pic_name"`
	Email       string  `json:"email"`
	Phone       *string `json:"phone"`
	Address     *string `json:"address"`
	Status      string  `json:"status"`
}

func (s *ClientService) UpdateClient(id string, req UpdateClientRequest) (*models.Client, error) {
	query := `
		UPDATE clients
		SET
			company_name = $1,
			pic_name = $2,
			email = $3,
			phone = $4,
			address = $5,
			status = $6,
			updated_at = now()
		WHERE id = $7
		RETURNING
			id,
			profile_id,
			company_name,
			pic_name,
			email,
			phone,
			address,
			status,
			created_at,
			updated_at
	`

	var client models.Client

	err := s.DB.QueryRow(
		context.Background(),
		query,
		req.CompanyName,
		req.PICName,
		req.Email,
		req.Phone,
		req.Address,
		req.Status,
		id,
	).Scan(
		&client.ID,
		&client.ProfileID,
		&client.CompanyName,
		&client.PICName,
		&client.Email,
		&client.Phone,
		&client.Address,
		&client.Status,
		&client.CreatedAt,
		&client.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &client, nil
}
func (s *ClientService) DeleteClient(id string) error {
	query := `
		DELETE FROM clients
		WHERE id = $1
	`

	_, err := s.DB.Exec(
		context.Background(),
		query,
		id,
	)

	return err
}