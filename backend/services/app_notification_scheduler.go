package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"billing-reminder-system/models"
)

// appOverdueWatcherInterval adalah jarak pemeriksaan invoice yang baru
// berstatus OVERDUE untuk dibuatkan notifikasi lonceng.
const appOverdueWatcherInterval = 60 * time.Second

// StartOverdueWatcher menjalankan loop background yang membuat notifikasi
// INVOICE_OVERDUE untuk setiap invoice yang belum pernah dinotifikasikan.
// Dedup memakai existence check pada reference_id sehingga aman dari
// duplikat walau server restart. Loop ini terpisah dari reminder scheduler
// milik notification_service.go agar tidak saling tergantung.
func (s *AppNotificationService) StartOverdueWatcher(ctx context.Context) {
	ticker := time.NewTicker(appOverdueWatcherInterval)
	defer ticker.Stop()

	s.notifyNewOverdueInvoices(ctx)
	for {
		select {
		case <-ctx.Done():
			log.Println("App notification overdue watcher berhenti.")
			return
		case <-ticker.C:
			s.notifyNewOverdueInvoices(ctx)
		}
	}
}

type appOverdueRow struct {
	ID      string
	Number  string
	Company string
	Total   float64
	Due     time.Time
}

func (s *AppNotificationService) notifyNewOverdueInvoices(ctx context.Context) {
	rows, err := s.DB.Query(ctx, `
		SELECT i.id::text, i.invoice_number, c.company_name, i.total, i.due_date
		FROM invoices i
		JOIN clients c ON c.id = i.client_id
		WHERE i.status = 'OVERDUE'
		  AND NOT EXISTS (
			SELECT 1 FROM app_notifications n
			WHERE n.type = $1 AND n.reference_id = i.id::text
		  )
		ORDER BY i.due_date ASC
		LIMIT 25
	`, models.NotifTypeInvoiceOverdue)
	if err != nil {
		log.Println("Overdue watcher gagal mengambil data:", err)
		return
	}
	defer rows.Close()

	var items []appOverdueRow
	for rows.Next() {
		var r appOverdueRow
		if err := rows.Scan(&r.ID, &r.Number, &r.Company, &r.Total, &r.Due); err != nil {
			log.Println("Overdue watcher gagal membaca baris:", err)
			return
		}
		items = append(items, r)
	}
	if err := rows.Err(); err != nil {
		log.Println("Overdue watcher error iterasi:", err)
		return
	}

	for _, it := range items {
		n := &models.AppNotification{
			Type: models.NotifTypeInvoiceOverdue,
			Title: "Invoice Melewati Jatuh Tempo",
			Message: fmt.Sprintf(
				"Invoice %s dari %s sebesar %s telah melewati jatuh tempo %s.",
				it.Number, it.Company, formatRupiah(it.Total), formatTanggalIndo(it.Due),
			),
			ReferenceID: strPtr(it.ID),
			TargetRole:  models.NotifRoleAll,
		}

		if err := s.insert(ctx, n); err != nil {
			log.Printf("Gagal menyimpan notifikasi overdue (%s): %v", it.Number, err)
		}
	}
}
