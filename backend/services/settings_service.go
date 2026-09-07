package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Settings V1: pengaturan global yang disimpan di database (tabel app_settings).
// Grup yang didukung saat ini hanya "reminder_settings":
//   - enabled_types : tipe reminder yang aktif (subset dari reminderTypeOffsets).
//   - send_time     : jam kirim global "HH:MM" (Asia/Jakarta).
//
// Aturan penting (disepakati):
//   - Tipe yang dinonaktifkan TIDAK menghapus record reminder (history dipertahankan);
//     scheduler cukup mem-filter reminder_type di query-nya.
//   - Perubahan send_time hanya menggeser reminder berstatus PENDING yang belum terkirim
//     (sent_at IS NULL). SENT, SKIPPED, dan FAILED tidak disentuh; FAILED tetap
//     menunggu mekanisme Retry manual.

const (
	reminderSettingsKey = "reminder_settings"
	defaultSendTime     = "08:00"
)

// queryRower mencakup panggilan QueryRow untuk membaca 1 baris.
// Dipenuhi oleh *pgxpool.Pool dan pgx.Tx.
type queryRower interface {
	QueryRow(ctx context.Context, sql string, args ...any) pgx.Row
}

type ReminderSettings struct {
	EnabledTypes []string `json:"enabled_types"`
	SendTime     string   `json:"send_time"`
	EmailEnabled *bool    `json:"email_enabled,omitempty"`
}

type ReminderTypeInfo struct {
	Type string `json:"type"`
	Days int    `json:"days"`
}

// ReminderSettingsView adalah response untuk frontend.
// Menyertakan daftar tipe yang valid agar UI tidak perlu hardcode label.
type ReminderSettingsView struct {
	EnabledTypes []string           `json:"enabled_types"`
	SendTime     string             `json:"send_time"`
	EmailEnabled bool               `json:"email_enabled"`
	Types        []ReminderTypeInfo `json:"types"`
}

func NewSettingsService(db *pgxpool.Pool) *SettingsService {
	return &SettingsService{DB: db}
}

type SettingsService struct {
	DB *pgxpool.Pool
}

// parseSendTime memvalidasi format "HH:MM" dan mengembalikan jam+menit.
func parseSendTime(s string) (hour, minute int, err error) {
	s = strings.TrimSpace(s)
	if len(s) != 5 || s[2] != ':' {
		return 0, 0, errors.New("send_time harus berformat HH:MM")
	}
	h, herr := strconv.Atoi(s[0:2])
	m, merr := strconv.Atoi(s[3:5])
	if herr != nil || merr != nil {
		return 0, 0, errors.New("send_time harus berformat HH:MM")
	}
	if h < 0 || h > 23 || m < 0 || m > 59 {
		return 0, 0, errors.New("send_time di luar rentang 00:00-23:59")
	}
	return h, m, nil
}

// defaultReminderSettings mengembalikan settings default = perilaku lama:
// semua tipe aktif pada pukul 08:00 WIB.
func defaultReminderSettings() ReminderSettings {
	enabled := make([]string, 0, len(reminderTypeOffsets))
	for _, rt := range reminderTypeOffsets {
		enabled = append(enabled, rt.Type)
	}
	emailEnabled := true
	return ReminderSettings{
		EnabledTypes: enabled,
		SendTime:     defaultSendTime,
		EmailEnabled: &emailEnabled,
	}
}

// getReminderSettings membaca reminder_settings dari app_settings.
// Jika row belum ada atau terjadi error baca, fallback ke default (perilaku
// lama) dan mencatat log, sehingga invoice flow/scheduler tidak terganggu.
func getReminderSettings(ctx context.Context, q queryRower) ReminderSettings {
	var raw string
	err := q.QueryRow(ctx,
		`SELECT value::text FROM app_settings WHERE key = $1`,
		reminderSettingsKey,
	).Scan(&raw)
	if err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			log.Printf("gagal membaca app_settings (%v); pakai default", err)
		}
		return defaultReminderSettings()
	}

	var s ReminderSettings
	if err := json.Unmarshal([]byte(raw), &s); err != nil {
		log.Printf("gagal mem-parsing app_settings (%v); pakai default", err)
		return defaultReminderSettings()
	}

	return normalizeReminderSettings(s)
}

// normalizeReminderSettings memastikan hanya tipe valid yang muncul, urutan
// mengikuti reminderTypeOffsets, dan send_time selalu berformat "HH:MM".
func normalizeReminderSettings(s ReminderSettings) ReminderSettings {
	valid := make(map[string]bool, len(reminderTypeOffsets))
	for _, rt := range reminderTypeOffsets {
		valid[rt.Type] = true
	}

	seen := make(map[string]bool, len(s.EnabledTypes))
	normalized := make([]string, 0, len(reminderTypeOffsets))
	for _, t := range s.EnabledTypes {
		if valid[t] && !seen[t] {
			seen[t] = true
			normalized = append(normalized, t)
		}
	}

	sendTime := strings.TrimSpace(s.SendTime)
	if _, _, err := parseSendTime(sendTime); err != nil {
		sendTime = defaultSendTime
	}

	return ReminderSettings{
		EnabledTypes: normalized,
		SendTime:     sendTime,
		EmailEnabled: s.EmailEnabled,
	}
}

func reminderTypesView() []ReminderTypeInfo {
	types := make([]ReminderTypeInfo, 0, len(reminderTypeOffsets))
	for _, rt := range reminderTypeOffsets {
		types = append(types, ReminderTypeInfo{Type: rt.Type, Days: rt.Days})
	}
	return types
}

