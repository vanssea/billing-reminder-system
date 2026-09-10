const API_URL = import.meta.env.VITE_API_URL + "/api/invoices";
const CLIENT_API_URL = import.meta.env.VITE_API_URL + "/api/client";

function authHeaders(token, extra = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function getClientInvoices(token) {
  const response = await fetch(`${CLIENT_API_URL}/invoices`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data invoice");
  }

  return response.json();
}

export async function getInvoices(token) {
  const response = await fetch(API_URL, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error("Gagal mengambil data invoice");
  }

  return response.json();
}

export async function getInvoiceById(id, token) {
  const response = await fetch(`${API_URL}/${id}`, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error("Invoice tidak ditemukan");
  }

  return response.json();
}

export async function createInvoice(data, token) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat invoice");
  }

  return response.json();
}

export async function getClientInvoiceById(id, token) {
  const response = await fetch(`${CLIENT_API_URL}/invoices/${id}`, {
    headers: authHeaders(token),
  });

  if (!response.ok) {
    throw new Error("Invoice tidak ditemukan");
  }

  return response.json();
}

export async function updateInvoice(id, data, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengupdate invoice");
  }

  return response.json();
}

export async function sendInvoice(id, token) {
  const response = await fetch(`${API_URL}/${id}/send`, {
    method: "POST",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengirim invoice");
  }

  return response.json();
}

export async function deleteInvoice(id, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menghapus invoice");
  }

  return true;
}
