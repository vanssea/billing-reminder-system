package services

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

type AdminService struct {
	DB *pgxpool.Pool
}

func NewAdminService(db *pgxpool.Pool) *AdminService {
	return &AdminService{
		DB: db,
	}
}

func (s *AdminService) GetAdmins() ([]models.Admin, error) {
	query := `
		SELECT
			p.id,
			p.full_name,
			u.email,
			p.phone,
			p.role,
			p.created_at,
			p.updated_at
		FROM profiles p
		JOIN auth.users u ON u.id = p.id
		WHERE p.role = 'ADMIN'
		ORDER BY p.created_at DESC
	`

	rows, err := s.DB.Query(context.Background(), query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var admins []models.Admin

	for rows.Next() {
		var admin models.Admin

		err := rows.Scan(
			&admin.ID,
			&admin.FullName,
			&admin.Email,
			&admin.Phone,
			&admin.Role,
			&admin.CreatedAt,
			&admin.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		admins = append(admins, admin)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return admins, nil
}
func (s *AdminService) CreateAdmin(req models.CreateAdminRequest) (*models.Admin, error) {
	supabaseURL := os.Getenv("SUPABASE_URL")
	serviceRoleKey := os.Getenv("SUPABASE_SERVICE_KEY")

	if supabaseURL == "" || serviceRoleKey == "" {
		return nil, fmt.Errorf("SUPABASE_URL atau SUPABASE_SERVICE_KEY belum diset")
	}

	// Request ke Supabase Auth Admin API
	payload := map[string]interface{}{
		"email":         req.Email,
		"password":      req.Password,
		"email_confirm": true,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return nil, err
	}

	authURL := supabaseURL + "/auth/v1/admin/users"

	httpReq, err := http.NewRequest(
		"POST",
		authURL,
		bytes.NewBuffer(body),
	)
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("apikey", serviceRoleKey)
	httpReq.Header.Set("Authorization", "Bearer "+serviceRoleKey)

	client := &http.Client{}

	resp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		var errorResponse map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&errorResponse)

		msg, _ := errorResponse["msg"].(string)
		if strings.Contains(strings.ToLower(msg), "already been registered") {
			return nil, fmt.Errorf("email sudah terdaftar")
		}

		return nil, fmt.Errorf("gagal membuat user auth: %v", errorResponse)
	}

	var authUser struct {
		ID string `json:"id"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&authUser); err != nil {
		return nil, err
	}

	// Profil sudah dibuat otomatis oleh trigger handle_new_user di Supabase
	// saat user auth dibuat (pola yang sama dipakai AuthService.Register).
	// Cukup promosikan profil tersebut menjadi ADMIN.
	query := `
		UPDATE profiles SET
			full_name = $2,
			phone = $3,
			role = 'ADMIN',
			updated_at = NOW()
		WHERE id = $1
		RETURNING
			id,
			full_name,
			phone,
			role,
			created_at,
			updated_at
	`

	var admin models.Admin

	err = s.DB.QueryRow(
		context.Background(),
		query,
		authUser.ID,
		req.FullName,
		req.Phone,
	).Scan(
		&admin.ID,
		&admin.FullName,
		&admin.Phone,
		&admin.Role,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	admin.Email = req.Email

	return &admin, nil
}
func (s *AdminService) GetAdminByID(id string) (*models.Admin, error) {
	query := `
		SELECT
			p.id,
			p.full_name,
			u.email,
			p.phone,
			p.role,
			p.created_at,
			p.updated_at
		FROM profiles p
		JOIN auth.users u ON u.id = p.id
		WHERE p.id = $1
		  AND p.role = 'ADMIN'
	`

	var admin models.Admin

	err := s.DB.QueryRow(
		context.Background(),
		query,
		id,
	).Scan(
		&admin.ID,
		&admin.FullName,
		&admin.Email,
		&admin.Phone,
		&admin.Role,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &admin, nil
}
func (s *AdminService) UpdateAdmin(id string, req models.UpdateAdminRequest) (*models.Admin, error) {
	if req.Role != "ADMIN" {
		return nil, fmt.Errorf("role admin tidak valid")
	}

	query := `
		UPDATE profiles
		SET
			full_name = $1,
			role = $2,
			phone = $3,
			updated_at = NOW()
		WHERE id = $4
		  AND role = 'ADMIN'
		RETURNING
			id,
			full_name,
			phone,
			role,
			created_at,
			updated_at
	`

	var admin models.Admin

	err := s.DB.QueryRow(
		context.Background(),
		query,
		req.FullName,
		req.Role,
		req.Phone,
		id,
	).Scan(
		&admin.ID,
		&admin.FullName,
		&admin.Phone,
		&admin.Role,
		&admin.CreatedAt,
		&admin.UpdatedAt,
	)

	if err != nil {
		return nil, err
	}

	// Ambil email dari auth.users
	err = s.DB.QueryRow(
		context.Background(),
		`SELECT email FROM auth.users WHERE id = $1`,
		id,
	).Scan(&admin.Email)

	if err != nil {
		return nil, err
	}

	return &admin, nil
}
func (s *AdminService) DeleteAdmin(id string) error {
	supabaseURL := os.Getenv("SUPABASE_URL")
	secretKey := os.Getenv("SUPABASE_SERVICE_KEY")

	if supabaseURL == "" || secretKey == "" {
		return fmt.Errorf("SUPABASE_URL atau SUPABASE_SERVICE_KEY belum diset")
	}

	_, err := s.DB.Exec(
		context.Background(),
		`DELETE FROM profiles WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("gagal menghapus profile: %w", err)
	}

	url := fmt.Sprintf("%s/auth/v1/admin/users/%s", supabaseURL, id)
	req, err := http.NewRequest(http.MethodDelete, url, nil)
	if err != nil {
		return err
	}

	req.Header.Set("apikey", secretKey)
	req.Header.Set("Authorization", "Bearer "+secretKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("gagal menghapus user dari Supabase Auth: status %d: %s", resp.StatusCode, string(body))
	}

	return nil
}

func (s *AdminService) GetDashboardSummary() (*models.DashboardSummary, error) {
	summary := &models.DashboardSummary{
		UpcomingInvoices:     []models.UpcomingInvoice{},
		PendingVerifications: []models.PendingVerification{},
	}

	ctx := context.Background()

	// 1. Ambil Statistik Angka (Stats)
	statsQuery := `
		SELECT
			COUNT(id) as total_invoices,
			COUNT(id) FILTER (WHERE status = 'SENT') as sent_invoices,
			COUNT(id) FILTER (WHERE status = 'PAID') as paid_invoices,
			COUNT(id) FILTER (WHERE status = 'UNPAID') as unpaid_invoices,
			COUNT(id) FILTER (WHERE status = 'OVERDUE') as overdue_invoices,
			(SELECT COUNT(id) FROM payments WHERE status = 'PENDING') as pending_payments,
			(SELECT COUNT(id) FROM purchase_requests WHERE status = 'PENDING') as pending_purchases
		FROM invoices
	`
	err := s.DB.QueryRow(ctx, statsQuery).Scan(
		&summary.Stats.TotalInvoices,
		&summary.Stats.SentInvoices,
		&summary.Stats.PaidInvoices,
		&summary.Stats.UnpaidInvoices,
		&summary.Stats.OverdueInvoices,
		&summary.Stats.PendingPayments,
		&summary.Stats.PendingPurchases,
	)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil stats: %w", err)
	}

	// 2. Ambil Upcoming Invoices (5 Terdekat yang belum lunas)
	upcomingQuery := `
		SELECT
			i.invoice_number,
			c.company_name,
			TO_CHAR(i.due_date, 'DD Mon YYYY') as due_date,
			i.total,
			i.status
		FROM invoices i
		JOIN clients c ON i.client_id = c.id
		WHERE i.status IN ('UNPAID', 'SENT', 'OVERDUE')
		ORDER BY i.due_date ASC
		LIMIT 5
	`
	rows, err := s.DB.Query(ctx, upcomingQuery)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil upcoming invoices: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var inv models.UpcomingInvoice
		if err := rows.Scan(&inv.ID, &inv.Client, &inv.DueDate, &inv.Amount, &inv.Status); err != nil {
			return nil, err
		}
		summary.UpcomingInvoices = append(summary.UpcomingInvoices, inv)
	}

	// 3. Ambil Pending Verifications (5 Pembayaran terbaru yang menunggu verifikasi)
	pendingQuery := `
		SELECT
			c.company_name,
			p.amount
		FROM payments p
		JOIN invoices i ON p.invoice_id = i.id
		JOIN clients c ON i.client_id = c.id
		WHERE p.status = 'PENDING'
		ORDER BY p.created_at DESC
		LIMIT 5
	`
	pRows, err := s.DB.Query(ctx, pendingQuery)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil pending verifications: %w", err)
	}
	defer pRows.Close()

	for pRows.Next() {
		var pv models.PendingVerification
		if err := pRows.Scan(&pv.Client, &pv.Amount); err != nil {
			return nil, err
		}
		summary.PendingVerifications = append(summary.PendingVerifications, pv)
	}

	// 4. Ambil Status Reminder Hari Ini (Menggunakan Timezone Asia/Jakarta)
	reminderQuery := `
		SELECT
			COUNT(id) FILTER (WHERE status = 'PENDING') as scheduled,
			COUNT(id) FILTER (WHERE status = 'SENT') as sent,
			COUNT(id) FILTER (WHERE status = 'FAILED') as failed
		FROM reminders
		WHERE DATE(scheduled_at AT TIME ZONE 'Asia/Jakarta') = (NOW() AT TIME ZONE 'Asia/Jakarta')::date
	`
	err = s.DB.QueryRow(ctx, reminderQuery).Scan(
		&summary.RemindersToday.Scheduled,
		&summary.RemindersToday.Sent,
		&summary.RemindersToday.Failed,
	)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil reminders: %w", err)
	}

	return summary, nil
}

