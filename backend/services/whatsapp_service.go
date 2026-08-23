package services

import (
	"context"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/mdp/qrterminal/v3"
	"go.mau.fi/whatsmeow"
	waProto "go.mau.fi/whatsmeow/binary/proto"
	"go.mau.fi/whatsmeow/store/sqlstore"
	"go.mau.fi/whatsmeow/types"
	"go.mau.fi/whatsmeow/types/events"
	waLog "go.mau.fi/whatsmeow/util/log"
	"google.golang.org/protobuf/proto"

	// Driver SQLite murni Go (tanpa perlu compiler C / CGO)
	_ "modernc.org/sqlite"
)

// WhatsAppService membungkus client whatsmeow agar mudah dipakai
// oleh reminder scheduler maupun endpoint test.
type WhatsAppService struct {
	Client *whatsmeow.Client
	mu     sync.Mutex
}

// NewWhatsAppService membuat koneksi whatsmeow.
// Jika belum ada sesi tersimpan, QR dicetak di terminal untuk discan.
// Jika sudah pernah scan, langsung terhubung otomatis.
func NewWhatsAppService() (*WhatsAppService, error) {
	ctx := context.Background()

	// 1. Buka database sesi SQLite (file wa_sessions.db di folder backend)
	container, err := sqlstore.New(ctx, "sqlite", "file:wa_sessions.db?_foreign_keys=on", nil)
	if err != nil {
		return nil, fmt.Errorf("gagal buka database sesi: %w", err)
	}

	// 2. Ambil sesi pertama (jika sudah pernah scan) atau siapkan sesi baru
	device, err := container.GetFirstDevice(ctx)
	if err != nil {
		return nil, fmt.Errorf("gagal ambil device: %w", err)
	}

	// 3. Buat object client whatsmeow
	clientLog := waLog.Stdout("WhatsApp", "INFO", true)
	client := whatsmeow.NewClient(device, clientLog)

	svc := &WhatsAppService{Client: client}

	// 4. Daftarkan event handler (status koneksi saja, QR ditangani via channel)
	client.AddEventHandler(func(evt interface{}) {
		switch evt.(type) {
		case *events.Connected:
			fmt.Println("WhatsApp terhubung!")
		case *events.LoggedOut:
			fmt.Println("WhatsApp logout. Restart backend untuk scan QR baru.")
		}
	})

	// 5. Bedakan dua alur:
	//    - Device BARU (belum pernah scan) -> alur pairing QR via GetQRChannel
	//    - Device SUDAH pernah scan        -> konek langsung di background
	if device.ID == nil {
		go svc.runPairingLoop(ctx, client)
	} else {
		go func() {
			if err := client.Connect(); err != nil {
				clientLog.Errorf("Gagal connect: %v", err)
			}
		}()
	}

	return svc, nil
}

// runPairingLoop menjalankan alur pairing QR. Dijalankan di goroutine
// karena process ini menunggu QR discan oleh pengguna.
func (s *WhatsAppService) runPairingLoop(ctx context.Context, client *whatsmeow.Client) {
	for {
		// GetQRChannel WAJIB dipanggil sebelum Connect
		qrChan, err := client.GetQRChannel(ctx)
		if err != nil {
			fmt.Println("Gagal membuat channel QR:", err)
			time.Sleep(3 * time.Second)
			continue
		}

		if err := client.Connect(); err != nil {
			fmt.Println("Gagal connect, mencoba lagi:", err)
			time.Sleep(3 * time.Second)
			continue
		}

		for item := range qrChan {
			switch item.Event {
			case whatsmeow.QRChannelEventCode:
				fmt.Println("\n===== SCAN QR DI BAWAH INI DENGAN WHATSAPP (nomor bot) =====")
				qrterminal.GenerateHalfBlock(item.Code, qrterminal.L, os.Stdout)
				fmt.Println("============================================================")
			case "success":
				fmt.Println("WhatsApp berhasil ditautkan!")
				return
			case "timeout":
				fmt.Printf("QR kedaluwarsa (%v), mencoba kembali...\n", item.Timeout)
			default:
				if item.Error != nil {
					fmt.Println("Error pairing:", item.Error)
				}
			}
		}

		// Channel tertutup -> disconnect & coba lagi (untuk perangkat baru
		// auto-reconnect milik whatsmeow memang dimatikan).
		client.Disconnect()
		time.Sleep(5 * time.Second)
	}
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

	// Upload dulu file ke server WhatsApp, lalu rujuk dalam pesan dokumen.
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

// IsConnected mengecek apakah WhatsApp sudah terhubung.
func (s *WhatsAppService) IsConnected() bool {
	return s.Client != nil && s.Client.IsConnected()
}

// Close memutus koneksi saat backend dimatikan.
func (s *WhatsAppService) Close() {
	if s.Client != nil {
		s.Client.Disconnect()
	}
}

// normalizeJID mengubah nomor 08xx menjadi format internasional 628xx
// yang dipahami oleh WhatsApp.
func normalizeJID(phone string) (types.JID, error) {
	phone = strings.TrimSpace(phone)
	phone = strings.TrimPrefix(phone, "+")

	// Sisakan hanya angka
	var digits strings.Builder
	for _, r := range phone {
		if r >= '0' && r <= '9' {
			digits.WriteRune(r)
		}
	}
	phone = digits.String()

	// 08... -> 628...
	if strings.HasPrefix(phone, "0") {
		phone = "62" + phone[1:]
	}
	if len(phone) < 8 {
		return types.JID{}, fmt.Errorf("nomor tidak valid: %s", phone)
	}

	return types.NewJID(phone, "s.whatsapp.net"), nil
}