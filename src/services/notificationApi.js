const API_URL = "http://localhost:8080/api/notifications";

function buildHeaders(accessToken) {
  const headers = { "Content-Type": "application/json" };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

// role: "SUPERADMIN" | "ADMIN" | "CLIENT" | "ALL"
export async function getNotifications(role = "ALL", limit = 15, accessToken = null) {
  const params = new URLSearchParams({ role, limit: String(limit) });
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

export async function markAllNotificationsRead(role = "ALL", accessToken = null) {
  const params = new URLSearchParams({ role });
  const response = await fetch(`${API_URL}/read-all?${params}`, {
    method: "PUT",
    headers: buildHeaders(accessToken),
  });
  if (!response.ok) {
    throw new Error("Gagal menandai semua notifikasi dibaca");
  }
  return true;
}
