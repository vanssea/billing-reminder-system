const API_URL = "http://localhost:8080/api/admin/purchase-requests";
const CLIENT_API_URL = "http://localhost:8080/api/client/purchase";

function authHeaders(token, extra = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function getAllPurchaseRequests(token) {
  const response = await fetch(API_URL, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error("Gagal mengambil data permintaan pembelian");
  }

  return response.json();
}

export async function getPurchaseRequestById(id, token) {
  const response = await fetch(`${API_URL}/${id}`, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error("Permintaan pembelian tidak ditemukan");
  }

  return response.json();
}

export async function updatePurchaseRequestStatus(id, status, adminNotes, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ status, admin_notes: adminNotes }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengupdate status");
  }

  return response.json();
}

export async function getMyPurchaseRequests(token) {
  const response = await fetch(CLIENT_API_URL, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error("Gagal mengambil data permintaan pembelian");
  }

  return response.json();
}
