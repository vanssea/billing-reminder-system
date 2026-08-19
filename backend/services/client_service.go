package services

import (
	"context"
	"fmt"
	"math"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ClientService struct {
	DB *pgxpool.Pool
}

func NewClientService(db *pgxpool.Pool) *ClientService {
	return &ClientService{DB: db}
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

type UpdateClientRequest struct {
	CompanyName string  `json:"company_name"`
	PICName     string  `json:"pic_name"`
	Email       string  `json:"email"`
	Phone       *string `json:"phone"`
	Address     *string `json:"address"`
	Status      string  `json:"status"`
}

func (s *ClientService) LogActivity(ctx context.Context, adminID, action, description string) {
	query := `INSERT INTO activity_logs (user_id, action, description, created_at) VALUES ($1, $2, $3, NOW())`
	_, _ = s.DB.Exec(ctx, query, adminID, action, description)
}

func (s *ClientService) GetClients(ctx context.Context, search, status string, page, limit int) (*models.PaginatedClientResponse, error) {
	if page < 1 {
		page = 1
	}
	if limit < 1 {
		limit = 10
	}
	offset := (page - 1) * limit

	countQuery := `SELECT COUNT(id) FROM clients WHERE 1=1`
	dataQuery := `SELECT id, profile_id, company_name, pic_name, email, phone, address, status, created_at, updated_at FROM clients WHERE 1=1`

	var args []interface{}
	argID := 1

	if search != "" {
		filter := fmt.Sprintf(" AND (company_name ILIKE $%d OR pic_name ILIKE $%d OR email ILIKE $%d)", argID, argID+1, argID+2)
		countQuery += filter
		dataQuery += filter
		searchTerm := "%" + search + "%"
		args = append(args, searchTerm, searchTerm, searchTerm)
		argID += 3
	}

	if status != "" && status != "ALL" {
		filter := fmt.Sprintf(" AND status = $%d", argID)
		countQuery += filter
		dataQuery += filter
		args = append(args, status)
		argID++
	}

	var total int
	if err := s.DB.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, err
	}

	dataQuery += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argID, argID+1)
	args = append(args, limit, offset)

	rows, err := s.DB.Query(ctx, dataQuery, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	clients := make([]models.Client, 0)
	for rows.Next() {
		var c models.Client
		if err := rows.Scan(&c.ID, &c.ProfileID, &c.CompanyName, &c.PICName, &c.Email, &c.Phone, &c.Address, &c.Status, &c.CreatedAt, &c.UpdatedAt); err != nil {
			return nil, err
		}
		clients = append(clients, c)
	}

	res := &models.PaginatedClientResponse{Data: clients}
	res.Pagination.Page = page
	res.Pagination.Limit = limit
	res.Pagination.Total = total
	res.Pagination.TotalPages = int(math.Ceil(float64(total) / float64(limit)))

	return res, nil
}

func (s *ClientService) CreateClient(ctx context.Context, adminID string, req CreateClientRequest) (*models.Client, error) {
	if req.Status == "" {
		req.Status = "ACTIVE"
	}
	query := `
		INSERT INTO clients (profile_id, company_name, pic_name, email, phone, address, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		RETURNING id, profile_id, company_name, pic_name, email, phone, address, status, created_at, updated_at
	`
	var c models.Client
	err := s.DB.QueryRow(ctx, query, req.ProfileID, req.CompanyName, req.PICName, req.Email, req.Phone, req.Address, req.Status).
		Scan(&c.ID, &c.ProfileID, &c.CompanyName, &c.PICName, &c.Email, &c.Phone, &c.Address, &c.Status, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	s.LogActivity(ctx, adminID, "CREATE CLIENT", "Menambahkan client: "+c.CompanyName)
	return &c, nil
}

func (s *ClientService) GetClientByID(ctx context.Context, id string) (*models.Client, error) {
	query := `SELECT id, profile_id, company_name, pic_name, email, phone, address, status, created_at, updated_at FROM clients WHERE id = $1`
	var c models.Client
	err := s.DB.QueryRow(ctx, query, id).Scan(&c.ID, &c.ProfileID, &c.CompanyName, &c.PICName, &c.Email, &c.Phone, &c.Address, &c.Status, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &c, nil
}

func (s *ClientService) UpdateClient(ctx context.Context, adminID, id string, req UpdateClientRequest) (*models.Client, error) {
	query := `
		UPDATE clients SET company_name = $1, pic_name = $2, email = $3, phone = $4, address = $5, status = $6, updated_at = NOW()
		WHERE id = $7
		RETURNING id, profile_id, company_name, pic_name, email, phone, address, status, created_at, updated_at
	`
	var c models.Client
	err := s.DB.QueryRow(ctx, query, req.CompanyName, req.PICName, req.Email, req.Phone, req.Address, req.Status, id).
		Scan(&c.ID, &c.ProfileID, &c.CompanyName, &c.PICName, &c.Email, &c.Phone, &c.Address, &c.Status, &c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return nil, err
	}
	s.LogActivity(ctx, adminID, "UPDATE CLIENT", "Memperbarui client: "+c.CompanyName)
	return &c, nil
}

func (s *ClientService) UpdateClientStatus(ctx context.Context, adminID, id, status string) error {
	query := `UPDATE clients SET status = $1, updated_at = NOW() WHERE id = $2`
	_, err := s.DB.Exec(ctx, query, status, id)
	if err != nil {
		return err
	}
	s.LogActivity(ctx, adminID, "UPDATE STATUS", fmt.Sprintf("Ubah status client %s ke %s", id, status))
	return nil
}

func (s *ClientService) DeleteClient(id string) error {
	query := `DELETE FROM clients WHERE id = $1`
	_, err := s.DB.Exec(context.Background(), query, id)
	return err
}