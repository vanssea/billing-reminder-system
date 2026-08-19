package models

import "time"

type Product struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Description  *string   `json:"description"`
	Price        float64   `json:"price"`
	PriceYearly  *float64  `json:"price_yearly"`
	BillingType  string    `json:"billing_type"`
	Features     []string  `json:"features"`
	Popular      bool      `json:"popular"`
	CTA          *string   `json:"cta"`
	Status       string    `json:"status"`
	DisplayOrder int       `json:"display_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type CreateProductRequest struct {
	Name         string    `json:"name"`
	Description  *string   `json:"description"`
	Price        float64   `json:"price"`
	PriceYearly  *float64  `json:"price_yearly"`
	BillingType  string    `json:"billing_type"`
	Features     []string  `json:"features"`
	Popular      bool      `json:"popular"`
	CTA          *string   `json:"cta"`
	Status       string    `json:"status"`
	DisplayOrder int       `json:"display_order"`
}

type UpdateProductRequest struct {
	Name         string    `json:"name"`
	Description  *string   `json:"description"`
	Price        float64   `json:"price"`
	PriceYearly  *float64  `json:"price_yearly"`
	BillingType  string    `json:"billing_type"`
	Features     []string  `json:"features"`
	Popular      bool      `json:"popular"`
	CTA          *string   `json:"cta"`
	Status       string    `json:"status"`
	DisplayOrder int       `json:"display_order"`
}