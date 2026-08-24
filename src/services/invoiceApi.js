const API_URL = "http://localhost:8080/api/client";

export async function getClientInvoices(token) {
  const response = await fetch(`${API_URL}/invoices`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data invoice");
  }

  return response.json();
}

export async function getClientInvoiceById(id, token) {
  const response = await fetch(`${API_URL}/invoices/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Invoice tidak ditemukan");
  }

  return response.json();
}