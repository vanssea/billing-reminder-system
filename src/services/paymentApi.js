const API_URL = "http://localhost:8080/api/payments";
const CLIENT_API_URL = "http://localhost:8080/api/client";

function authHeaders(token, extra = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
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
