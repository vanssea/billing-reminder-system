package models

import "time"

type DashboardStats struct {
	TotalInvoices   int `json:"total_invoices"`
	SentInvoices    int `json:"sent_invoices"`
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

// ==================== SUPER ADMIN DASHBOARD ====================

type SuperAdminStats struct {
	TotalClients      int     `json:"total_clients"`
	TotalAdmins       int     `json:"total_admins"`
	TotalInvoices     int     `json:"total_invoices"`
	PaidInvoices      int     `json:"paid_invoices"`
	UnpaidInvoices    int     `json:"unpaid_invoices"`
	OverdueInvoices   int     `json:"overdue_invoices"`
	CancelledInvoices int     `json:"cancelled_invoices"`
	TotalRevenue      float64 `json:"total_revenue"`
	PaidRevenue       float64 `json:"paid_revenue"`
	OutstandingAmount float64 `json:"outstanding_amount"`
	OverdueAmount     float64 `json:"overdue_amount"`
	PendingPayments   int     `json:"pending_payments"`
}

type ChartSeries struct {
	Key    string    `json:"key"`
	Labels []string  `json:"labels"`
	Values []float64 `json:"values"`
}

type InvoiceStatusCount struct {
	Status string `json:"status"`
	Count  int    `json:"count"`
}

type SuperAdminUpcomingInvoice struct {
	InvoiceNumber  string  `json:"invoice_number"`
	Client         string  `json:"client"`
	Plan           string  `json:"plan"`
	DueDate        string  `json:"due_date"`
	Amount         float64 `json:"amount"`
	Status         string  `json:"status"`
	Reminder       string  `json:"reminder"`
	ReminderStatus string  `json:"reminder_status"`
}

type OverdueInvoiceItem struct {
	InvoiceNumber string  `json:"invoice_number"`
	Client        string  `json:"client"`
	DueDate       string  `json:"due_date"`
	DaysOverdue   int     `json:"days_overdue"`
	Amount        float64 `json:"amount"`
}

type RecentPayment struct {
	ID            string  `json:"id"`
	Client        string  `json:"client"`
	InvoiceNumber string  `json:"invoice_number"`
	Amount        float64 `json:"amount"`
	Date          string  `json:"date"`
	Method        string  `json:"method"`
	Status        string  `json:"status"`
}

type PendingVerificationItem struct {
	ID            string  `json:"id"`
	Client        string  `json:"client"`
	InvoiceNumber string  `json:"invoice_number"`
	Amount        float64 `json:"amount"`
	Date          string  `json:"date"`
}

type RecentActivity struct {
	ID          string    `json:"id"`
	Action      string    `json:"action"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
}

type SuperAdminDashboard struct {
	Stats                SuperAdminStats             `json:"stats"`
	RemindersToday       RemindersToday              `json:"reminders_today"`
	RevenuePeriods       []ChartSeries               `json:"revenue_periods"`
	InvoiceStatus        []InvoiceStatusCount        `json:"invoice_status"`
	UpcomingInvoices     []SuperAdminUpcomingInvoice `json:"upcoming_invoices"`
	OverdueInvoices      []OverdueInvoiceItem        `json:"overdue_invoices"`
	RecentPayments       []RecentPayment             `json:"recent_payments"`
	PendingVerifications []PendingVerificationItem   `json:"pending_verifications"`
	RecentActivities     []RecentActivity            `json:"recent_activities"`
}