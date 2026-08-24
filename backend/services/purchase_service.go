package services

import (
	"context"
	"fmt"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PurchaseService struct {
	DB           *pgxpool.Pool
	ClientService *ClientService
	ProductService *ProductService
}

func NewPurchaseService(db *pgxpool.Pool, clientService *ClientService, productService *ProductService) *PurchaseService {
	return &PurchaseService{
		DB:            db,
		ClientService: clientService,
		ProductService: productService,
	}
}

func (s *PurchaseService) CreatePurchaseRequest(profileID string, req models.PurchaseRequest) (*models.PurchaseResponse, error) {
	client, err := s.ClientService.GetClientByProfileID(profileID)
	if err != nil {
		if err == pgx.ErrNoRows {
			// Profile already exists (created by trigger/backfill), just create client record
			client, err = s.ClientService.CreateOrUpdateClientByProfileID(profileID, UpdateClientRequest{
				CompanyName: "",
				PICName:     "",
				Email:       "",
				Phone:       nil,
				Address:     nil,
				Status:      "ACTIVE",
			})
			if err != nil {
				return nil, fmt.Errorf("gagal membuat client record: %w", err)
			}
		} else {
			return nil, err
		}
	}

	if !s.isProfileComplete(client) {
		return nil, fmt.Errorf("lengkapi data profil terlebih dahulu (Nama Perusahaan, PIC, Email, Telepon, Alamat)")
	}

	product, err := s.ProductService.GetProductByID(req.ProductID)
	if err != nil {
		return nil, err
	}
	if product == nil {
		return nil, fmt.Errorf("produk tidak ditemukan")
	}
	if product.Status != "ACTIVE" {
		return nil, fmt.Errorf("produk tidak tersedia")
	}

	var amount int64
	if req.BillingCycle == "yearly" && product.PriceYearly != nil {
		amount = int64(*product.PriceYearly)
	} else {
		amount = int64(product.Price)
	}

	query := `
		INSERT INTO purchase_requests (
			client_id, profile_id, product_id, product_name, billing_cycle, amount, status
		)
		VALUES ($1, $2, $3, $4, $5, $6, 'PENDING')
		RETURNING id, client_id, profile_id, product_id, product_name, billing_cycle, amount, status, admin_notes, created_at, updated_at
	`

	var purchaseReq models.PurchaseRequestModel
	err = s.DB.QueryRow(
		context.Background(),
		query,
		client.ID,
		client.ProfileID,
		product.ID,
		product.Name,
		req.BillingCycle,
		amount,
	).Scan(
		&purchaseReq.ID,
		&purchaseReq.ClientID,
		&purchaseReq.ProfileID,
		&purchaseReq.ProductID,
		&purchaseReq.ProductName,
		&purchaseReq.BillingCycle,
		&purchaseReq.Amount,
		&purchaseReq.Status,
		&purchaseReq.AdminNotes,
		&purchaseReq.CreatedAt,
		&purchaseReq.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &models.PurchaseResponse{
		Message:      "Permintaan pembelian berhasil dikirim. Admin akan memproses dan menghubungi Anda.",
		RequestID:    purchaseReq.ID,
		ProductName:  purchaseReq.ProductName,
		BillingCycle: purchaseReq.BillingCycle,
		Amount:       purchaseReq.Amount,
	}, nil
}

func (s *PurchaseService) isProfileComplete(client *models.Client) bool {
	if client.CompanyName == "" {
		return false
	}
	if client.PICName == "" {
		return false
	}
	if client.Email == "" {
		return false
	}
	if client.Phone == nil || *client.Phone == "" {
		return false
	}
	if client.Address == nil || *client.Address == "" {
		return false
	}
	return true
}

func (s *PurchaseService) GetPurchaseRequestsByClientID(clientID string) ([]models.PurchaseRequestModel, error) {
	query := `
		SELECT
			id, client_id, profile_id, product_id, product_name, billing_cycle, amount, status, admin_notes, created_at, updated_at
		FROM purchase_requests
		WHERE client_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.DB.Query(context.Background(), query, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.PurchaseRequestModel
	for rows.Next() {
		var req models.PurchaseRequestModel
		err := rows.Scan(
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
		)
		if err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, rows.Err()
}

// GetAllPurchaseRequests mengembalikan seluruh permintaan pembelian
// (untuk staff internal).
func (s *PurchaseService) GetAllPurchaseRequests() ([]models.PurchaseRequestModel, error) {
	query := `
		SELECT
			id, client_id, profile_id, product_id, product_name, billing_cycle, amount, status, admin_notes, created_at, updated_at
		FROM purchase_requests
		ORDER BY created_at DESC
	`

	rows, err := s.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var requests []models.PurchaseRequestModel
	for rows.Next() {
		var req models.PurchaseRequestModel
		err := rows.Scan(
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
		)
		if err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}
	return requests, rows.Err()
}

func (s *PurchaseService) GetPurchaseRequestByID(id string) (*models.PurchaseRequestModel, error) {
	query := `
		SELECT
			id, client_id, profile_id, product_id, product_name, billing_cycle, amount, status, admin_notes, created_at, updated_at
		FROM purchase_requests
		WHERE id = $1
	`

	var req models.PurchaseRequestModel
	err := s.DB.QueryRow(context.Background(), query, id).Scan(
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
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &req, nil
}


func (s *PurchaseService) UpdatePurchaseRequestStatus(id, status string, adminNotes *string) (*models.PurchaseRequestModel, error) {
	query := `
		UPDATE purchase_requests
		SET status = $1, admin_notes = $2, updated_at = now()
		WHERE id = $3
		RETURNING id, client_id, profile_id, product_id, product_name, billing_cycle, amount, status, admin_notes, created_at, updated_at
	`

	var req models.PurchaseRequestModel
	err := s.DB.QueryRow(context.Background(), query, status, adminNotes, id).Scan(
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
	)

	if err != nil {
		return nil, err
	}
	return &req, nil
}