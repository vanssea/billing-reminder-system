package services

import (
	"context"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// InvoiceData adalah seluruh data yang dibutuhkan untuk membuat PDF invoice
// dan menyusun pesan reminder WhatsApp.
type InvoiceData struct {
	InvoiceNumber string
	InvoiceDate   time.Time
	DueDate       time.Time
	Status        string
	Subtotal      float64
	Tax           float64
	Discount      float64 // kolom discount belum ada di DB, selalu 0
	Total         float64

	ClientCompany string
	ClientPIC     string
	ClientEmail   string
	ClientAddress string
	ClientPhone   string

	Items []InvoiceItemData
}

// InvoiceItemData adalah satu baris item pada tabel invoice.
type InvoiceItemData struct {
	Name  string
	Qty   int
	Price float64
	Total float64
}

// getInvoiceData mengambil data invoice beserta client dan item-itemnya
// dari database dalam satu struct siap pakai.
func getInvoiceData(ctx context.Context, db *pgxpool.Pool, invoiceID string) (*InvoiceData, error) {
	var d InvoiceData

	err := db.QueryRow(ctx, `
		SELECT
			i.invoice_number,
			i.invoice_date,
			i.due_date,
			i.status,
			i.subtotal,
			i.tax,
			i.total,
			c.company_name,
			c.pic_name,
			COALESCE(c.email, ''),
			COALESCE(c.address, ''),
			COALESCE(c.phone, '')
		FROM invoices i
		INNER JOIN clients c ON c.id = i.client_id
		WHERE i.id = $1
	`, invoiceID).Scan(
		&d.InvoiceNumber,
		&d.InvoiceDate,
		&d.DueDate,
		&d.Status,
		&d.Subtotal,
		&d.Tax,
		&d.Total,
		&d.ClientCompany,
		&d.ClientPIC,
		&d.ClientEmail,
		&d.ClientAddress,
		&d.ClientPhone,
	)
	if err != nil {
		return nil, err
	}

	rows, err := db.Query(ctx, `
		SELECT
			p.name,
			ii.quantity,
			ii.price,
			ii.subtotal
		FROM invoice_items ii
		INNER JOIN products p ON p.id = ii.product_id
		WHERE ii.invoice_id = $1
		ORDER BY ii.created_at ASC
	`, invoiceID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item InvoiceItemData
		if err := rows.Scan(&item.Name, &item.Qty, &item.Price, &item.Total); err != nil {
			return nil, err
		}
		d.Items = append(d.Items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return &d, nil
}
