const API_URL = "http://localhost:8080/api/reminders";

function authHeaders(token, extra = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function getReminders(token) {
  const response = await fetch(API_URL, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error("Gagal mengambil data reminder");
  }

  return response.json();
}

export async function retryReminder(id, token) {
  const response = await fetch(`${API_URL}/${id}/retry`, {
    method: "POST",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal memproses retry reminder");
  }

  return response.json();
}