func (s *AdminService) GetSuperAdminDashboard() (*models.SuperAdminDashboard, error) {
	dashboard := &models.SuperAdminDashboard{
		RevenuePeriods:       []models.ChartSeries{},
		InvoiceStatus:        []models.InvoiceStatusCount{},
		UpcomingInvoices:     []models.SuperAdminUpcomingInvoice{},
		OverdueInvoices:      []models.OverdueInvoiceItem{},
		RecentPayments:       []models.RecentPayment{},
		PendingVerifications: []models.PendingVerificationItem{},
		RecentActivities:     []models.RecentActivity{},
	}

	ctx := context.Background()

	// 1. Stats utama (clients, admins, invoices, revenue)
	statsQuery := `
		SELECT
			(SELECT COUNT(*) FROM clients c JOIN profiles p ON p.id = c.profile_id WHERE p.role = 'CLIENT'),
			(SELECT COUNT(id) FROM profiles WHERE role = 'ADMIN'),
			COUNT(id),
			COUNT(id) FILTER (WHERE status = 'PAID'),
			COUNT(id) FILTER (WHERE status = 'UNPAID'),
			COUNT(id) FILTER (WHERE status = 'OVERDUE'),
			COUNT(id) FILTER (WHERE status = 'CANCELLED'),
			COALESCE(SUM(total) FILTER (WHERE status IN ('PAID', 'UNPAID', 'OVERDUE', 'SENT')), 0),
			COALESCE(SUM(total) FILTER (WHERE status = 'PAID'), 0),
			COALESCE(SUM(total) FILTER (WHERE status IN ('UNPAID', 'SENT')), 0),
			COALESCE(SUM(total) FILTER (WHERE status = 'OVERDUE'), 0),
			(SELECT COUNT(id) FROM payments WHERE status = 'PENDING')
		FROM invoices
	`
	err := s.DB.QueryRow(ctx, statsQuery).Scan(
		&dashboard.Stats.TotalClients,
		&dashboard.Stats.TotalAdmins,
		&dashboard.Stats.TotalInvoices,
		&dashboard.Stats.PaidInvoices,
		&dashboard.Stats.UnpaidInvoices,
		&dashboard.Stats.OverdueInvoices,
		&dashboard.Stats.CancelledInvoices,
		&dashboard.Stats.TotalRevenue,
		&dashboard.Stats.PaidRevenue,
		&dashboard.Stats.OutstandingAmount,
		&dashboard.Stats.OverdueAmount,
		&dashboard.Stats.PendingPayments,
	)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil stats superadmin: %w", err)
	}

	// 2. Reminders hari ini (batas hari mengikuti Asia/Jakarta, bukan timezone sesi DB)
	reminderQuery := `
		SELECT
			COUNT(id) FILTER (WHERE status = 'PENDING'),
			COUNT(id) FILTER (WHERE status = 'SENT'),
			COUNT(id) FILTER (WHERE status = 'FAILED')
		FROM reminders
		WHERE DATE(scheduled_at AT TIME ZONE 'Asia/Jakarta') = (NOW() AT TIME ZONE 'Asia/Jakarta')::date
	`
	err = s.DB.QueryRow(ctx, reminderQuery).Scan(
		&dashboard.RemindersToday.Scheduled,
		&dashboard.RemindersToday.Sent,
		&dashboard.RemindersToday.Failed,
	)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil reminders hari ini: %w", err)
	}

	// 3. Distribusi status invoice
	statusQuery := `
		SELECT status, COUNT(id)
		FROM invoices
		WHERE status IN ('PAID', 'UNPAID', 'SENT', 'OVERDUE', 'CANCELLED')
		GROUP BY status
		ORDER BY status
	`
	rows, err := s.DB.Query(ctx, statusQuery)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil distribusi status invoice: %w", err)
	}

	for rows.Next() {
		var item models.InvoiceStatusCount
		if err := rows.Scan(&item.Status, &item.Count); err != nil {
			rows.Close()
			return nil, err
		}
		dashboard.InvoiceStatus = append(dashboard.InvoiceStatus, item)
	}
	rows.Close()

	// 4. Upcoming invoices (5 terdekat, belum lunas, dengan plan & reminder berikutnya)
	upcomingQuery := `
		SELECT
			i.invoice_number,
			c.company_name,
			COALESCE((SELECT p2.name FROM invoice_items ii JOIN products p2 ON p2.id = ii.product_id WHERE ii.invoice_id = i.id LIMIT 1), '-'),
			TO_CHAR(i.due_date, 'DD Mon YYYY'),
			i.total,
			i.status,
			COALESCE((SELECT r.reminder_type FROM reminders r WHERE r.invoice_id = i.id AND r.status = 'PENDING' ORDER BY r.scheduled_at ASC LIMIT 1), '-'),
			COALESCE((SELECT r.status FROM reminders r WHERE r.invoice_id = i.id AND r.status = 'PENDING' ORDER BY r.scheduled_at ASC LIMIT 1), '')
		FROM invoices i
		JOIN clients c ON i.client_id = c.id
		WHERE i.status IN ('UNPAID', 'SENT', 'OVERDUE')
		ORDER BY i.due_date ASC
		LIMIT 5
	`
	rows, err = s.DB.Query(ctx, upcomingQuery)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil upcoming invoices: %w", err)
	}

	for rows.Next() {
		var inv models.SuperAdminUpcomingInvoice
		if err := rows.Scan(&inv.InvoiceNumber, &inv.Client, &inv.Plan, &inv.DueDate, &inv.Amount, &inv.Status, &inv.Reminder, &inv.ReminderStatus); err != nil {
			rows.Close()
			return nil, err
		}
		dashboard.UpcomingInvoices = append(dashboard.UpcomingInvoices, inv)
	}
	rows.Close()

	// 5. Overdue invoices (10 teratas dengan jumlah hari terlambat, hari ini mengikuti Asia/Jakarta)
	overdueQuery := `
		SELECT
			i.invoice_number,
			c.company_name,
			TO_CHAR(i.due_date, 'DD Mon YYYY'),
			GREATEST(0, (NOW() AT TIME ZONE 'Asia/Jakarta')::date - i.due_date::date)::int,
			i.total
		FROM invoices i
		JOIN clients c ON i.client_id = c.id
		WHERE i.status = 'OVERDUE'
		ORDER BY i.due_date ASC
		LIMIT 10
	`
	rows, err = s.DB.Query(ctx, overdueQuery)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil overdue invoices: %w", err)
	}

	for rows.Next() {
		var inv models.OverdueInvoiceItem
		if err := rows.Scan(&inv.InvoiceNumber, &inv.Client, &inv.DueDate, &inv.DaysOverdue, &inv.Amount); err != nil {
			rows.Close()
			return nil, err
		}
		dashboard.OverdueInvoices = append(dashboard.OverdueInvoices, inv)
	}
	rows.Close()

	// 6. Recent payments (5 terbaru)
	recentPaymentsQuery := `
		SELECT
			p.id,
			c.company_name,
			i.invoice_number,
			p.amount,
			TO_CHAR(COALESCE(p.payment_date, p.created_at), 'DD Mon YYYY'),
			COALESCE(p.payment_method, '-'),
			p.status
		FROM payments p
		JOIN invoices i ON p.invoice_id = i.id
		JOIN clients c ON i.client_id = c.id
		ORDER BY COALESCE(p.payment_date, p.created_at) DESC
		LIMIT 5
	`
	rows, err = s.DB.Query(ctx, recentPaymentsQuery)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil recent payments: %w", err)
	}

	for rows.Next() {
		var pay models.RecentPayment
		if err := rows.Scan(&pay.ID, &pay.Client, &pay.InvoiceNumber, &pay.Amount, &pay.Date, &pay.Method, &pay.Status); err != nil {
			rows.Close()
			return nil, err
		}
		dashboard.RecentPayments = append(dashboard.RecentPayments, pay)
	}
	rows.Close()

	// 7. Pending verifications (5 terbaru)
	pendingQuery := `
		SELECT
			p.id,
			c.company_name,
			i.invoice_number,
			p.amount,
			TO_CHAR(p.created_at, 'DD Mon YYYY')
		FROM payments p
		JOIN invoices i ON p.invoice_id = i.id
		JOIN clients c ON i.client_id = c.id
		WHERE p.status = 'PENDING'
		ORDER BY p.created_at DESC
		LIMIT 5
	`
	rows, err = s.DB.Query(ctx, pendingQuery)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil pending verifications: %w", err)
	}

	for rows.Next() {
		var pv models.PendingVerificationItem
		if err := rows.Scan(&pv.ID, &pv.Client, &pv.InvoiceNumber, &pv.Amount, &pv.Date); err != nil {
			rows.Close()
			return nil, err
		}
		dashboard.PendingVerifications = append(dashboard.PendingVerifications, pv)
	}
	rows.Close()

	// 8. Recent activities dari activity_logs (6 terbaru)
	activityQuery := `
		SELECT id, action, COALESCE(description, ''), created_at
		FROM activity_logs
		ORDER BY created_at DESC
		LIMIT 6
	`
	rows, err = s.DB.Query(ctx, activityQuery)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil activities: %w", err)
	}

	for rows.Next() {
		var act models.RecentActivity
		if err := rows.Scan(&act.ID, &act.Action, &act.Description, &act.CreatedAt); err != nil {
			rows.Close()
			return nil, err
		}
		dashboard.RecentActivities = append(dashboard.RecentActivities, act)
	}
	rows.Close()

	// 9. Revenue chart: total pembayaran APPROVED per hari (Asia/Jakarta), dikelompokkan di Go.
	// Tanggal memakai COALESCE(payment_date, verified_at, created_at) karena approve flow
	// tidak mengisi payment_date, sehingga payment APPROVED tetap terhitung.
	dailyRevenue := map[string]float64{}
	nowJakarta := time.Now().In(jakartaLoc)
	monthStartJakarta := time.Date(nowJakarta.Year(), nowJakarta.Month(), 1, 0, 0, 0, 0, jakartaLoc)
	windowStart := monthStartJakarta.AddDate(0, -11, 0)

	revenueQuery := `
		SELECT (COALESCE(payment_date, verified_at, created_at) AT TIME ZONE 'Asia/Jakarta')::date AS d, SUM(amount)
		FROM payments
		WHERE status = 'APPROVED'
		  AND COALESCE(payment_date, verified_at, created_at) >= $1
		GROUP BY d ORDER BY d
	`
	rows, err = s.DB.Query(ctx, revenueQuery, windowStart)
	if err != nil {
		return nil, fmt.Errorf("gagal mengambil revenue harian: %w", err)
	}

	for rows.Next() {
		var day time.Time
		var amount float64
		if err := rows.Scan(&day, &amount); err != nil {
			rows.Close()
			return nil, err
		}
		dailyRevenue[day.Format("2006-01-02")] = amount
	}
	rows.Close()

	dashboard.RevenuePeriods = buildRevenuePeriods(dailyRevenue)

	return dashboard, nil
}

