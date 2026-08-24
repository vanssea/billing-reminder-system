package models

import "time"

type PurchaseRequest struct {
	ProductID    string `json:"product_id"`
	BillingCycle string `json:"billing_cycle"`
}

type PurchaseResponse struct {
	Message     string `json:"message"`
	RequestID   string `json:"request_id"`
	ProductName string `json:"product_name"`
	BillingCycle string `json:"billing_cycle"`
	Amount      int64  `json:"amount"`
}

type PurchaseRequestModel struct {
	ID             string     `json:"id"`
	ClientID       string     `json:"client_id"`
	ProfileID      string     `json:"profile_id"`
	ProductID      string     `json:"product_id"`
	ProductName    string     `json:"product_name"`
	BillingCycle   string     `json:"billing_cycle"`
	Amount         int64      `json:"amount"`
	Status         string     `json:"status"`
	AdminNotes     *string    `json:"admin_notes"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}