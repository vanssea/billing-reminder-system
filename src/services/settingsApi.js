const API_URL = import.meta.env.VITE_API_URL + "/api/admin/settings";

function authHeaders(token, extra = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function getSettings(token) {
  const response = await fetch(API_URL, { headers: authHeaders(token) });
  if (!response.ok) throw new Error("Gagal mengambil pengaturan");
  return response.json();
}

export async function updateSettings(data, token) {
  const response = await fetch(API_URL, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menyimpan pengaturan");
  }
  return response.json();
}