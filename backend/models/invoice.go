package models

import "time"

type InvoiceItem struct {
	ID          string  `json:"id"`
	InvoiceID   string  `json:"invoice_id"`
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
	Subtotal    float64 `json:"subtotal"`
}

type Payment struct {
	ID            string     `json:"id"`
	InvoiceID     string     `json:"invoice_id"`
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

type Reminder struct {
	ID           string     `json:"id"`
	InvoiceID    string     `json:"invoice_id"`
	ReminderType string     `json:"reminder_type"`
	ScheduledAt  *time.Time `json:"scheduled_at,omitempty"`
	SentAt       *time.Time `json:"sent_at,omitempty"`
	Status       string     `json:"status"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

type ActivityLog struct {
	ID          string     `json:"id"`
	InvoiceID   string     `json:"invoice_id"`
	ActorType   string     `json:"actor_type"`
	Action      string     `json:"action"`
	Description string     `json:"description"`
	CreatedAt   time.Time  `json:"created_at"`
}

type Invoice struct {
	ID            string        `json:"id"`
	InvoiceNumber string        `json:"invoice_number"`
	ClientID      string        `json:"client_id"`
	InvoiceDate   time.Time     `json:"invoice_date"`
	DueDate       time.Time     `json:"due_date"`
	Subtotal      float64       `json:"subtotal"`
	Tax           float64       `json:"tax"`
	Total         float64       `json:"total"`
	Status        string        `json:"status"`
	Notes         *string       `json:"notes,omitempty"`
	CreatedBy     *string       `json:"created_by,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	Items         []InvoiceItem `json:"items"`
	Payments      []Payment     `json:"payments"`
	Reminders     []Reminder    `json:"reminders"`
	ActivityLogs  []ActivityLog `json:"activity_logs"`
}

type InvoiceItemRequest struct {
	ProductID string `json:"product_id"`
	Quantity  int    `json:"quantity"`
}

type CreateInvoiceRequest struct {
	InvoiceNumber string               `json:"invoice_number"`
	ClientID      string               `json:"client_id"`
	InvoiceDate   string               `json:"invoice_date"`
	DueDate       string               `json:"due_date"`
	Status        string               `json:"status"`
	Notes         *string              `json:"notes,omitempty"`
	CreatedBy     *string              `json:"created_by,omitempty"`
	Items         []InvoiceItemRequest `json:"items"`
}

type UpdateInvoiceRequest struct {
	InvoiceNumber string               `json:"invoice_number"`
	ClientID      string               `json:"client_id"`
	InvoiceDate   string               `json:"invoice_date"`
	DueDate       string               `json:"due_date"`
	Status        string               `json:"status"`
	Notes         *string              `json:"notes,omitempty"`
	Items         []InvoiceItemRequest `json:"items"`
}
