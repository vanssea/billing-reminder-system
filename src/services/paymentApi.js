import { supabase } from "../lib/supabaseClient";

const API_URL = "http://localhost:8080/api/payments";
const CLIENT_API_URL = "http://localhost:8080/api/client";

const STORAGE_BUCKET = "Payment";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function authHeaders(token, extra = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function validatePaymentProofFile(file) {
  if (!file) return "File wajib dipilih.";
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "Format file tidak didukung (hanya JPG atau PNG).";
  }
  if (file.size > MAX_FILE_SIZE) {
    return "Ukuran file melebihi 10MB.";
  }
  return null;
}

export async function uploadPaymentProof(file, clientId) {
  const validationError = validatePaymentProofFile(file);
  if (validationError) throw new Error(validationError);

  const ext = file.name.split(".").pop().toLowerCase();
  const path = `proofs/${clientId}_${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type });

  if (uploadError) {
    throw new Error("Gagal upload file: " + uploadError.message);
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(path);

  if (!urlData?.publicUrl) {
    throw new Error("Gagal membuat public URL.");
  }

  return { path, publicUrl: urlData.publicUrl };
}

export async function getClientPayments(token) {
  const response = await fetch(`${CLIENT_API_URL}/payments`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data pembayaran");
  }

  return response.json();
}

export async function getPayments(token) {
  const response = await fetch(API_URL, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error("Gagal mengambil data pembayaran");
  }

  return response.json();
}

export async function getPaymentById(id, token) {
  const response = await fetch(`${API_URL}/${id}`, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error("Pembayaran tidak ditemukan");
  }

  return response.json();
}

export async function approvePayment(id, token, verifiedBy = null) {
  const response = await fetch(`${API_URL}/${id}/approve`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ verified_by: verifiedBy }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menyetujui pembayaran");
  }

  return response.json();
}

export async function rejectPayment(id, token, { notes = null } = {}) {
  const response = await fetch(`${API_URL}/${id}/reject`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ notes: notes || null }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menolak pembayaran");
  }

  return response.json();
}

export async function createPayment(data, token) {
  const response = await fetch(`${CLIENT_API_URL}/payments`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat pembayaran");
  }

  return response.json();
}
