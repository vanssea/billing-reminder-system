package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PaymentService struct {
	DB *pgxpool.Pool
}

func NewPaymentService(db *pgxpool.Pool) *PaymentService {
	return &PaymentService{
		DB: db,
	}
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

// ============================================================
// GET PAYMENT BY ID
// ============================================================

func (s *PaymentService) GetPaymentByID(ctx context.Context, id string) (*models.PaymentDetail, error) {
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

// ============================================================
// VERIFY PAYMENT (PENDING -> VERIFIED)
// ============================================================

func (s *PaymentService) VerifyPayment(ctx context.Context, id string, req models.VerifyPaymentRequest) (*models.PaymentDetail, error) {
	var currentStatus string

	err := s.DB.QueryRow(ctx, `SELECT status FROM payments WHERE id = $1 FOR UPDATE`, id).Scan(&currentStatus)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, fmt.Errorf("pembayaran tidak ditemukan")
		}
		return nil, err
	}

	if currentStatus != "PENDING" {
		return nil, fmt.Errorf("hanya pembayaran berstatus PENDING yang bisa diverifikasi")
	}

	_, err = s.DB.Exec(ctx, `
		UPDATE payments
		SET status = 'VERIFIED', verified_by = $1, verified_at = now(), updated_at = now()
		WHERE id = $2
	`, req.VerifiedBy, id)
	if err != nil {
		return nil, err
	}

	return s.GetPaymentByID(ctx, id)
}

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

	return s.GetPaymentByID(ctx, id)
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

	return s.GetPaymentByID(ctx, id)
}
