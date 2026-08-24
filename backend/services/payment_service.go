package services

import (
	"context"
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
	return payments, rows.Err()
}

func (s *PaymentService) GetPaymentByID(paymentID string) (*models.Payment, error) {
	query := `
		SELECT
			id,
			invoice_id,
			amount,
			payment_date,
			payment_method,
			proof_url,
			status,
			verified_by,
			verified_at,
			notes,
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
			verified_by, verified_at, notes,
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

	query := "UPDATE payments SET " + strings.Join(setParts, ", ") + " WHERE id = $" + strconv.Itoa(argIdx) + " RETURNING id, invoice_id, amount, payment_date, payment_method, proof_url, status, verified_by, verified_at, notes, created_at, updated_at"

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