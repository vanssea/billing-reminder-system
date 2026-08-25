package models

import "time"

// AppNotification adalah notifikasi dalam aplikasi (lonceng di Header)
// untuk role internal: SUPERADMIN dan ADMIN. Bukan pesan WhatsApp ke client.
type AppNotification struct {
	ID          int64      `json:"id"`
	Type        string     `json:"type"`
	Title       string     `json:"title"`
	Message     string     `json:"message"`
	ReferenceID *string    `json:"reference_id,omitempty"`
	TargetRole  string     `json:"target_role"`
	// TargetProfileID hanya terisi saat TargetRole = CLIENT:
	// membatasi notifikasi ke satu client tertentu.
	TargetProfileID string    `json:"-"`
	IsRead          bool      `json:"is_read"`
	CreatedAt       time.Time `json:"created_at"`
}

// Nilai kolom type yang dikenal sistem.
const (
	NotifTypePaymentApproved = "PAYMENT_APPROVED"
	NotifTypePaymentRejected = "PAYMENT_REJECTED"
	NotifTypeInvoiceOverdue  = "INVOICE_OVERDUE"
	NotifTypeReminderFailed  = "REMINDER_FAILED"
)

// Nilai kolom target_role.
const (
	NotifRoleSuperadmin = "SUPERADMIN"
	NotifRoleAdmin      = "ADMIN"
	NotifRoleClient     = "CLIENT"
	NotifRoleAll        = "ALL"
)
