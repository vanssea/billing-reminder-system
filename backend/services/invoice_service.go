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

type InvoiceService struct {
	DB            *pgxpool.Pool
	ClientService *ClientService
}

func NewInvoiceService(db *pgxpool.Pool, clientService *ClientService) *InvoiceService {
	return &InvoiceService{
		DB:            db,
		ClientService: clientService,
	}
}

func (s *InvoiceService) GetClientByProfileID(profileID string) (*models.Client, error) {
	return s.ClientService.GetClientByProfileID(profileID)
}

func (s *InvoiceService) GetInvoicesByClientID(clientID string) ([]models.Invoice, error) {
	query := `
		SELECT
			id,
			invoice_number,
			client_id,
			invoice_date,
			due_date,
			status,
			subtotal,
			tax,
			total,
			notes,
			created_by,
			sent_at,
			created_at,
			updated_at
		FROM invoices
		WHERE client_id = $1
		ORDER BY invoice_date DESC
	`

	rows, err := s.DB.Query(context.Background(), query, clientID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []models.Invoice
	for rows.Next() {
		var inv models.Invoice
		err := rows.Scan(
			&inv.ID,
			&inv.InvoiceNumber,
			&inv.ClientID,
			&inv.InvoiceDate,
			&inv.DueDate,
			&inv.Status,
			&inv.Subtotal,
			&inv.Tax,
			&inv.Total,
			&inv.Notes,
			&inv.CreatedBy,
			&inv.SentAt,
			&inv.CreatedAt,
			&inv.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		// Populate compatibility fields
		inv.Product = inv.Notes
		inv.Discount = 0
		invoices = append(invoices, inv)
	}
	return invoices, rows.Err()
}

func (s *InvoiceService) GetInvoiceByID(id string) (*models.Invoice, error) {
	query := `
		SELECT
			id,
			invoice_number,
			client_id,
			invoice_date,
			due_date,
			status,
			subtotal,
			tax,
			total,
			notes,
			created_by,
			sent_at,
			created_at,
			updated_at
		FROM invoices
		WHERE id = $1
	`

	var inv models.Invoice
	err := s.DB.QueryRow(context.Background(), query, id).Scan(
		&inv.ID,
		&inv.InvoiceNumber,
		&inv.ClientID,
		&inv.InvoiceDate,
		&inv.DueDate,
		&inv.Status,
		&inv.Subtotal,
		&inv.Tax,
		&inv.Total,
		&inv.Notes,
		&inv.CreatedBy,
		&inv.SentAt,
		&inv.CreatedAt,
		&inv.UpdatedAt,
	)
	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	// Populate compatibility fields
	inv.Product = inv.Notes
	inv.Discount = 0
	return &inv, nil
}

func (s *InvoiceService) GetInvoiceTimeline(invoice *models.Invoice) ([]models.InvoiceTimelineStep, error) {
	payments, err := s.GetPaymentsByInvoiceID(invoice.ID)
	if err != nil {
		return nil, err
	}

	var payment *models.Payment
	for _, p := range payments {
		if p.Status != "REJECTED" {
			payment = &p
			break
		}
	}

	today := time.Now()
	isDone := func(date *time.Time) bool {
		if date == nil {
			return false
		}
		return !date.After(today)
	}

	steps := []models.InvoiceTimelineStep{
		{Label: "Invoice dibuat", Date: &invoice.InvoiceDate},
		{Label: "Invoice dikirim", Date: invoice.SentAt},
	}

	done := func() ([]models.InvoiceTimelineStep, error) {
		result := make([]models.InvoiceTimelineStep, len(steps))
		for i := range steps {
			result[i] = steps[i]
			result[i].Done = isDone(steps[i].Date)
		}
		return result, nil
	}

	if invoice.Status == "CANCELLED" {
		cancelDate := invoice.SentAt
		if cancelDate == nil {
			cancelDate = &invoice.InvoiceDate
		}
		steps = append(steps, models.InvoiceTimelineStep{Label: "Invoice dibatalkan", Date: cancelDate})
		return done()
	}

	if invoice.Status == "PAID" {
		var paidDate *time.Time
		if payment != nil {
			if payment.VerifiedAt != nil {
				paidDate = payment.VerifiedAt
			} else if payment.PaymentDate != (time.Time{}) {
				paidDate = &payment.PaymentDate
			}
		}

		reminderOffsets := []int{-10, -7, -3, -1}
		for _, offset := range reminderOffsets {
			reminderDate := invoice.DueDate.AddDate(0, 0, offset)
			if paidDate == nil || !reminderDate.After(*paidDate) {
				steps = append(steps, models.InvoiceTimelineStep{Label: "Reminder H" + strconv.Itoa(-offset), Date: &reminderDate})
			}
		}

		if payment != nil {
			steps = append(steps, models.InvoiceTimelineStep{Label: "Bukti pembayaran diupload", Date: &payment.PaymentDate})
			if payment.VerifiedAt != nil {
				steps = append(steps, models.InvoiceTimelineStep{Label: "Pembayaran diverifikasi", Date: payment.VerifiedAt})
			}
		}
		if paidDate != nil {
			steps = append(steps, models.InvoiceTimelineStep{Label: "Invoice PAID", Date: paidDate})
		}
		return done()
	}

	if invoice.Status == "OVERDUE" {
		reminderOffsets := []int{-10, -7, -3, -1}
		for _, offset := range reminderOffsets {
			reminderDate := invoice.DueDate.AddDate(0, 0, offset)
			steps = append(steps, models.InvoiceTimelineStep{Label: "Reminder H" + strconv.Itoa(-offset), Date: &reminderDate})
		}
		steps = append(steps, models.InvoiceTimelineStep{Label: "Invoice menjadi OVERDUE", Date: &invoice.DueDate})
		return done()
	}

	if payment != nil && payment.Status == "REJECTED" {
		reminderOffsets := []int{-10, -7, -3, -1}
		for _, offset := range reminderOffsets {
			reminderDate := invoice.DueDate.AddDate(0, 0, offset)
			steps = append(steps, models.InvoiceTimelineStep{Label: "Reminder H" + strconv.Itoa(-offset), Date: &reminderDate})
		}
		steps = append(steps, models.InvoiceTimelineStep{Label: "Bukti pembayaran diupload", Date: &payment.PaymentDate})
		if payment.VerifiedAt != nil {
			steps = append(steps, models.InvoiceTimelineStep{Label: "Pembayaran ditolak", Date: payment.VerifiedAt})
		}
		return done()
	}

	if payment != nil {
		reminderOffsets := []int{-10, -7, -3, -1}
		for _, offset := range reminderOffsets {
			reminderDate := invoice.DueDate.AddDate(0, 0, offset)
			steps = append(steps, models.InvoiceTimelineStep{Label: "Reminder H" + strconv.Itoa(-offset), Date: &reminderDate})
		}
		steps = append(steps, models.InvoiceTimelineStep{Label: "Bukti pembayaran diupload", Date: &payment.PaymentDate})
		if payment.VerifiedAt != nil {
			steps = append(steps, models.InvoiceTimelineStep{Label: "Pembayaran diverifikasi", Date: payment.VerifiedAt})
			steps = append(steps, models.InvoiceTimelineStep{Label: "Invoice PAID", Date: payment.VerifiedAt})
		}
		return done()
	}

	reminderOffsets := []int{-10, -7, -3, -1}
	for _, offset := range reminderOffsets {
		reminderDate := invoice.DueDate.AddDate(0, 0, offset)
		steps = append(steps, models.InvoiceTimelineStep{Label: "Reminder H" + strconv.Itoa(-offset), Date: &reminderDate})
	}
	return done()
}

func (s *InvoiceService) GetPaymentsByInvoiceID(invoiceID string) ([]models.Payment, error) {
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
		WHERE invoice_id = $1
		ORDER BY created_at DESC
	`

	rows, err := s.DB.Query(context.Background(), query, invoiceID)
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

func (s *InvoiceService) CreateInvoice(req models.CreateInvoiceRequest) (*models.Invoice, error) {
	invoiceDate, _ := time.Parse("2006-01-02", req.InvoiceDate)
	dueDate, _ := time.Parse("2006-01-02", req.DueDate)

	var sentAt *time.Time
	if req.SentAt != nil {
		d, _ := time.Parse("2006-01-02", *req.SentAt)
		sentAt = &d
	}

	query := `
		INSERT INTO invoices (
			client_id, invoice_date, due_date, status,
			subtotal, tax, total, notes, created_by, sent_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING
			id, invoice_number, client_id, invoice_date, due_date, status,
			subtotal, tax, total, notes, created_by, sent_at, created_at, updated_at
	`

	var inv models.Invoice
	err := s.DB.QueryRow(
		context.Background(), query,
		req.ClientID, invoiceDate, dueDate, req.Status,
		req.Subtotal, req.Tax, req.Total, req.Notes, req.CreatedBy, sentAt,
	).Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.ClientID, &inv.InvoiceDate, &inv.DueDate, &inv.Status,
		&inv.Subtotal, &inv.Tax, &inv.Total, &inv.Notes, &inv.CreatedBy, &inv.SentAt, &inv.CreatedAt, &inv.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (s *InvoiceService) UpdateInvoice(id string, req models.UpdateInvoiceRequest) (*models.Invoice, error) {
	setParts := []string{}
	args := []interface{}{}
	argIdx := 1

	if req.InvoiceDate != nil {
		setParts = append(setParts, "invoice_date = $"+strconv.Itoa(argIdx))
		d, _ := time.Parse("2006-01-02", *req.InvoiceDate)
		args = append(args, d)
		argIdx++
	}
	if req.DueDate != nil {
		setParts = append(setParts, "due_date = $"+strconv.Itoa(argIdx))
		d, _ := time.Parse("2006-01-02", *req.DueDate)
		args = append(args, d)
		argIdx++
	}
	if req.Status != nil {
		setParts = append(setParts, "status = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Status)
		argIdx++
	}
	if req.Subtotal != nil {
		setParts = append(setParts, "subtotal = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Subtotal)
		argIdx++
	}
	if req.Tax != nil {
		setParts = append(setParts, "tax = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Tax)
		argIdx++
	}
	if req.Total != nil {
		setParts = append(setParts, "total = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Total)
		argIdx++
	}
	if req.Notes != nil {
		setParts = append(setParts, "notes = $"+strconv.Itoa(argIdx))
		args = append(args, *req.Notes)
		argIdx++
	}
	if req.SentAt != nil {
		setParts = append(setParts, "sent_at = $"+strconv.Itoa(argIdx))
		d, _ := time.Parse("2006-01-02", *req.SentAt)
		args = append(args, d)
		argIdx++
	}

	if len(setParts) == 0 {
		return s.GetInvoiceByID(id)
	}

	setParts = append(setParts, "updated_at = now()")
	args = append(args, id)

	query := "UPDATE invoices SET " + strings.Join(setParts, ", ") + " WHERE id = $" + strconv.Itoa(argIdx) + " RETURNING id, invoice_number, client_id, invoice_date, due_date, status, subtotal, tax, total, notes, created_by, sent_at, created_at, updated_at"

	var inv models.Invoice
	err := s.DB.QueryRow(context.Background(), query, args...).Scan(
		&inv.ID, &inv.InvoiceNumber, &inv.ClientID, &inv.InvoiceDate, &inv.DueDate, &inv.Status,
		&inv.Subtotal, &inv.Tax, &inv.Total, &inv.Notes, &inv.CreatedBy, &inv.SentAt, &inv.CreatedAt, &inv.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	return &inv, nil
}

func (s *InvoiceService) DeleteInvoice(id string) error {
	query := `DELETE FROM invoices WHERE id = $1`
	_, err := s.DB.Exec(context.Background(), query, id)
	return err
}