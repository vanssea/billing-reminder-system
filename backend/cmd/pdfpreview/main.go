package main

import (
	"html/template"
	"log"
	"math"
	"os"
	"strconv"
	"time"

	"billing-reminder-system/services"
)

type PreviewItem struct {
	Name      string
	Price     string
	Qty       string
	LineTotal string
}

type PreviewData struct {
	InvoiceNumber string
	InvoiceDate   string
	DueDate       string
	ClientCompany string
	ClientPIC     string
	ClientEmail   string
	ClientAddress string
	Items         []PreviewItem
	Subtotal      string
	Tax           string
	Discount      string
	GrandTotal    string
}

func formatIDR(v float64) string {
	intPart := int64(math.Round(v))
	s := strconv.FormatInt(intPart, 10)

	var b []byte
	for i := 0; i < len(s); i++ {
		if i > 0 && (len(s)-i)%3 == 0 {
			b = append(b, '.')
		}
		b = append(b, s[i])
	}
	return "Rp " + string(b)
}

func main() {
	generateHTMLPreview()
	generateTestPDF()
	log.Println("Selesai — buka preview.html dan test.pdf untuk memeriksa hasil.")
}

func generateHTMLPreview() {
	tmpl, err := template.ParseFiles("templates/invoice.html")
	if err != nil {
		log.Fatal("Gagal membaca template:", err)
	}

	data := PreviewData{
		InvoiceNumber: "INV/2026/08/001",
		InvoiceDate:   "12 Agustus 2026",
		DueDate:       "11 September 2026",
		ClientCompany: "PT Maju Jaya Abadi",
		ClientPIC:     "Budi Santoso",
		ClientEmail:   "budi@majujaya.co.id",
		ClientAddress: "Jl. Pemuda No. 45, Karawaci, Tangerang, Banten 15810",
		Items: []PreviewItem{
			{Name: "Web Hosting Business", Price: formatIDR(750000), Qty: "2", LineTotal: formatIDR(1500000)},
			{Name: "Domain .com", Price: formatIDR(150000), Qty: "1", LineTotal: formatIDR(150000)},
			{Name: "SSL Certificate", Price: formatIDR(350000), Qty: "1", LineTotal: formatIDR(350000)},
		},
		Subtotal:   formatIDR(2000000),
		Tax:        formatIDR(220000),
		Discount:   "-" + formatIDR(100000),
		GrandTotal: formatIDR(2120000),
	}

	f, err := os.Create("preview.html")
	if err != nil {
		log.Fatal("Gagal membuat preview.html:", err)
	}
	defer f.Close()

	if err := tmpl.Execute(f, data); err != nil {
		log.Fatal("Gagal mengisi template:", err)
	}
	log.Println("preview.html berhasil dibuat.")
}

func generateTestPDF() {
	dummy := &services.InvoiceData{
		InvoiceNumber: "INV/2026/08/001",
		InvoiceDate:   time.Date(2026, 8, 12, 0, 0, 0, 0, time.Local),
		DueDate:       time.Date(2026, 9, 11, 0, 0, 0, 0, time.Local),
		Status:        "UNPAID",
		Subtotal:      2000000,
		Tax:           220000,
		Discount:      100000,
		Total:         2120000,
		ClientCompany: "PT Maju Jaya Abadi",
		ClientPIC:     "Budi Santoso",
		ClientEmail:   "budi@majujaya.co.id",
		ClientAddress: "Jl. Pemuda No. 45, Karawaci, Tangerang, Banten 15810",
		Items: []services.InvoiceItemData{
			{Name: "Web Hosting Business", Qty: 2, Price: 750000, Total: 1500000},
			{Name: "Domain .com", Qty: 1, Price: 150000, Total: 150000},
			{Name: "SSL Certificate", Qty: 1, Price: 350000, Total: 350000},
		},
	}

	pdfSvc := services.NewPDFService()
	pdfBytes, err := pdfSvc.RenderInvoicePDF(dummy)
	if err != nil {
		log.Fatal("Gagal render PDF:", err)
	}

	if err := os.WriteFile("test.pdf", pdfBytes, 0644); err != nil {
		log.Fatal("Gagal menyimpan test.pdf:", err)
	}
	log.Println("test.pdf berhasil dibuat.")
}
