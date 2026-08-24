package models

import "time"

type Payment struct {
	ID                  string     `json:"id"`
	PaymentID           string     `json:"payment_id"`           // Compatibility
	InvoiceID           string     `json:"invoice_id"`
	Amount              float64    `json:"amount"`
	PaymentDate         time.Time  `json:"payment_date"`
	PaymentMethod       string     `json:"payment_method"`
	ProofURL            string     `json:"proof_url"`
	Status              string     `json:"status"`
	VerificationStatus  string     `json:"verification_status"`  // Compatibility
	VerifiedBy          *string    `json:"verified_by,omitempty"`
	VerifiedAt          *time.Time `json:"verified_at,omitempty"`
	Notes               string     `json:"notes"`
	RejectionReason     string     `json:"rejection_reason"`     // Compatibility
	CreatedAt           time.Time  `json:"created_at"`
	UpdatedAt           time.Time  `json:"updated_at"`
}

type CreatePaymentRequest struct {
	InvoiceID     string  `json:"invoice_id"`
	Amount        float64 `json:"amount"`
	PaymentDate   string  `json:"payment_date"`
	PaymentMethod string  `json:"payment_method"`
	ProofURL      string  `json:"proof_url"`
}

type UpdatePaymentRequest struct {
	Amount             *float64 `json:"amount,omitempty"`
	PaymentDate        *string  `json:"payment_date,omitempty"`
	PaymentMethod      *string  `json:"payment_method,omitempty"`
	ProofURL           *string  `json:"proof_url,omitempty"`
	Status             *string  `json:"status,omitempty"`
	VerificationStatus *string  `json:"verification_status,omitempty"`  // Compatibility
	VerifiedBy         *string  `json:"verified_by,omitempty"`
	VerifiedAt         *string  `json:"verified_at,omitempty"`
	Notes              *string  `json:"notes,omitempty"`
	RejectionReason    *string  `json:"rejection_reason,omitempty"`     // Compatibility
}
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
