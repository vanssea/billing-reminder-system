const API_URL = "http://localhost:8080/api/notifications";

// role: "SUPERADMIN" | "ADMIN" | "ALL"
export async function getNotifications(role = "ALL", limit = 15) {
  const params = new URLSearchParams({ role, limit: String(limit) });
  const response = await fetch(`${API_URL}?${params}`);
  if (!response.ok) {
    throw new Error("Gagal memuat notifikasi");
  }
  return response.json();
}

export async function markNotificationRead(id) {
  const response = await fetch(`${API_URL}/${id}/read`, { method: "PUT" });
  if (!response.ok) {
    throw new Error("Gagal menandai notifikasi dibaca");
  }
  return true;
}

export async function markAllNotificationsRead(role = "ALL") {
  const params = new URLSearchParams({ role });
  const response = await fetch(`${API_URL}/read-all?${params}`, { method: "PUT" });
  if (!response.ok) {
    throw new Error("Gagal menandai semua notifikasi dibaca");
  }
  return true;
}
