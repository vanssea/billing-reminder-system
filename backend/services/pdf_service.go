package services

import (
	"bytes"
	"context"
	"fmt"
	"html/template"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/chromedp/cdproto/page"
	"github.com/chromedp/chromedp"
)

// PDFService merender invoice menjadi PDF menggunakan headless browser.
type PDFService struct{}

func NewPDFService() *PDFService {
	return &PDFService{}
}

type pdfItem struct {
	Name      string
	Price     string
	Qty       string
	LineTotal string
}

type pdfData struct {
	InvoiceNumber string
	InvoiceDate   string
	DueDate       string
	ClientCompany string
	ClientPIC     string
	ClientEmail   string
	ClientAddress string
	Items         []pdfItem
	Subtotal      string
	Tax           string
	Discount      string
	GrandTotal    string
}

var bulanIndonesia = map[time.Month]string{
	time.January:   "Januari",
	time.February:  "Februari",
	time.March:     "Maret",
	time.April:     "April",
	time.May:       "Mei",
	time.June:      "Juni",
	time.July:      "Juli",
	time.August:    "Agustus",
	time.September: "September",
	time.October:   "Oktober",
	time.November:  "November",
	time.December:  "Desember",
}

// formatTanggalIndo memformat waktu menjadi "12 Agustus 2026" dalam WIB.
func formatTanggalIndo(t time.Time) string {
	t = t.In(jakartaLocation)
	return fmt.Sprintf("%d %s %d", t.Day(), bulanIndonesia[t.Month()], t.Year())
}

// parseDateFlexible mem-parsing tanggal baik format RFC3339 (mis. dari
// toISOString Frontend) maupun YYYY-MM-DD. Dipakai agar backend toleran
// terhadap kedua format sehingga tanggal tidak bergeser/patah.
func parseDateFlexible(s string) (time.Time, error) {
	if t, err := time.Parse(time.RFC3339, s); err == nil {
		return t, nil
	}
	return time.Parse("2006-01-02", s)
}

// formatRupiah memformat angka menjadi "1.250.000,00".
func formatRupiah(total float64) string {
	parts := strings.Split(fmt.Sprintf("%.2f", total), ".")
	intPart := parts[0]

	var b strings.Builder
	digitCount := 0
	for i := len(intPart) - 1; i >= 0; i-- {
		b.WriteByte(intPart[i])
		digitCount++
		if digitCount%3 == 0 && i > 0 {
			b.WriteByte('.')
		}
	}

	reversed := b.String()
	var out []byte
	for i := len(reversed) - 1; i >= 0; i-- {
		out = append(out, reversed[i])
	}

	if len(parts) == 2 {
		return string(out) + "," + parts[1]
	}
	return string(out)
}

// buildPDFData menerjemahkan InvoiceData menjadi data siap cetak
// (angka sudah diformat Rupiah dan tanggal sudah berformat Indonesia).
func buildPDFData(d *InvoiceData) pdfData {
	items := make([]pdfItem, 0, len(d.Items))
	for _, it := range d.Items {
		items = append(items, pdfItem{
			Name:      it.Name,
			Price:     formatRupiah(it.Price),
			Qty:       fmt.Sprintf("%d", it.Qty),
			LineTotal: formatRupiah(it.Total),
		})
	}

	discountText := formatRupiah(d.Discount)
	if d.Discount > 0 {
		discountText = "- " + discountText
	}

	return pdfData{
		InvoiceNumber: d.InvoiceNumber,
		InvoiceDate:   formatTanggalIndo(d.InvoiceDate),
		DueDate:       formatTanggalIndo(d.DueDate),
		ClientCompany: d.ClientCompany,
		ClientPIC:     d.ClientPIC,
		ClientEmail:   d.ClientEmail,
		ClientAddress: d.ClientAddress,
		Items:         items,
		Subtotal:      formatRupiah(d.Subtotal),
		Tax:           formatRupiah(d.Tax),
		Discount:      discountText,
		GrandTotal:    formatRupiah(d.Total),
	}
}

// findBrowserPath mencari Chrome/Edge yang terpasang di sistem.
// Mengembalikan string kosong bila tidak ditemukan agar chromedp
// memakai deteksi bawaannya.
func findBrowserPath() string {
	candidates := []string{
		os.Getenv("CHROME_PATH"),
		`C:\Program Files\Google\Chrome\Application\chrome.exe`,
		`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
		`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
		`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
	}
	for _, p := range candidates {
		if p == "" {
			continue
		}
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	return ""
}

// newAllocatorContext membuat context allocator chromedp dengan browser
// yang terdeteksi di sistem. UserDataDir dipisahkan agar tidak bentrok
// dengan jendela Chrome yang sedang terbuka.
func newAllocatorContext() (context.Context, context.CancelFunc) {
	tmpDir, _ := os.MkdirTemp("", "chromedp-profile-*")
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-dev-shm-usage", true),
		chromedp.UserDataDir(tmpDir),
	)
	if p := findBrowserPath(); p != "" {
		opts = append(opts, chromedp.ExecPath(p))
	}
	return chromedp.NewExecAllocator(context.Background(), opts...)
}

// RenderInvoicePDF merender satu invoice menjadi PDF (A4) dan
// mengembalikan isi PDF sebagai byte.
func (p *PDFService) RenderInvoicePDF(d *InvoiceData) ([]byte, error) {
	tmpl, err := template.ParseFiles("templates/invoice.html")
	if err != nil {
		return nil, fmt.Errorf("gagal membaca template: %w", err)
	}

	var htmlBuf bytes.Buffer
	if err := tmpl.Execute(&htmlBuf, buildPDFData(d)); err != nil {
		return nil, fmt.Errorf("gagal mengisi template: %w", err)
	}

	tmpFile, err := os.CreateTemp("", "invoice-*.html")
	if err != nil {
		return nil, fmt.Errorf("gagal membuat file sementara: %w", err)
	}
	tmpName := tmpFile.Name()
	defer os.Remove(tmpName)

	if _, err := tmpFile.Write(htmlBuf.Bytes()); err != nil {
		tmpFile.Close()
		return nil, fmt.Errorf("gagal menulis file sementara: %w", err)
	}
	tmpFile.Close()

	fileURL := "file:///" + filepath.ToSlash(tmpName)

	allocCtx, allocCancel := newAllocatorContext()
	defer allocCancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	ctx, cancelTimeout := context.WithTimeout(ctx, 60*time.Second)
	defer cancelTimeout()

	var pdfBytes []byte
	err = chromedp.Run(ctx,
		chromedp.Navigate(fileURL),
		chromedp.WaitReady("body"),
		chromedp.ActionFunc(func(ctx context.Context) error {
			params := page.PrintToPDF().
				WithPrintBackground(true).
				WithPreferCSSPageSize(true).
				WithMarginTop(0).
				WithMarginBottom(0).
				WithMarginLeft(0).
				WithMarginRight(0)
			data, _, err := params.Do(ctx)
			if err != nil {
				return err
			}
			pdfBytes = data
			return nil
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("gagal render PDF: %w", err)
	}

	return pdfBytes, nil
}
