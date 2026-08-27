package services

import (
	"context"
	"fmt"
	"strings"
	"sync"
	"time"

	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"

	_ "modernc.org/sqlite"
)

// WhatsAppService membungkus client whatsmeow.
type WhatsAppService struct {
	Client *whatsmeow.Client
	mu     sync.Mutex
}

// NewWhatsAppService membuat koneksi whatsmeow.
// Jika sudah ada sesi tersimpan, langsung terhubung otomatis.
// Jika belum ada sesi, tunggu pairing code dari endpoint /api/whatsapp/pair.
func NewWhatsAppService() (*WhatsAppService, error) {
	ctx := context.Background()

	container, err := sqlstore.New(ctx, "sqlite", "file:wa_sessions.db?_foreign_keys=on", nil)
	if err != nil {
		return nil, fmt.Errorf("gagal buka database sesi: %w", err)
	}

	device, err := container.GetFirstDevice(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal ambil device: %w", err)
	}

	clientLog := waLog.Stdout("WhatsApp", "INFO", true)
	client := whatsmeow.NewClient(device, clientLog)

	svc := &WhatsAppService{Client: client}

	client.AddEventHandler(func(evt interface{}) {
		switch e := evt.(type) {
		case *events.Connected:
			fmt.Println("WhatsApp terhubung!")
		case *events.LoggedOut:
			fmt.Println("WhatsApp logout. Gunakan POST /api/whatsapp/pair untuk pairing ulang.")
		case *events.QR:
			_ = e
		}
	})

	if device.ID != nil {
		go func() {
			if err := client.Connect(); err != nil {
				clientLog.Errorf("Gagal connect: %v", err)
			}
		}()
	}

	return svc, nil
}

// PairWithCode melakukan pairing menggunakan kode 8 digit (tanpa QR).
// Harus dipanggil saat client belum terhubung (device.ID == nil).
func (s *WhatsAppService) PairWithCode(phone string) (string, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.Client == nil {
		return "", fmt.Errorf("whatsapp client belum siap")
	}

	if s.Client.IsConnected() {
		return "", fmt.Errorf("whatsapp sudah terhubung, tidak perlu pairing")
	}

	phone = strings.TrimSpace(phone)
	phone = strings.TrimPrefix(phone, "+")
	var digits strings.Builder
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}
	phone = digits.String()

	if strings.HasPrefix(phone, "0") {
		phone = "62" + phone[1:]
	}
	if len(phone) < 10 {
		return "", fmt.Errorf("nomor telepon terlalu pendek: %s", phone)
	}

	ctx := context.Background()

	// Connect dulu untuk buka websocket
	if err := s.Client.Connect(); err != nil {
		return "", fmt.Errorf("gagal connect: %w", err)
	}

	// Tunggu sebentar agar websocket stabil
	done := make(chan struct{})
	go func() {
		for i := 0; i < 30; i++ {
			if s.Client.IsConnected() {
				close(done)
				return
			}
			time.Sleep(100 * time.Millisecond)
		}
		close(done)
	}()
	<-done

	if !s.Client.IsConnected() {
		return "", fmt.Errorf("gagal connect ke WhatsApp server")
	}

	// Generate pairing code
	code, err := s.Client.PairPhone(ctx, phone, true, whatsmeow.PairClientChrome, "Chrome (Linux)")
	if err != nil {
		s.Client.Disconnect()
		return "", fmt.Errorf("gagal generate pairing code: %w", err)
	}

	return code, nil
}

// Send mengirim pesan teks ke satu nomor.
func (s *WhatsAppService) Send(phone, message string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.Client == nil || !s.Client.IsConnected() {
		return fmt.Errorf("whatsapp belum terhubung")
	}

	jid, err := normalizeJID(phone)
	if err != nil {
		return err
	}

	_, err = s.Client.SendMessage(context.Background(), jid, &waProto.Message{
		Conversation: proto.String(message),
	})
	return err
}

// SendDocument mengirim dokumen (misalnya PDF invoice) ke satu nomor.
func (s *WhatsAppService) SendDocument(phone, fileName string, data []byte) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.Client == nil || !s.Client.IsConnected() {
		return fmt.Errorf("whatsapp belum terhubung")
	}

	jid, err := normalizeJID(phone)
	if err != nil {
		return err
	}

	ctx := context.Background()

	resp, err := s.Client.Upload(ctx, data, whatsmeow.MediaDocument)
	if err != nil {
		return fmt.Errorf("gagal upload dokumen: %w", err)
	}

	docMsg := &waProto.DocumentMessage{
		URL:           &resp.URL,
		DirectPath:    &resp.DirectPath,
		Mimetype:      proto.String("application/pdf"),
		Title:         proto.String(fileName),
		FileName:      proto.String(fileName),
		MediaKey:      resp.MediaKey,
		FileSHA256:    resp.FileSHA256,
		FileEncSHA256: resp.FileEncSHA256,
		FileLength:    &resp.FileLength,
	}

	_, err = s.Client.SendMessage(ctx, jid, &waProto.Message{
		DocumentMessage: docMsg,
	})
	return err
}

// IsConnected mengecek apakah WhatsApp sudah terhubung dan device JID tersimpan.
func (s *WhatsAppService) IsConnected() bool {
	return s.Client != nil && s.Client.IsConnected() && s.Client.Store != nil && s.Client.Store.ID != nil
}

// Close memutus koneksi saat backend dimatikan.
func (s *WhatsAppService) Close() {
	if s.Client != nil {
		s.Client.Disconnect()
	}
}

func normalizeJID(phone string) (types.JID, error) {
	phone = strings.TrimSpace(phone)
	phone = strings.TrimPrefix(phone, "+")

	var digits strings.Builder
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}
	phone = digits.String()

	if strings.HasPrefix(phone, "0") {
		phone = "62" + phone[1:]
	}
	if len(phone) < 8 {
		return types.JID{}, fmt.Errorf("nomor tidak valid: %s", phone)
	}

	return types.NewJID(phone, "s.whatsapp.net"), nil
}
