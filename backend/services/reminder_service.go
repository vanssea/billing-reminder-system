package services

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"billing-reminder-system/models"
)

var reminderTypeOffsets = []struct {
	Type string
	Days int
}{
	{"H-30", 30},
	{"H-14", 14},
	{"H-10", 10},
	{"H-7", 7},
	{"H-3", 3},
	{"H-1", 1},
}

type ReminderService struct {
	DB *pgxpool.Pool
}

func NewReminderService(db *pgxpool.Pool) *ReminderService {
	return &ReminderService{
		DB: db,
	}
}

func (s *ReminderService) GetReminders(ctx context.Context) ([]models.Reminder, error) {
	query := `
		SELECT
			r.id,
			r.invoice_id,
			i.invoice_number,
			c.company_name,
			i.due_date,
			r.reminder_type,
			r.scheduled_at,
			r.sent_at,
			r.status,
			r.error_message,
			r.created_at
		FROM reminders r
		INNER JOIN invoices i ON i.id = r.invoice_id
		INNER JOIN clients c ON c.id = i.client_id
		ORDER BY r.scheduled_at DESC
	`

	rows, err := s.DB.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reminders []models.Reminder

	for rows.Next() {
		var reminder models.Reminder

		err := rows.Scan(
			&reminder.ID,
			&reminder.InvoiceID,
			&reminder.InvoiceNumber,
			&reminder.ClientName,
			&reminder.DueDate,
			&reminder.ReminderType,
			&reminder.ScheduledAt,
			&reminder.SentAt,
			&reminder.Status,
			&reminder.ErrorMessage,
			&reminder.CreatedAt,
		)

		if err != nil {
			return nil, err
		}

		reminders = append(reminders, reminder)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return reminders, nil
}
func (s *ReminderService) RetryReminder(
	ctx context.Context,
	id string,
) (*models.Reminder, error) {
	query := `
		UPDATE reminders
		SET
			status = 'PENDING',
			sent_at = NULL,
			error_message = NULL
		WHERE id = $1
		RETURNING
			id,
			invoice_id,
			scheduled_at,
			sent_at,
			status,
			error_message,
			created_at
	`

	var reminder models.Reminder

	err := s.DB.QueryRow(ctx, query, id).Scan(
		&reminder.ID,
		&reminder.InvoiceID,
		&reminder.ScheduledAt,
		&reminder.SentAt,
		&reminder.Status,
		&reminder.ErrorMessage,
		&reminder.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &reminder, nil
}

// CreateRemindersForInvoice membuat reminder PENDING untuk sebuah invoice
// berdasarkan due_date. Menggunakan ON CONFLICT agar tidak membuat duplicate
// (mengikuti unique constraint (invoice_id, reminder_type)).
func CreateRemindersForInvoice(
	ctx context.Context,
	tx pgx.Tx,
	invoiceID string,
	dueDate time.Time,
) error {
	for _, rt := range reminderTypeOffsets {
		offsetDate := dueDate.AddDate(0, 0, -rt.Days)
		scheduledAt := time.Date(
			offsetDate.Year(),
			offsetDate.Month(),
			offsetDate.Day(),
			9, 0, 0, 0,
			offsetDate.Location(),
		)

		_, err := tx.Exec(ctx, `
			INSERT INTO reminders (
				invoice_id,
				reminder_type,
				scheduled_at,
				status
			)
			VALUES ($1, $2, $3, 'PENDING')
			ON CONFLICT (invoice_id, reminder_type) DO NOTHING
		`, invoiceID, rt.Type, scheduledAt)

		if err != nil {
			return err
		}
	}

	return nil
}