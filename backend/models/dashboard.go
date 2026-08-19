package models

type DashboardStats struct {
	TotalInvoices   int `json:"total_invoices"`
	PaidInvoices    int `json:"paid_invoices"`
	UnpaidInvoices  int `json:"unpaid_invoices"`
	OverdueInvoices int `json:"overdue_invoices"`
	PendingPayments int `json:"pending_payments"`
}

type UpcomingInvoice struct {
	ID      string  `json:"id"`       // Mengambil dari invoice_number
	Client  string  `json:"client"`   // Mengambil dari company_name di tabel clients
	DueDate string  `json:"due_date"` // Format tanggal
	Amount  float64 `json:"amount"`   // Total tagihan
	Status  string  `json:"status"`
}

type PendingVerification struct {
	Client string  `json:"client"`
	Amount float64 `json:"amount"`
}

type RemindersToday struct {
	Scheduled int `json:"scheduled"`
	Sent      int `json:"sent"`
	Failed    int `json:"failed"`
}

type DashboardSummary struct {
	Stats                DashboardStats        `json:"stats"`
	UpcomingInvoices     []UpcomingInvoice     `json:"upcoming_invoices"`
	PendingVerifications []PendingVerification `json:"pending_verifications"`
	RemindersToday       RemindersToday        `json:"reminders_today"`
}