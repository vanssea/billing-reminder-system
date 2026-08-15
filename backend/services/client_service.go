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