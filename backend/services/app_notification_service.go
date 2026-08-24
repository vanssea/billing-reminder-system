package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"billing-reminder-system/models"

	"github.com/jackc/pgx/v5/pgxpool"
)

// AppNotificationService mengelola notifikasi dalam aplikasi (lonceng)
// untuk role internal SUPERADMIN/ADMIN. File ini terpisah dari
// notification_service.go yang khusus pesan WhatsApp ke client.
type AppNotificationService struct {
	DB *pgxpool.Pool
}

func NewAppNotificationService(db *pgxpool.Pool) *AppNotificationService {
	return &AppNotificationService{DB: db}
}

func (s *AppNotificationService) insert(ctx context.Context, n *models.AppNotification) error {
	_, err := s.DB.Exec(ctx, `
		INSERT INTO app_notifications (type, title, message, reference_id, target_role, target_profile_id)
		VALUES ($1, $2, $3, NULLIF($4, ''), $5, $6)
	`, n.Type, n.Title, n.Message, derefOrEmpty(n.ReferenceID), n.TargetRole, n.TargetProfileID)
	return err
}

// insertOnce menyisipkan notifikasi hanya jika belum ada notifikasi dengan
// type + reference_id yang sama dalam jendela waktu tertentu, untuk mencegah
// spam pada event yang bisa terulang (mis. reminder gagal berulang kali).
func (s *AppNotificationService) insertOnce(ctx context.Context, n *models.AppNotification, window time.Duration) error {
	cutoff := time.Now().Add(-window)

	var exists bool
	err := s.DB.QueryRow(ctx, `
		SELECT EXISTS (
			SELECT 1 FROM app_notifications
			WHERE type = $1
			  AND reference_id IS NOT DISTINCT FROM NULLIF($2, '')
			  AND created_at > $3
		)
	`, n.Type, derefOrEmpty(n.ReferenceID), cutoff).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}
	return s.insert(ctx, n)
}

