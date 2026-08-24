const API_URL = "http://localhost:8080/api/client";

export async function getClientPayments(token) {
  const response = await fetch(`${API_URL}/payments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data pembayaran");
const API_URL = "http://localhost:8080/api/payments";

export async function getPayments() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Gagal mengambil data pembayaran");
  }

  return response.json();
}

export async function getPaymentById(id) {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Pembayaran tidak ditemukan");
  }

  return response.json();
}

export async function approvePayment(id, verifiedBy = null) {
  const response = await fetch(`${API_URL}/${id}/approve`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ verified_by: verifiedBy }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menyetujui pembayaran");
  }

  return response.json();
}

export async function createPayment(data, token) {
  const response = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
export async function rejectPayment(id, { verifiedBy = null, notes = null } = {}) {
  const response = await fetch(`${API_URL}/${id}/reject`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ verified_by: verifiedBy, notes: notes || null }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat pembayaran");
  }

  return response.json();
}
    throw new Error(message || "Gagal menolak pembayaran");
  }

  return response.json();
}