func (s *SettingsService) GetSettings(ctx context.Context) (ReminderSettingsView, error) {
	settings := getReminderSettings(ctx, s.DB)
	emailEnabled := true
	if settings.EmailEnabled != nil {
		emailEnabled = *settings.EmailEnabled
	}
	return ReminderSettingsView{
		EnabledTypes: settings.EnabledTypes,
		SendTime:     settings.SendTime,
		EmailEnabled: emailEnabled,
		Types:        reminderTypesView(),
	}, nil
}

type UpdateReminderSettingsRequest struct {
	EnabledTypes []string `json:"enabled_types"`
	SendTime     string   `json:"send_time"`
	EmailEnabled *bool    `json:"email_enabled,omitempty"`
}

// UpdateReminderSettings memvalidasi, menyimpan, lalu (jika send_time berubah)
// menggeser jadwal reminder PENDING yang belum terkirim agar mengikuti jam baru.
func (s *SettingsService) UpdateReminderSettings(
	ctx context.Context,
	req UpdateReminderSettingsRequest,
	updatedBy string,
) (ReminderSettingsView, error) {
	if _, _, err := parseSendTime(req.SendTime); err != nil {
		return ReminderSettingsView{}, err
	}

	newSettings := normalizeReminderSettings(ReminderSettings{
		EnabledTypes: req.EnabledTypes,
		SendTime:     req.SendTime,
		EmailEnabled: req.EmailEnabled,
	})

	raw, err := json.Marshal(newSettings)
	if err != nil {
		return ReminderSettingsView{}, err
	}

	old := getReminderSettings(ctx, s.DB)

	_, err = s.DB.Exec(ctx, `
		INSERT INTO app_settings (key, value, updated_by, updated_at)
		VALUES ($1, $2::jsonb, $3, now())
		ON CONFLICT (key) DO UPDATE
			SET value = EXCLUDED.value,
			    updated_by = EXCLUDED.updated_by,
			    updated_at = now()
	`, reminderSettingsKey, string(raw), updatedBy)
	if err != nil {
		return ReminderSettingsView{}, fmt.Errorf("gagal menyimpan pengaturan: %w", err)
	}

	if old.SendTime != newSettings.SendTime && len(newSettings.EnabledTypes) > 0 {
		affected, rerr := s.reschedulePendingReminders(ctx, newSettings)
		if rerr != nil {
			return ReminderSettingsView{}, rerr
		}
		log.Printf("send_time berubah ke %s: %d reminder PENDING digeser", newSettings.SendTime, affected)
	}

	emailEnabled := true
	if newSettings.EmailEnabled != nil {
		emailEnabled = *newSettings.EmailEnabled
	}

	return ReminderSettingsView{
		EnabledTypes: newSettings.EnabledTypes,
		SendTime:     newSettings.SendTime,
		EmailEnabled: emailEnabled,
		Types:        reminderTypesView(),
	}, nil
}

// reschedulePendingReminders menggeser scheduled_at seluruh reminder PENDING
// (sent_at IS NULL) milik invoice SENT/UNPAID ke jam baru. Hanya tipe yang
// sedang enabled yang diikutkan. SENT/SKIPPED/FAILED tidak pernah disentuh.
func (s *SettingsService) reschedulePendingReminders(
	ctx context.Context,
	settings ReminderSettings,
) (int, error) {
	hour, minute, err := parseSendTime(settings.SendTime)
	if err != nil {
		return 0, err
	}

	rows, err := s.DB.Query(ctx, `
		SELECT r.id, i.due_date, r.reminder_type
		FROM reminders r
		INNER JOIN invoices i ON i.id = r.invoice_id
		WHERE r.status = 'PENDING'
		  AND r.sent_at IS NULL
		  AND i.status IN ('SENT', 'UNPAID')
		  AND r.reminder_type = ANY($1)
	`, settings.EnabledTypes)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	type pendingReminder struct {
		id           string
		dueDate      time.Time
		reminderType string
	}
	var pending []pendingReminder
	for rows.Next() {
		var pr pendingReminder
		if err := rows.Scan(&pr.id, &pr.dueDate, &pr.reminderType); err != nil {
			return 0, err
		}
		pending = append(pending, pr)
	}
	if err := rows.Err(); err != nil {
		return 0, err
	}

	dayOffsets := make(map[string]int, len(reminderTypeOffsets))
	for _, rt := range reminderTypeOffsets {
		dayOffsets[rt.Type] = rt.Days
	}

	tx, err := s.DB.Begin(ctx)
	if err != nil {
		return 0, err
	}
	defer tx.Rollback(ctx)

	affected := 0
	for _, pr := range pending {
		days, ok := dayOffsets[pr.reminderType]
		if !ok {
			continue
		}
		offsetDate := pr.dueDate.AddDate(0, 0, -days)
		newScheduledAt := time.Date(
			offsetDate.Year(),
			offsetDate.Month(),
			offsetDate.Day(),
			hour, minute, 0, 0,
			jakartaLocation,
		)
		cmd, uerr := tx.Exec(ctx,
			`UPDATE reminders SET scheduled_at = $2 WHERE id = $1`,
			pr.id, newScheduledAt,
		)
		if uerr != nil {
			return 0, uerr
		}
		affected += int(cmd.RowsAffected())
	}

	if err := tx.Commit(ctx); err != nil {
		return 0, err
	}

	return affected, nil
}