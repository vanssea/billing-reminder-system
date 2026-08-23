package services

import (
	"context"
	"fmt"
	"math"
	"time"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type InvoiceService struct {
	DB       *pgxpool.Pool
	WhatsApp *WhatsAppService
	PDF      *PDFService
}

func NewInvoiceService(db *pgxpool.Pool) *InvoiceService {
	return &InvoiceService{
		DB: db,
	}
}

// ============================================================
// FETCH INVOICE ITEMS
// ============================================================

func (s *InvoiceService) fetchItems(invoiceID string) ([]models.InvoiceItem, error) {
	rows, err := s.DB.Query(context.Background(), `
		SELECT
			ii.id,
			ii.invoice_id,
			ii.product_id,
			p.name,
			ii.quantity,
			ii.price,
			ii.subtotal
		FROM invoice_items ii
		JOIN products p ON p.id = ii.product_id
		WHERE ii.invoice_id = $1
		ORDER BY ii.created_at ASC
	`, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.InvoiceItem

	for rows.Next() {
		var item models.InvoiceItem

		err := rows.Scan(
			&item.ID,
			&item.InvoiceID,
			&item.ProductID,
			&item.ProductName,
			&item.Quantity,
			&item.Price,
			&item.Subtotal,
		)
		if err != nil {
			return nil, err
		}

		items = append(items, item)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return items, nil
}

// ============================================================
// FETCH PAYMENTS
// ============================================================

func (s *InvoiceService) fetchPayments(invoiceID string) ([]models.Payment, error) {
	rows, err := s.DB.Query(context.Background(), `
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
	`, invoiceID)
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

		payments = append(payments, p)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return payments, nil
}

// ============================================================
// FETCH REMINDERS
// ============================================================

func (s *InvoiceService) fetchReminders(invoiceID string) ([]models.Reminder, error) {
	rows, err := s.DB.Query(context.Background(), `
		SELECT
			id,
			invoice_id,
			reminder_type,
			scheduled_at,
			sent_at,
			status,
			created_at
		FROM reminders
		WHERE invoice_id = $1
		ORDER BY scheduled_at ASC
	`, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reminders []models.Reminder

	for rows.Next() {
		var r models.Reminder

		err := rows.Scan(
			&r.ID,
			&r.InvoiceID,
			&r.ReminderType,
			&r.ScheduledAt,
			&r.SentAt,
			&r.Status,
			&r.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		reminders = append(reminders, r)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return reminders, nil
}

// ============================================================
// FETCH ACTIVITY LOGS
// ============================================================

func (s *InvoiceService) fetchActivityLogs(invoiceID string) ([]models.ActivityLog, error) {
	rows, err := s.DB.Query(context.Background(), `
		SELECT
			id,
			invoice_id,
			actor_type,
			action,
			description,
			created_at
		FROM activity_logs
		WHERE invoice_id = $1
		ORDER BY created_at ASC
	`, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var logs []models.ActivityLog

	for rows.Next() {
		var l models.ActivityLog

		err := rows.Scan(
			&l.ID,
			&l.InvoiceID,
			&l.ActorType,
			&l.Action,
			&l.Description,
			&l.CreatedAt,
		)
		if err != nil {
			return nil, err
		}

		logs = append(logs, l)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return logs, nil
}

// ============================================================
// GET ALL INVOICES
// ============================================================

func (s *InvoiceService) GetInvoices() ([]models.Invoice, error) {
	rows, err := s.DB.Query(context.Background(), `
		SELECT
			id,
			invoice_number,
			client_id,
			invoice_date,
			due_date,
			sent_at,
			subtotal,
			tax,
			total,
			status,
			notes,
			created_by,
			created_at,
			updated_at
		FROM invoices
		ORDER BY created_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var invoices []models.Invoice

	for rows.Next() {
		var invoice models.Invoice

		err := rows.Scan(
			&invoice.ID,
			&invoice.InvoiceNumber,
			&invoice.ClientID,
			&invoice.InvoiceDate,
			&invoice.DueDate,
			&invoice.SentAt,
			&invoice.Subtotal,
			&invoice.Tax,
			&invoice.Total,
			&invoice.Status,
			&invoice.Notes,
			&invoice.CreatedBy,
			&invoice.CreatedAt,
			&invoice.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}

		// =========================
		// ITEMS
		// =========================

		invoice.Items, err = s.fetchItems(invoice.ID)
		if err != nil {
			return nil, err
		}

		if invoice.Items == nil {
			invoice.Items = []models.InvoiceItem{}
		}

		// =========================
		// PAYMENTS
		// =========================

		invoice.Payments, err = s.fetchPayments(invoice.ID)
		if err != nil {
			return nil, err
		}

		if invoice.Payments == nil {
			invoice.Payments = []models.Payment{}
		}

		// =========================
		// REMINDERS
		// =========================

		invoice.Reminders, err = s.fetchReminders(invoice.ID)
		if err != nil {
			return nil, err
		}

		if invoice.Reminders == nil {
			invoice.Reminders = []models.Reminder{}
		}

		// =========================
		// ACTIVITY LOGS
		// =========================

		invoice.ActivityLogs, err = s.fetchActivityLogs(invoice.ID)
		if err != nil {
			return nil, err
		}

		if invoice.ActivityLogs == nil {
			invoice.ActivityLogs = []models.ActivityLog{}
		}

		invoices = append(invoices, invoice)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return invoices, nil
}

// ============================================================
// GET INVOICE BY ID
// ============================================================

func (s *InvoiceService) GetInvoiceByID(id string) (*models.Invoice, error) {
	var invoice models.Invoice

	err := s.DB.QueryRow(context.Background(), `
		SELECT
			id,
			invoice_number,
			client_id,
			invoice_date,
			due_date,
			sent_at,
			subtotal,
			tax,
			total,
			status,
			notes,
			created_by,
			created_at,
			updated_at
		FROM invoices
		WHERE id = $1
	`, id).Scan(
		&invoice.ID,
		&invoice.InvoiceNumber,
		&invoice.ClientID,
		&invoice.InvoiceDate,
		&invoice.DueDate,
		&invoice.SentAt,
		&invoice.Subtotal,
		&invoice.Tax,
		&invoice.Total,
		&invoice.Status,
		&invoice.Notes,
		&invoice.CreatedBy,
		&invoice.CreatedAt,
		&invoice.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// =========================
	// ITEMS
	// =========================

	invoice.Items, err = s.fetchItems(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.Items == nil {
		invoice.Items = []models.InvoiceItem{}
	}

	// =========================
	// PAYMENTS
	// =========================

	invoice.Payments, err = s.fetchPayments(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.Payments == nil {
		invoice.Payments = []models.Payment{}
	}

	// =========================
	// REMINDERS
	// =========================

	invoice.Reminders, err = s.fetchReminders(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.Reminders == nil {
		invoice.Reminders = []models.Reminder{}
	}

	// =========================
	// ACTIVITY LOGS
	// =========================

	invoice.ActivityLogs, err = s.fetchActivityLogs(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.ActivityLogs == nil {
		invoice.ActivityLogs = []models.ActivityLog{}
	}

	// =========================
	// CLIENT (untuk halaman invoice publik)
	// =========================

	var client models.Client
	err = s.DB.QueryRow(context.Background(), `
		SELECT
			id,
			company_name,
			pic_name,
			email,
			phone,
			address,
			status
		FROM clients
		WHERE id = $1
	`, invoice.ClientID).Scan(
		&client.ID,
		&client.CompanyName,
		&client.PICName,
		&client.Email,
		&client.Phone,
		&client.Address,
		&client.Status,
	)
	if err == nil {
		invoice.Client = &client
	} else if err != pgx.ErrNoRows {
		return nil, err
	}

	return &invoice, nil
}

// ============================================================
// CREATE INVOICE
// ============================================================

func (s *InvoiceService) CreateInvoice(req models.CreateInvoiceRequest) (*models.Invoice, error) {
	if len(req.Items) == 0 {
		return nil, fmt.Errorf("invoice harus memiliki minimal 1 item")
	}

	tx, err := s.DB.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())

	var subtotal float64

	type enrichedItem struct {
		productID string
		quantity  int
		price     float64
		subtotal  float64
	}

	var eItems []enrichedItem

	for _, item := range req.Items {
		var price float64

		err := tx.QueryRow(
			context.Background(),
			`SELECT price FROM products WHERE id = $1`,
			item.ProductID,
		).Scan(&price)

		if err != nil {
			return nil, fmt.Errorf(
				"product %s tidak ditemukan",
				item.ProductID,
			)
		}

		itemSub := price * float64(item.Quantity)

		subtotal += itemSub

		eItems = append(eItems, enrichedItem{
			productID: item.ProductID,
			quantity:  item.Quantity,
			price:     price,
			subtotal:  itemSub,
		})
	}

	// Tax 10%
	tax := math.Round(subtotal * 0.1)

	total := subtotal + tax

	// Auto-generate invoice number jika tidak dikirim
	invoiceNumber := req.InvoiceNumber
	if invoiceNumber == "" {
		year := time.Now().Year()

		if t, perr := time.Parse(time.RFC3339, req.InvoiceDate); perr == nil {
			year = t.Year()
		} else if t, perr := time.Parse("2006-01-02", req.InvoiceDate); perr == nil {
			year = t.Year()
		}

		var maxSeq int

		err := tx.QueryRow(context.Background(), `
			SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 'INV-[0-9]{4}-([0-9]+)') AS INTEGER)), 0)
			FROM invoices
			WHERE invoice_number LIKE $1
		`, fmt.Sprintf("INV-%d-%%", year)).Scan(&maxSeq)
		if err != nil {
			return nil, err
		}

		invoiceNumber = fmt.Sprintf("INV-%d-%03d", year, maxSeq+1)
	}

	var invoice models.Invoice

	err = tx.QueryRow(context.Background(), `
		INSERT INTO invoices (
			invoice_number,
			client_id,
			invoice_date,
			due_date,
			sent_at,
			subtotal,
			tax,
			total,
			status,
			notes,
			created_by
		)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
		RETURNING
			id,
			invoice_number,
			client_id,
			invoice_date,
			due_date,
			sent_at,
			subtotal,
			tax,
			total,
			status,
			notes,
			created_by,
			created_at,
			updated_at
	`,
		invoiceNumber,
		req.ClientID,
		req.InvoiceDate,
		req.DueDate,
		nil,
		subtotal,
		tax,
		total,
		req.Status,
		req.Notes,
		req.CreatedBy,
	).Scan(
		&invoice.ID,
		&invoice.InvoiceNumber,
		&invoice.ClientID,
		&invoice.InvoiceDate,
		&invoice.DueDate,
		&invoice.SentAt,
		&invoice.Subtotal,
		&invoice.Tax,
		&invoice.Total,
		&invoice.Status,
		&invoice.Notes,
		&invoice.CreatedBy,
		&invoice.CreatedAt,
		&invoice.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Insert invoice items
	for _, ei := range eItems {
		_, err := tx.Exec(context.Background(), `
			INSERT INTO invoice_items (
				invoice_id,
				product_id,
				quantity,
				price,
				subtotal
			)
			VALUES ($1,$2,$3,$4,$5)
		`,
			invoice.ID,
			ei.productID,
			ei.quantity,
			ei.price,
			ei.subtotal,
		)

		if err != nil {
			return nil, err
		}
	}

	// Invoice yang dibuat langsung dengan status aktif ditagih (SENT/UNPAID)
	// langsung mendapatkan reminder. sent_at hanya dicatat untuk SENT karena
	// menandai invoice benar-benar sudah dikirim ke client.
	if invoice.Status == "SENT" || invoice.Status == "UNPAID" {
		if invoice.Status == "SENT" && invoice.SentAt == nil {
			sentAt := time.Now()
			_, err = tx.Exec(context.Background(),
				`UPDATE invoices SET sent_at = $1 WHERE id = $2`,
				sentAt, invoice.ID,
			)
			if err != nil {
				return nil, err
			}
			invoice.SentAt = &sentAt
		}

		err = CreateRemindersForInvoice(
			context.Background(),
			tx,
			invoice.ID,
			invoice.CreatedAt,
			invoice.DueDate,
		)
		if err != nil {
			return nil, err
		}
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return nil, err
	}

	if invoice.Status == "SENT" && s.WhatsApp != nil {
		go SendInvoiceCreatedWhatsApp(s.DB, s.WhatsApp, s.PDF, invoice.ID)
	}

	invoice.Items, err = s.fetchItems(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.Items == nil {
		invoice.Items = []models.InvoiceItem{}
	}

	invoice.Payments, err = s.fetchPayments(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.Payments == nil {
		invoice.Payments = []models.Payment{}
	}

	invoice.Reminders, err = s.fetchReminders(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.Reminders == nil {
		invoice.Reminders = []models.Reminder{}
	}

	invoice.ActivityLogs, err = s.fetchActivityLogs(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.ActivityLogs == nil {
		invoice.ActivityLogs = []models.ActivityLog{}
	}

	return &invoice, nil
}

// ============================================================
// UPDATE INVOICE
// ============================================================

func (s *InvoiceService) UpdateInvoice(
	id string,
	req models.UpdateInvoiceRequest,
) (*models.Invoice, error) {

	if len(req.Items) == 0 {
		return nil, fmt.Errorf("invoice harus memiliki minimal 1 item")
	}

	tx, err := s.DB.Begin(context.Background())
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(context.Background())

	// Simpan status & due_date sebelumnya untuk mendeteksi transisi
	// keluar DRAFT dan perubahan due_date
	var previousStatus string
	var previousDueDate time.Time
	err = tx.QueryRow(
		context.Background(),
		`SELECT status, due_date FROM invoices WHERE id = $1`,
		id,
	).Scan(&previousStatus, &previousDueDate)
	if err != nil {
		return nil, err
	}

	var subtotal float64

	type enrichedItem struct {
		productID string
		quantity  int
		price     float64
		subtotal  float64
	}

	var eItems []enrichedItem

	for _, item := range req.Items {
		var price float64

		err := tx.QueryRow(
			context.Background(),
			`SELECT price FROM products WHERE id = $1`,
			item.ProductID,
		).Scan(&price)

		if err != nil {
			return nil, fmt.Errorf(
				"product %s tidak ditemukan",
				item.ProductID,
			)
		}

		itemSub := price * float64(item.Quantity)

		subtotal += itemSub

		eItems = append(eItems, enrichedItem{
			productID: item.ProductID,
			quantity:  item.Quantity,
			price:     price,
			subtotal:  itemSub,
		})
	}

	// Tax 10%
	tax := math.Round(subtotal * 0.1)

	total := subtotal + tax

	var invoice models.Invoice

	err = tx.QueryRow(context.Background(), `
		UPDATE invoices
		SET
			invoice_number = $1,
			client_id = $2,
			invoice_date = $3,
			due_date = $4,
			subtotal = $5,
			tax = $6,
			total = $7,
			status = $8,
			notes = $9,
			updated_at = now()
		WHERE id = $10
		RETURNING
			id,
			invoice_number,
			client_id,
			invoice_date,
			due_date,
			sent_at,
			subtotal,
			tax,
			total,
			status,
			notes,
			created_by,
			created_at,
			updated_at
	`,
		req.InvoiceNumber,
		req.ClientID,
		req.InvoiceDate,
		req.DueDate,
		subtotal,
		tax,
		total,
		req.Status,
		req.Notes,
		id,
	).Scan(
		&invoice.ID,
		&invoice.InvoiceNumber,
		&invoice.ClientID,
		&invoice.InvoiceDate,
		&invoice.DueDate,
		&invoice.SentAt,
		&invoice.Subtotal,
		&invoice.Tax,
		&invoice.Total,
		&invoice.Status,
		&invoice.Notes,
		&invoice.CreatedBy,
		&invoice.CreatedAt,
		&invoice.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}

	// Hapus item lama
	_, err = tx.Exec(
		context.Background(),
		`DELETE FROM invoice_items WHERE invoice_id = $1`,
		id,
	)
	if err != nil {
		return nil, err
	}

	// Insert item baru
	for _, ei := range eItems {
		_, err := tx.Exec(context.Background(), `
			INSERT INTO invoice_items (
				invoice_id,
				product_id,
				quantity,
				price,
				subtotal
			)
			VALUES ($1,$2,$3,$4,$5)
		`,
			invoice.ID,
			ei.productID,
			ei.quantity,
			ei.price,
			ei.subtotal,
		)

		if err != nil {
			return nil, err
		}
	}

	// Reminder dibuat/dilengkapi set saat invoice pertama kali masuk status
	// aktif ditagih (SENT atau UNPAID), mencakup transisi DRAFT -> SENT,
	// DRAFT -> UNPAID, pembukaan invoice lama yang belum pernah aktif,
	// atau pembaruan status PAID/CANCELLED ke SENT/UNPAID. Invoice yang
	// sebelumnya CANCELLED tidak dihidupkan kembali reminder-nya.
	billable := invoice.Status == "SENT" || invoice.Status == "UNPAID"
	wasBillable := previousStatus == "SENT" || previousStatus == "UNPAID"
	terminal := previousStatus == "PAID" || previousStatus == "CANCELLED"
	if billable && !wasBillable && !terminal {
		if invoice.Status == "SENT" && invoice.SentAt == nil {
			sentAt := time.Now()
			_, err = tx.Exec(context.Background(),
				`UPDATE invoices SET sent_at = $1 WHERE id = $2`,
				sentAt, id,
			)
			if err != nil {
				return nil, err
			}
			invoice.SentAt = &sentAt
		}

		err = CreateRemindersForInvoice(
			context.Background(),
			tx,
			invoice.ID,
			invoice.CreatedAt,
			invoice.DueDate,
		)
		if err != nil {
			return nil, err
		}
	}

	// Jika invoice sudah dikirim (sent_at sudah ada) dan due_date berubah,
	// hitung ulang jadwal reminder yang belum dikirim menggunakan created_at
	// sebagai batas. History reminder yang sudah SENT tidak diubah.
	if invoice.SentAt != nil && !invoice.DueDate.Equal(previousDueDate) {
		err = RescheduleRemindersForInvoice(
			context.Background(),
			tx,
			invoice.ID,
			invoice.CreatedAt,
			invoice.DueDate,
		)
		if err != nil {
			return nil, err
		}
	}

	// Invoice PAID/CANCELLED: hentikan semua reminder yang belum dikirim
	// (PENDING/FAILED -> SKIPPED). History yang sudah SENT tetap dipertahankan.
	if invoice.Status == "PAID" || invoice.Status == "CANCELLED" {
		_, err = tx.Exec(context.Background(), `
			UPDATE reminders
			SET status = 'SKIPPED'
			WHERE invoice_id = $1 AND sent_at IS NULL AND status IN ('PENDING', 'FAILED')
		`, id)
		if err != nil {
			return nil, err
		}
	}

	err = tx.Commit(context.Background())
	if err != nil {
		return nil, err
	}

	if previousStatus == "DRAFT" && invoice.Status == "SENT" && s.WhatsApp != nil {
		go SendInvoiceCreatedWhatsApp(s.DB, s.WhatsApp, s.PDF, invoice.ID)
	}

	// Ambil kembali seluruh relasi
	invoice.Items, err = s.fetchItems(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.Items == nil {
		invoice.Items = []models.InvoiceItem{}
	}

	invoice.Payments, err = s.fetchPayments(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.Payments == nil {
		invoice.Payments = []models.Payment{}
	}

	invoice.Reminders, err = s.fetchReminders(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.Reminders == nil {
		invoice.Reminders = []models.Reminder{}
	}

	invoice.ActivityLogs, err = s.fetchActivityLogs(invoice.ID)
	if err != nil {
		return nil, err
	}

	if invoice.ActivityLogs == nil {
		invoice.ActivityLogs = []models.ActivityLog{}
	}

	return &invoice, nil
}

// ============================================================
// DELETE INVOICE
// ============================================================

func (s *InvoiceService) DeleteInvoice(id string) error {

	// Hapus data yang berhubungan terlebih dahulu
	_, err := s.DB.Exec(
		context.Background(),
		`DELETE FROM reminders WHERE invoice_id = $1`,
		id,
	)
	if err != nil {
		return err
	}

	_, err = s.DB.Exec(
		context.Background(),
		`DELETE FROM payments WHERE invoice_id = $1`,
		id,
	)
	if err != nil {
		return err
	}

	_, err = s.DB.Exec(
		context.Background(),
		`DELETE FROM activity_logs WHERE invoice_id = $1`,
		id,
	)
	if err != nil {
		return err
	}

	_, err = s.DB.Exec(
		context.Background(),
		`DELETE FROM invoice_items WHERE invoice_id = $1`,
		id,
	)
	if err != nil {
		return err
	}

	_, err = s.DB.Exec(
		context.Background(),
		`DELETE FROM invoices WHERE id = $1`,
		id,
	)

	return err
}
