package services

import (
	"context"
	"encoding/json"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ProductService struct {
	DB *pgxpool.Pool
}

func NewProductService(db *pgxpool.Pool) *ProductService {
	return &ProductService{
		DB: db,
	}
}

func scanProduct(row pgx.Row) (*models.Product, error) {
	var product models.Product
	var featuresJSON []byte

	err := row.Scan(
		&product.ID,
		&product.Name,
		&product.Description,
		&product.Price,
		&product.PriceYearly,
		&product.BillingType,
		&featuresJSON,
		&product.Popular,
		&product.CTA,
		&product.Status,
		&product.DisplayOrder,
		&product.CreatedAt,
		&product.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	if len(featuresJSON) > 0 {
		if err := json.Unmarshal(featuresJSON, &product.Features); err != nil {
			return nil, err
		}
	}

	return &product, nil
}

func (s *ProductService) GetProducts() ([]models.Product, error) {
	query := `
		SELECT
			id,
			name,
			description,
			price,
			price_yearly,
			billing_type,
			features,
			popular,
			cta,
			status,
			display_order,
			created_at,
			updated_at
		FROM products
		ORDER BY display_order ASC
	`

	rows, err := s.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var products []models.Product

	for rows.Next() {
		product, err := scanProduct(rows)
		if err != nil {
			return nil, err
		}

		products = append(products, *product)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return products, nil
}

func (s *ProductService) GetProductByID(id string) (*models.Product, error) {
	query := `
		SELECT
			id,
			name,
			description,
			price,
			price_yearly,
			billing_type,
			features,
			popular,
			cta,
			status,
			display_order,
			created_at,
			updated_at
		FROM products
		WHERE id = $1
	`

	return scanProduct(s.DB.QueryRow(context.Background(), query, id))
}

func (s *ProductService) CreateProduct(req models.CreateProductRequest) (*models.Product, error) {
	featuresJSON, err := json.Marshal(req.Features)
	if err != nil {
		return nil, err
	}

	query := `
		INSERT INTO products (
			name,
			description,
			price,
			price_yearly,
			billing_type,
			features,
			popular,
			cta,
			status,
			display_order
		)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING
			id,
			name,
			description,
			price,
			price_yearly,
			billing_type,
			features,
			popular,
			cta,
			status,
			display_order,
			created_at,
			updated_at
	`

	return scanProduct(s.DB.QueryRow(
		context.Background(),
		query,
		req.Name,
		req.Description,
		req.Price,
		req.PriceYearly,
		req.BillingType,
		featuresJSON,
		req.Popular,
		req.CTA,
		req.Status,
		req.DisplayOrder,
	))
}

func (s *ProductService) UpdateProduct(id string, req models.UpdateProductRequest) (*models.Product, error) {
	featuresJSON, err := json.Marshal(req.Features)
	if err != nil {
		return nil, err
	}

	query := `
		UPDATE products
		SET
			name = $1,
			description = $2,
			price = $3,
			price_yearly = $4,
			billing_type = $5,
			features = $6,
			popular = $7,
			cta = $8,
			status = $9,
			display_order = $10,
			updated_at = now()
		WHERE id = $11
		RETURNING
			id,
			name,
			description,
			price,
			price_yearly,
			billing_type,
			features,
			popular,
			cta,
			status,
			display_order,
			created_at,
			updated_at
	`

	return scanProduct(s.DB.QueryRow(
		context.Background(),
		query,
		req.Name,
		req.Description,
		req.Price,
		req.PriceYearly,
		req.BillingType,
		featuresJSON,
		req.Popular,
		req.CTA,
		req.Status,
		req.DisplayOrder,
		id,
	))
}

func (s *ProductService) DeleteProduct(id string) error {
	query := `
		DELETE FROM products
		WHERE id = $1
	`

	_, err := s.DB.Exec(context.Background(), query, id)

	return err
}