package models

import "time"

// PaymentDetail adalah payment yang sudah diperkaya dengan data
// invoice dan client untuk kebutuhan tampilan list di panel admin.
type PaymentDetail struct {
	ID            string     `json:"id"`
	InvoiceID     string     `json:"invoice_id"`
	InvoiceNumber string     `json:"invoice_number"`
	ClientName    string     `json:"client_name"`
	Amount        float64    `json:"amount"`
	PaymentDate   *time.Time `json:"payment_date,omitempty"`
	PaymentMethod *string    `json:"payment_method,omitempty"`
	ProofURL      *string    `json:"proof_url,omitempty"`
	Status        string     `json:"status"`
	VerifiedBy    *string    `json:"verified_by,omitempty"`
	VerifiedAt    *time.Time `json:"verified_at,omitempty"`
	Notes         *string    `json:"notes,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

type ApprovePaymentRequest struct {
	VerifiedBy *string `json:"verified_by,omitempty"`
}

type RejectPaymentRequest struct {
	VerifiedBy *string `json:"verified_by,omitempty"`
	Notes      *string `json:"notes,omitempty"`
}
