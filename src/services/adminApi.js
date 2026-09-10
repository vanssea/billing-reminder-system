const API_URL = import.meta.env.VITE_API_URL + "/api/admins";

function authHeaders(token, extra = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function getAdmins(token) {
  const response = await fetch(API_URL, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error("Gagal mengambil data admin");
  }

  return response.json();
}

export async function getAdminById(id, token) {
  const response = await fetch(`${API_URL}/${id}`, { headers: authHeaders(token) });

  if (!response.ok) {
    throw new Error("Admin tidak ditemukan");
  }

  return response.json();
}

export async function createAdmin(data, token) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat admin");
  }

  return response.json();
}

export async function updateAdmin(id, data, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengupdate admin");
  }

  return response.json();
}

export async function deleteAdmin(id, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menghapus admin");
  }

  return true;
}
