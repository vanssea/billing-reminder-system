package models

import "time"

type Invoice struct {
	ID             string     `json:"id"`
	InvoiceNumber  string     `json:"invoice_number"`
	ClientID       string     `json:"client_id"`
	InvoiceDate    time.Time  `json:"invoice_date"`
	DueDate        time.Time  `json:"due_date"`
	Status         string     `json:"status"`
	Subtotal       float64    `json:"subtotal"`
	Tax            float64    `json:"tax"`
	Discount       float64    `json:"discount"`
	Total          float64    `json:"total"`
	Notes          string     `json:"notes"`
	Product        string     `json:"product"`         // Compatibility: map from notes
	CreatedBy      string     `json:"created_by"`
	SentAt         *time.Time `json:"sent_at,omitempty"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

type InvoiceTimelineStep struct {
	Label string     `json:"label"`
	Date  *time.Time `json:"date,omitempty"`
	Done  bool       `json:"done"`
}

type CreateInvoiceRequest struct {
	ClientID     string  `json:"client_id"`
	InvoiceDate  string  `json:"invoice_date"`
	DueDate      string  `json:"due_date"`
	Status       string  `json:"status"`
	Subtotal     float64 `json:"subtotal"`
	Tax          float64 `json:"tax"`
	Discount     float64 `json:"discount"`
	Total        float64 `json:"total"`
	Notes        string  `json:"notes"`
	CreatedBy    string  `json:"created_by"`
	SentAt       *string `json:"sent_at,omitempty"`
}

type UpdateInvoiceRequest struct {
	InvoiceDate *string  `json:"invoice_date,omitempty"`
	DueDate     *string  `json:"due_date,omitempty"`
	Status      *string  `json:"status,omitempty"`
	Subtotal    *float64 `json:"subtotal,omitempty"`
	Tax         *float64 `json:"tax,omitempty"`
	Discount    *float64 `json:"discount,omitempty"`
	Total       *float64 `json:"total,omitempty"`
	Notes       *string  `json:"notes,omitempty"`
	SentAt      *string  `json:"sent_at,omitempty"`
}