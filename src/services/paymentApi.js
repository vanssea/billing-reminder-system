const API_URL = "http://localhost:8080/api/client";

export async function getClientPayments(token) {
  const response = await fetch(`${API_URL}/payments`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data pembayaran");
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
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat pembayaran");
  }

  return response.json();
}