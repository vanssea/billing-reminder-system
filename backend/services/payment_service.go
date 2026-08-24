package services

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PaymentService struct {
	DB            *pgxpool.Pool
	ClientService *ClientService
	WhatsApp      *WhatsAppService
}

func NewPaymentService(db *pgxpool.Pool, clientService *ClientService) *PaymentService {
	return &PaymentService{
		DB:            db,
		ClientService: clientService,
	}
}

func (s *PaymentService) GetClientByProfileID(profileID string) (*models.Client, error) {
	return s.ClientService.GetClientByProfileID(profileID)
}

func (s *PaymentService) GetPaymentsByClientID(clientID string) ([]models.Payment, error) {
	// First get invoices for this client, then get payments for those invoices
	query := `
		SELECT
			p.id,
			p.invoice_id,
			p.amount,
			COALESCE(p.payment_date, p.created_at) AS payment_date,
			COALESCE(p.payment_method, '') AS payment_method,
			COALESCE(p.proof_url, '') AS proof_url,
			p.status,
			p.verified_by,
			p.verified_at,
			COALESCE(p.notes, '') AS notes,
			p.created_at,
			p.updated_at
		FROM payments p
		JOIN invoices i ON i.id = p.invoice_id
		WHERE i.client_id = $1
		ORDER BY p.created_at DESC
	`

	rows, err := s.DB.Query(context.Background(), query, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []models.Payment

	for rows.Next() {
		var p models.Payment

		err := rows.Scan(
			&p.ID,
			&p.InvoiceID,
			&p.Amount,
			&p.PaymentDate,
			&p.PaymentMethod,
			&p.ProofURL,
			&p.Status,
			&p.VerifiedBy,
			&p.VerifiedAt,
			&p.Notes,
			&p.CreatedAt,
			&p.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// Populate compatibility fields
		p.PaymentID = p.ID
		p.VerificationStatus = p.Status
		p.RejectionReason = p.Notes
		payments = append(payments, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return payments, nil
}

const paymentDetailSelect = `
	SELECT
		p.id,
		p.invoice_id,
		i.invoice_number,
		c.company_name,
		p.amount,
		p.payment_date,
		p.payment_method,
		p.proof_url,
		p.status,
		p.verified_by,
		p.verified_at,
		p.notes,
		p.created_at,
		p.updated_at
	FROM payments p
	INNER JOIN invoices i ON i.id = p.invoice_id
	INNER JOIN clients c ON c.id = i.client_id
`

// ============================================================
// GET ALL PAYMENTS
// ============================================================

func (s *PaymentService) GetPayments(ctx context.Context) ([]models.PaymentDetail, error) {
	rows, err := s.DB.Query(ctx, paymentDetailSelect+`
		ORDER BY p.created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var payments []models.PaymentDetail

	for rows.Next() {
		var payment models.PaymentDetail

		err := rows.Scan(
			&payment.ID,
			&payment.InvoiceID,
			&payment.InvoiceNumber,
			&payment.ClientName,
			&payment.Amount,
			&payment.PaymentDate,
			&payment.PaymentMethod,
			&payment.ProofURL,
			&payment.Status,
			&payment.VerifiedBy,
			&payment.VerifiedAt,
			&payment.Notes,
			&payment.CreatedAt,
			&payment.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		payments = append(payments, payment)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	if payments == nil {
		payments = []models.PaymentDetail{}
	}

	return payments, nil
}

func (s *PaymentService) GetPaymentByID(paymentID string) (*models.Payment, error) {
	query := `
		SELECT
			id,
			invoice_id,
			amount,
			COALESCE(payment_date, created_at) AS payment_date,
			COALESCE(payment_method, '') AS payment_method,
			COALESCE(proof_url, '') AS proof_url,
			status,
			verified_by,
			verified_at,
			COALESCE(notes, '') AS notes,
			created_at,
			updated_at
		FROM payments
		WHERE id = $1
	`

	var p models.Payment
	err := s.DB.QueryRow(context.Background(), query, paymentID).Scan(
		&p.ID,
		&p.InvoiceID,
		&p.Amount,
		&p.PaymentDate,
		&p.PaymentMethod,
		&p.ProofURL,
		&p.Status,
		&p.VerifiedBy,
		&p.VerifiedAt,
		&p.Notes,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	// Populate compatibility fields
	p.PaymentID = p.ID
	p.VerificationStatus = p.Status
	p.RejectionReason = p.Notes
	return &p, nil
}

// getPaymentDetailByID mengembalikan payment yang sudah diperkaya dengan
// invoice_number dan nama client (PaymentDetail) untuk kebutuhan alur admin.
func (s *PaymentService) getPaymentDetailByID(ctx context.Context, id string) (*models.PaymentDetail, error) {
	var payment models.PaymentDetail

	err := s.DB.QueryRow(ctx, paymentDetailSelect+`
		WHERE p.id = $1
	`, id).Scan(
		&payment.ID,
		&payment.InvoiceID,
		&payment.InvoiceNumber,
		&payment.ClientName,
		&payment.Amount,
		&payment.PaymentDate,
		&payment.PaymentMethod,
		&payment.ProofURL,
		&payment.Status,
		&payment.VerifiedBy,
		&payment.VerifiedAt,
		&payment.Notes,
		&payment.CreatedAt,
		&payment.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("pembayaran tidak ditemukan")
		}
		return nil, err
	}

	return &payment, nil
}

func (s *PaymentService) CreatePayment(req models.CreatePaymentRequest) (*models.Payment, error) {
	paymentDate, _ := time.Parse("2006-01-02", req.PaymentDate)

	query := `
		INSERT INTO payments (
			invoice_id, amount, payment_date,
			payment_method, proof_url, status
		) VALUES ($1, $2, $3, $4, $5, 'PENDING')
		RETURNING
			id, invoice_id, amount, payment_date,
			payment_method, proof_url, status,
			verified_by, verified_at, COALESCE(notes, '') AS notes,
			created_at, updated_at
	`

	var p models.Payment
	err := s.DB.QueryRow(
		context.Background(), query,
		req.InvoiceID, req.Amount, paymentDate,
		req.PaymentMethod, req.ProofURL,
	).Scan(
		&p.ID, &p.InvoiceID, &p.Amount, &p.PaymentDate,
		&p.PaymentMethod, &p.ProofURL, &p.Status,
		&p.VerifiedBy, &p.VerifiedAt, &p.Notes,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	// Populate compatibility fields
	p.PaymentID = p.ID
	p.VerificationStatus = p.Status
	p.RejectionReason = p.Notes
	return &p, nil
}

func (s *PaymentService) UpdatePayment(paymentID string, req models.UpdatePaymentRequest) (*models.Payment, error) {
	setParts := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.Amount != nil {
		setParts = append(setParts, "amount = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Amount)
		argIdx++
	}
	if req.PaymentDate != nil {
		setParts = append(setParts, "payment_date = $"+strconv.Itoa(argIdx))
		d, _ := time.Parse("2006-01-02", *req.PaymentDate)
		args = append(args, d)
		argIdx++
	}
	if req.PaymentMethod != nil {
		setParts = append(setParts, "payment_method = $"+strconv.Itoa(argIdx))
		args = append(args, *req.PaymentMethod)
		argIdx++
	}
	if req.ProofURL != nil {
		setParts = append(setParts, "proof_url = $"+strconv.Itoa(argIdx))
		args = append(args, *req.ProofURL)
		argIdx++
	}
	if req.Status != nil {
		setParts = append(setParts, "status = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Status)
		argIdx++
	}
	if req.VerifiedBy != nil {
		setParts = append(setParts, "verified_by = $"+strconv.Itoa(argIdx))
		args = append(args, *req.VerifiedBy)
		argIdx++
	}
	if req.VerifiedAt != nil {
		setParts = append(setParts, "verified_at = $"+strconv.Itoa(argIdx))
		d, _ := time.Parse(time.RFC3339, *req.VerifiedAt)
		args = append(args, d)
		argIdx++
	}
	if req.Notes != nil {
		setParts = append(setParts, "notes = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Notes)
		argIdx++
	}

	if len(setParts) == 0 {
		return s.GetPaymentByID(paymentID)
	}

	setParts = append(setParts, "updated_at = now()")
	args = append(args, paymentID)

	query := "UPDATE payments SET " + strings.Join(setParts, ", ") + " WHERE id = $" + strconv.Itoa(argIdx) + " RETURNING id, invoice_id, amount, COALESCE(payment_date, created_at) AS payment_date, COALESCE(payment_method, '') AS payment_method, COALESCE(proof_url, '') AS proof_url, status, verified_by, verified_at, COALESCE(notes, '') AS notes, created_at, updated_at"

	var p models.Payment
	err := s.DB.QueryRow(context.Background(), query, args...).Scan(
		&p.ID, &p.InvoiceID, &p.Amount, &p.PaymentDate,
		&p.PaymentMethod, &p.ProofURL, &p.Status,
		&p.VerifiedBy, &p.VerifiedAt, &p.Notes,
		&p.CreatedAt, &p.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	// Populate compatibility fields
	p.PaymentID = p.ID
	p.VerificationStatus = p.Status
	p.RejectionReason = p.Notes
	return &p, nil
}

func (s *PaymentService) DeletePayment(paymentID string) error {
	query := `DELETE FROM payments WHERE id = $1`
	_, err := s.DB.Exec(context.Background(), query, paymentID)
	return err
}

// ============================================================
// GET PAYMENT DETAIL BY ID
// ============================================================

// ============================================================
// APPROVE PAYMENT -> INVOICE PAID
// ============================================================

func (s *PaymentService) ApprovePayment(ctx context.Context, id string, req models.ApprovePaymentRequest) (*models.PaymentDetail, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var invoiceID, currentStatus string

	err = tx.QueryRow(ctx, `SELECT invoice_id, status FROM payments WHERE id = $1 FOR UPDATE`, id).Scan(&invoiceID, &currentStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("pembayaran tidak ditemukan")
		}
		return nil, err
	}

	if currentStatus == "APPROVED" {
		return nil, fmt.Errorf("pembayaran sudah disetujui sebelumnya")
	}

	if currentStatus == "REJECTED" {
		return nil, fmt.Errorf("pembayaran yang ditolak tidak bisa disetujui")
	}

	_, err = tx.Exec(ctx, `
		UPDATE payments
		SET status = 'APPROVED', verified_by = $1, verified_at = now(), updated_at = now()
		WHERE id = $2
	`, req.VerifiedBy, id)
	if err != nil {
		return nil, err
	}

	// Invoice menjadi LUNAS setelah pembayaran disetujui
	_, err = tx.Exec(ctx, `
		UPDATE invoices
		SET status = 'PAID', updated_at = now()
		WHERE id = $1
	`, invoiceID)
	if err != nil {
		return nil, err
	}

	// Hentikan reminder yang belum terkirim karena invoice sudah lunas
	_, err = tx.Exec(ctx, `
		UPDATE reminders
		SET status = 'SKIPPED'
		WHERE invoice_id = $1 AND sent_at IS NULL AND status IN ('PENDING', 'FAILED')
	`, invoiceID)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	go sendPaymentApprovedWhatsApp(s.DB, s.WhatsApp, id)
	go NotifyPaymentApproved(s.DB, id)

	return s.getPaymentDetailByID(ctx, id)
}

// ============================================================
// REJECT PAYMENT
// ============================================================

func (s *PaymentService) RejectPayment(ctx context.Context, id string, req models.RejectPaymentRequest) (*models.PaymentDetail, error) {
	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx)

	var currentStatus string

	err = tx.QueryRow(ctx, `SELECT status FROM payments WHERE id = $1 FOR UPDATE`, id).Scan(&currentStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("pembayaran tidak ditemukan")
		}
		return nil, err
	}

	if currentStatus == "APPROVED" {
		return nil, fmt.Errorf("pembayaran yang sudah disetujui tidak bisa ditolak")
	}

	if currentStatus == "REJECTED" {
		return nil, fmt.Errorf("pembayaran sudah ditolak sebelumnya")
	}

	now := time.Now()

	_, err = tx.Exec(ctx, `
		UPDATE payments
		SET status = 'REJECTED', verified_by = $1, verified_at = $2, notes = COALESCE($3, notes), updated_at = now()
		WHERE id = $4
	`, req.VerifiedBy, now, req.Notes, id)
	if err != nil {
		return nil, err
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	reason := ""
	if req.Notes != nil {
		reason = *req.Notes
	}
	go sendPaymentRejectedWhatsApp(s.DB, s.WhatsApp, id, reason)
	go NotifyPaymentRejected(s.DB, id, reason)

	return s.getPaymentDetailByID(ctx, id)
}
