package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"billing-reminder-system/services"
)

type WhatsAppHandler struct {
	Service *services.WhatsAppService
	PDF     *services.PDFService
}

func NewWhatsAppHandler(service *services.WhatsAppService, pdf *services.PDFService) *WhatsAppHandler {
	return &WhatsAppHandler{
		Service: service,
		PDF:     pdf,
	}
}

func (h *WhatsAppHandler) GetStatus(w http.ResponseWriter, r *http.Request) {
	status := map[string]any{
		"connected": h.Service != nil && h.Service.IsConnected(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

func (h *WhatsAppHandler) Pair(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil {
		http.Error(w, "WhatsApp service tidak tersedia", http.StatusServiceUnavailable)
		return
	}

	var req struct {
		Phone string `json:"phone"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	if req.Phone == "" {
		http.Error(w, "phone wajib diisi", http.StatusBadRequest)
		return
	}

	code, err := h.Service.PairWithCode(req.Phone)
	if err != nil {
		http.Error(w, "Gagal generate pairing code: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"code":    code,
		"phone":   req.Phone,
		"message": "Buka WhatsApp → Setelan → Perangkat Tertaut → Tautkan Perangkat → Masukkan kode di atas",
	})
}

func (h *WhatsAppHandler) ServePairPage(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	w.Write([]byte(pairPageHTML))
}

func (h *WhatsAppHandler) TestSend(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil {
		http.Error(w, "WhatsApp service tidak tersedia", http.StatusServiceUnavailable)
		return
	}

	var req struct {
		Phone   string `json:"phone"`
		Message string `json:"message"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}

	if req.Phone == "" || req.Message == "" {
		http.Error(w, "phone dan message wajib diisi", http.StatusBadRequest)
		return
	}

	if err := h.Service.Send(req.Phone, req.Message); err != nil {
		http.Error(w, "Gagal mengirim pesan: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"sent":    true,
		"phone":   req.Phone,
		"message": req.Message,
	})
}

func (h *WhatsAppHandler) TestSendPDF(w http.ResponseWriter, r *http.Request) {
	if h.Service == nil || h.PDF == nil {
		http.Error(w, "WhatsApp/PDF service tidak tersedia", http.StatusServiceUnavailable)
		return
	}

	var req struct {
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Format JSON tidak valid", http.StatusBadRequest)
		return
	}
	if req.Phone == "" {
		http.Error(w, "phone wajib diisi", http.StatusBadRequest)
		return
	}

	dummy := &services.InvoiceData{
		InvoiceNumber: "INV/2026/08/001",
		InvoiceDate:   time.Date(2026, 8, 12, 0, 0, 0, 0, time.Local),
		DueDate:       time.Date(2026, 9, 11, 0, 0, 0, 0, time.Local),
		Status:        "UNPAID",
		Subtotal:      2000000,
		Tax:           220000,
		Total:         2220000,
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

	pdfBytes, err := h.PDF.RenderInvoicePDF(dummy)
	if err != nil {
		http.Error(w, "Gagal membuat PDF: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fileName := "Invoice-INV-2026-08-001.pdf"
	if err := h.Service.SendDocument(req.Phone, fileName, pdfBytes); err != nil {
		http.Error(w, "Gagal mengirim dokumen: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]any{
		"sent":      true,
		"phone":     req.Phone,
		"file_name": fileName,
		"size":      len(pdfBytes),
	})
}

const pairPageHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Pairing</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f0f2f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .card { background: #fff; border-radius: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); padding: 32px; max-width: 420px; width: 90%; }
    h1 { font-size: 20px; color: #1a1a2e; margin-bottom: 4px; }
    .subtitle { font-size: 13px; color: #666; margin-bottom: 24px; }
    label { display: block; font-size: 13px; font-weight: 600; color: #333; margin-bottom: 6px; }
    input { width: 100%; padding: 10px 14px; border: 1.5px solid #ddd; border-radius: 10px; font-size: 15px; outline: none; transition: border 0.2s; }
    input:focus { border-color: #25d366; }
    button { width: 100%; margin-top: 16px; padding: 12px; background: #25d366; color: #fff; border: none; border-radius: 10px; font-size: 15px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
    button:hover { background: #1da851; }
    button:disabled { background: #ccc; cursor: not-allowed; }
    .result { margin-top: 20px; display: none; }
    .result.show { display: block; }
    .code-box { background: #f0f7f0; border: 2px dashed #25d366; border-radius: 12px; padding: 20px; text-align: center; }
    .code { font-size: 32px; font-weight: 800; letter-spacing: 4px; color: #1a1a2e; }
    .hint { font-size: 12px; color: #666; margin-top: 12px; line-height: 1.6; }
    .error { margin-top: 16px; background: #fff0f0; border: 1px solid #ffcccc; border-radius: 10px; padding: 12px; color: #c0392b; font-size: 13px; display: none; }
    .error.show { display: block; }
    .connected { margin-top: 16px; background: #f0f7f0; border: 1px solid #c3e6cb; border-radius: 10px; padding: 12px; color: #155724; font-size: 13px; display: none; }
    .connected.show { display: block; }
  </style>
</head>
<body>
  <div class="card">
    <h1>WhatsApp Pairing</h1>
    <p class="subtitle">Hubungkan bot WhatsApp ke backend</p>

    <div id="connectedMsg" class="connected">
      WhatsApp sudah terhubung! Tidak perlu pairing.
    </div>

    <div id="formArea">
      <label for="phone">Nomor Telepon Bot</label>
      <input type="tel" id="phone" placeholder="62812xxxxxxx" />
      <button id="pairBtn" onclick="doPair()">Pair Sekarang</button>
    </div>

    <div id="result" class="result">
      <div class="code-box">
        <div class="code" id="codeDisplay"></div>
      </div>
      <div class="hint">
        <strong>Cara pakai:</strong><br>
        1. Buka WhatsApp di HP (nomor di atas)<br>
        2. Setelan → Perangkat Tertaut → Tautkan Perangkat<br>
        3. Masukkan kode di atas
      </div>
    </div>

    <div id="error" class="error"></div>
  </div>

  <script>
    fetch('/api/whatsapp/status').then(r=>r.json()).then(d=>{
      if(d.connected){document.getElementById('connectedMsg').classList.add('show');document.getElementById('formArea').style.display='none';}
    });

    async function doPair(){
      const phone=document.getElementById('phone').value.trim();
      if(!phone){alert('Masukkan nomor telepon');return;}
      const btn=document.getElementById('pairBtn');
      btn.disabled=true;btn.textContent='Memproses...';
      document.getElementById('error').classList.remove('show');
      document.getElementById('result').classList.remove('show');
      try{
        const res=await fetch('/api/whatsapp/pair',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
        const data=await res.json();
        if(!res.ok)throw new Error(data||'Gagal');
        document.getElementById('codeDisplay').textContent=data.code;
        document.getElementById('result').classList.add('show');
      }catch(e){
        document.getElementById('error').textContent=e.message;
        document.getElementById('error').classList.add('show');
      }finally{btn.disabled=false;btn.textContent='Pair Sekarang';}
    }
  </script>
</body>
</html>`
