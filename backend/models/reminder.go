package models

import "time"

type Reminder struct {
	ID            string     `json:"id"`
	InvoiceID     string     `json:"invoice_id"`
	InvoiceNumber string     `json:"invoice_number,omitempty"`
	ClientName    string     `json:"client_name,omitempty"`
	DueDate       time.Time  `json:"due_date"`
	ReminderType  string     `json:"reminder_type"`
	ScheduledAt   *time.Time `json:"scheduled_at,omitempty"`
	SentAt        *time.Time `json:"sent_at,omitempty"`
	Status        string     `json:"status"`
	ErrorMessage  *string    `json:"error_message,omitempty"`
	CreatedAt     time.Time  `json:"created_at"`
}