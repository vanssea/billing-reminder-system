package models

import "time"

type Invoice struct {
	ID            string        `json:"id"`
	InvoiceNumber string        `json:"invoice_number"`
	ClientID      string        `json:"client_id"`
	InvoiceDate   time.Time     `json:"invoice_date"`
	DueDate       time.Time     `json:"due_date"`
	SentAt        *time.Time    `json:"sent_at,omitempty"`
	Subtotal      float64       `json:"subtotal"`
	Tax           float64       `json:"tax"`
	Total         float64       `json:"total"`
	Status        string        `json:"status"`
	Notes         *string       `json:"notes,omitempty"`
	CreatedBy     *string       `json:"created_by,omitempty"`
	CreatedAt     time.Time     `json:"created_at"`
	UpdatedAt     time.Time     `json:"updated_at"`
	Client        *Client       `json:"client,omitempty"`
	Items         []InvoiceItem `json:"items"`
	Payments      []Payment     `json:"payments"`
	Reminders     []Reminder    `json:"reminders"`
	ActivityLogs  []ActivityLog `json:"activity_logs"`
}

type InvoiceTimelineStep struct {
	Label string     `json:"label"`
	Date  *time.Time `json:"date,omitempty"`
	Done  bool       `json:"done"`
}

type InvoiceItem struct {
	ID          string  `json:"id"`
	InvoiceID   string  `json:"invoice_id"`
	ProductID   string  `json:"product_id"`
	ProductName string  `json:"product_name"`
	Quantity    int     `json:"quantity"`
	Price       float64 `json:"price"`
	Subtotal    float64 `json:"subtotal"`
}

type ActivityLog struct {
	ID          string    `json:"id"`
	InvoiceID   string    `json:"invoice_id"`
	ActorType   string    `json:"actor_type"`
	Action      string    `json:"action"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
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
