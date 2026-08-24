const API_URL = "http://localhost:8080/api/notifications";

// Role penerima notifikasi ditentukan backend dari JWT; frontend hanya
// mengirim access token.
function buildHeaders(accessToken) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

export async function getNotifications(limit = 15, accessToken = null) {
  const params = new URLSearchParams({ limit: String(limit) });
  const response = await fetch(`${API_URL}?${params}`, {
    headers: buildHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error("Gagal memuat notifikasi");
  }
  return response.json();
}

export async function markNotificationRead(id, accessToken = null) {
  const response = await fetch(`${API_URL}/${id}/read`, {
    method: "PUT",
    headers: buildHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error("Gagal menandai notifikasi dibaca");
  }
  return true;
}

export async function markAllNotificationsRead(accessToken = null) {
  const response = await fetch(`${API_URL}/read-all`, {
    method: "PUT",
    headers: buildHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error("Gagal menandai semua notifikasi dibaca");
  }
  return true;
}