// jakartaLoc adalah timezone Asia/Jakarta (WIB, UTC+7, tanpa DST).
var jakartaLoc = time.FixedZone("WIB", 7*3600)

// monthLabelsID adalah nama bulan singkat untuk label chart berbahasa Indonesia.
var monthLabelsID = []string{"Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"}

func buildRevenuePeriods(daily map[string]float64) []models.ChartSeries {
	now := time.Now().In(jakartaLoc)
	today := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, jakartaLoc)
	monthStart := time.Date(today.Year(), today.Month(), 1, 0, 0, 0, 0, jakartaLoc)

	valueAt := func(t time.Time) float64 {
		return daily[t.Format("2006-01-02")]
	}

	dayLabel := func(t time.Time) string {
		return fmt.Sprintf("%d %s", t.Day(), monthLabelsID[t.Month()-1])
	}

	// 7 hari terakhir termasuk hari ini
	labels7 := make([]string, 7)
	values7 := make([]float64, 7)
	for i := 0; i < 7; i++ {
		day := today.AddDate(0, 0, -(6 - i))
		labels7[i] = dayLabel(day)
		values7[i] = valueAt(day)
	}

	// Bulan berjalan: revenue harian dari tanggal 1 sampai hari ini
	daysSoFar := today.Day()
	labelsMonth := make([]string, daysSoFar)
	valuesMonth := make([]float64, daysSoFar)
	for i := 0; i < daysSoFar; i++ {
		day := monthStart.AddDate(0, 0, i)
		labelsMonth[i] = dayLabel(day)
		valuesMonth[i] = valueAt(day)
	}

	// 12 bulan terakhir termasuk bulan berjalan (agregasi bulanan)
	labelsYear := make([]string, 12)
	valuesYear := make([]float64, 12)
	firstMonth := monthStart.AddDate(0, -11, 0)
	for i := 0; i < 12; i++ {
		mStart := firstMonth.AddDate(0, i, 0)
		mEnd := mStart.AddDate(0, 1, 0)
		total := 0.0
		for day := mStart; day.Before(mEnd); day = day.AddDate(0, 0, 1) {
			total += valueAt(day)
		}
		labelsYear[i] = monthLabelsID[mStart.Month()-1]
		valuesYear[i] = total
	}

	return []models.ChartSeries{
		{Key: "7 Days", Labels: labels7, Values: values7},
		{Key: "1 Month", Labels: labelsMonth, Values: valuesMonth},
		{Key: "1 Year", Labels: labelsYear, Values: valuesYear},
	}
}