func (s *AppNotificationService) List(ctx context.Context, roles []string, limit int, profileID string) ([]models.AppNotification, error) {
	if limit <= 0 || limit > 50 {
		limit = 15
	}

	rows, err := s.DB.Query(ctx, `
		SELECT id, type, title, message, reference_id, target_role, is_read, created_at
		FROM app_notifications
		WHERE target_role = ANY($1::text[])
		  AND ($2::text = '' OR target_profile_id IN ('', $2))
		ORDER BY created_at DESC
		LIMIT $3
	`, roles, profileID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var result []models.AppNotification
	for rows.Next() {
		var n models.AppNotification
		if err := rows.Scan(&n.ID, &n.Type, &n.Title, &n.Message, &n.ReferenceID, &n.TargetRole, &n.IsRead, &n.CreatedAt); err != nil {
			return nil, err
		}
		result = append(result, n)
	}
	return result, rows.Err()
}

func (s *AppNotificationService) CountUnread(ctx context.Context, roles []string, profileID string) (int64, error) {
	var count int64
	err := s.DB.QueryRow(ctx, `
		SELECT COUNT(*) FROM app_notifications
		WHERE target_role = ANY($1::text[])
		  AND ($2::text = '' OR target_profile_id IN ('', $2))
		  AND is_read = FALSE
	`, roles, profileID).Scan(&count)
	return count, err
}

// MarkRead menandai satu notifikasi dibaca, hanya jika notifikasi tersebut
// berada dalam scope role/profile peminta (ownership check).
func (s *AppNotificationService) MarkRead(ctx context.Context, id int64, roles []string, profileID string) (int64, error) {
	tag, err := s.DB.Exec(ctx, `
		UPDATE app_notifications SET is_read = TRUE
		WHERE id = $1
		  AND target_role = ANY($2::text[])
		  AND ($3::text = '' OR target_profile_id IN ('', $3))
	`, id, roles, profileID)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

func (s *AppNotificationService) MarkAllRead(ctx context.Context, roles []string, profileID string) (int64, error) {
	tag, err := s.DB.Exec(ctx, `
		UPDATE app_notifications SET is_read = TRUE
		WHERE target_role = ANY($1::text[])
		  AND ($2::text = '' OR target_profile_id IN ('', $2))
		  AND is_read = FALSE
	`, roles, profileID)
	if err != nil {
		return 0, err
	}
	return tag.RowsAffected(), nil
}

// ============================================================
// PRODUCER EVENT — dipanggil sebagai goroutine dari titik event
// ============================================================

type appPaymentEventData struct {
	InvoiceNumber   string
	ClientCompany   string
	ClientProfileID string
	Amount          float64
	Status          string
}

func fetchAppPaymentData(ctx context.Context, db *pgxpool.Pool, paymentID string) (*appPaymentEventData, error) {
	var d appPaymentEventData
	err := db.QueryRow(ctx, `
		SELECT i.invoice_number, c.company_name, COALESCE(c.profile_id::text, ''), p.amount, p.status
		FROM payments p
		JOIN invoices i ON i.id = p.invoice_id
		JOIN clients c ON c.id = i.client_id
		WHERE p.id = $1
	`, paymentID).Scan(&d.InvoiceNumber, &d.ClientCompany, &d.ClientProfileID, &d.Amount, &d.Status)
	if err != nil {
		return nil, err
	}
	return &d, nil
}

// NotifyPaymentApproved membuat notifikasi lonceng saat pembayaran disetujui.
func NotifyPaymentApproved(db *pgxpool.Pool, paymentID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	svc := &AppNotificationService{DB: db}

	d, err := fetchAppPaymentData(ctx, db, paymentID)
	if err != nil {
		log.Printf("Notifikasi payment approved gagal untuk payment %s: %v", paymentID, err)
		return
	}

	n := &models.AppNotification{
		Type:        models.NotifTypePaymentApproved,
		Title:       "Pembayaran Disetujui",
		Message: fmt.Sprintf(
			"Pembayaran invoice %s dari %s sebesar %s telah disetujui. Invoice berstatus PAID.",
			d.InvoiceNumber, d.ClientCompany, formatRupiah(d.Amount),
		),
		ReferenceID: strPtr(paymentID),
		TargetRole:  models.NotifRoleAll,
	}

	if err := svc.insert(ctx, n); err != nil {
		log.Printf("Gagal menyimpan notifikasi payment approved (%s): %v", paymentID, err)
	}

	if d.ClientProfileID != "" {
		clientNotif := &models.AppNotification{
			Type:  models.NotifTypePaymentApproved,
			Title: "Pembayaran Disetujui",
			Message: fmt.Sprintf(
				"Pembayaran Anda untuk invoice %s sebesar %s telah disetujui. Invoice berstatus lunas.",
				d.InvoiceNumber, formatRupiah(d.Amount),
			),
			ReferenceID:     strPtr(paymentID),
			TargetRole:      models.NotifRoleClient,
			TargetProfileID: d.ClientProfileID,
		}

		if err := svc.insert(ctx, clientNotif); err != nil {
			log.Printf("Gagal menyimpan notifikasi client payment approved (%s): %v", paymentID, err)
		}
	}
}

// NotifyPaymentRejected membuat notifikasi lonceng saat pembayaran ditolak.
func NotifyPaymentRejected(db *pgxpool.Pool, paymentID, reason string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	svc := &AppNotificationService{DB: db}

	d, err := fetchAppPaymentData(ctx, db, paymentID)
	if err != nil {
		log.Printf("Notifikasi payment rejected gagal untuk payment %s: %v", paymentID, err)
		return
	}

	message := fmt.Sprintf(
		"Pembayaran invoice %s dari %s sebesar %s ditolak.",
		d.InvoiceNumber, d.ClientCompany, formatRupiah(d.Amount),
	)
	if strings.TrimSpace(reason) != "" {
		message += " Alasan: " + strings.TrimSpace(reason)
	}

	n := &models.AppNotification{
		Type:        models.NotifTypePaymentRejected,
		Title:       "Pembayaran Ditolak",
		Message:     message,
		ReferenceID: strPtr(paymentID),
		TargetRole:  models.NotifRoleAll,
	}

	if err := svc.insert(ctx, n); err != nil {
		log.Printf("Gagal menyimpan notifikasi payment rejected (%s): %v", paymentID, err)
	}

	if d.ClientProfileID != "" {
		clientMessage := fmt.Sprintf(
			"Pembayaran Anda untuk invoice %s sebesar %s ditolak.",
			d.InvoiceNumber, formatRupiah(d.Amount),
		)
		if strings.TrimSpace(reason) != "" {
			clientMessage += " Alasan: " + strings.TrimSpace(reason)
		}

		clientNotif := &models.AppNotification{
			Type:            models.NotifTypePaymentRejected,
			Title:           "Pembayaran Ditolak",
			Message:         clientMessage,
			ReferenceID:     strPtr(paymentID),
			TargetRole:      models.NotifRoleClient,
			TargetProfileID: d.ClientProfileID,
		}

		if err := svc.insert(ctx, clientNotif); err != nil {
			log.Printf("Gagal menyimpan notifikasi client payment rejected (%s): %v", paymentID, err)
		}
	}
}

// NotifyReminderFailed membuat notifikasi lonceng saat reminder WhatsApp
// gagal terkirim. Menggunakan dedup 6 jam agar retry yang gagal berulang
// tidak membanjiri daftar notifikasi.
func NotifyReminderFailed(db *pgxpool.Pool, reminderID string) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	svc := &AppNotificationService{DB: db}

	var invoiceNumber, reminderType, errMsg string
	err := db.QueryRow(ctx, `
		SELECT i.invoice_number, r.reminder_type, COALESCE(r.error_message, '')
		FROM reminders r
		JOIN invoices i ON i.id = r.invoice_id
		WHERE r.id = $1
	`, reminderID).Scan(&invoiceNumber, &reminderType, &errMsg)
	if err != nil {
		log.Printf("Notifikasi reminder failed gagal untuk reminder %s: %v", reminderID, err)
		return
	}

	message := fmt.Sprintf("Reminder %s untuk invoice %s gagal terkirim.", reminderType, invoiceNumber)
	if strings.TrimSpace(errMsg) != "" {
		message += " Penyebab: " + strings.TrimSpace(errMsg)
	}

	n := &models.AppNotification{
		Type:        models.NotifTypeReminderFailed,
		Title:       "Reminder Gagal Terkirim",
		Message:     message,
		ReferenceID: strPtr(reminderID),
		TargetRole:  models.NotifRoleSuperadmin,
	}

	if err := svc.insertOnce(ctx, n, 6*time.Hour); err != nil {
		log.Printf("Gagal menyimpan notifikasi reminder failed (%s): %v", reminderID, err)
	}
}

func derefOrEmpty(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func strPtr(s string) *string {
	return &s
}
