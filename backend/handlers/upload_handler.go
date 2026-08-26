package handlers

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"billing-reminder-system/middleware"
)

type UploadHandler struct {
	UploadDir string
	BaseURL   string
}

func NewUploadHandler(uploadDir string, baseURL string) *UploadHandler {
	os.MkdirAll(uploadDir, 0755)
	return &UploadHandler{UploadDir: uploadDir, BaseURL: baseURL}
}

func (h *UploadHandler) UploadPaymentProof(w http.ResponseWriter, r *http.Request) {
	profile := middleware.ProfileFromContext(r)
	if profile == nil {
		http.Error(w, "Belum terautentikasi", http.StatusUnauthorized)
		return
	}

	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "File terlalu besar (maks 10MB)", http.StatusBadRequest)
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		http.Error(w, "File tidak ditemukan", http.StatusBadRequest)
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(handler.Filename))
	allowedExts := map[string]bool{".jpg": true, ".jpeg": true, ".png": true, ".gif": true, ".pdf": true}
	if !allowedExts[ext] {
		http.Error(w, "Format file tidak didukung (jpg, png, gif, pdf)", http.StatusBadRequest)
		return
	}

	if handler.Size > 10<<20 {
		http.Error(w, "File terlalu besar (maks 10MB)", http.StatusBadRequest)
		return
	}

	filename := fmt.Sprintf("%s_%d%s", profile.ID[:8], time.Now().UnixMilli(), ext)
	dstPath := filepath.Join(h.UploadDir, filename)

	dst, err := os.Create(dstPath)
	if err != nil {
		http.Error(w, "Gagal menyimpan file", http.StatusInternalServerError)
		return
	}
	defer dst.Close()

	if _, err := io.Copy(dst, file); err != nil {
		http.Error(w, "Gagal menyimpan file", http.StatusInternalServerError)
		return
	}

	url := h.BaseURL + "/uploads/" + filename

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{"url": "%s", "filename": "%s"}`, url, filename)
}
