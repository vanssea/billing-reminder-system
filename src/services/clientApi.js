const API_URL = "http://localhost:8080/api/admin/clients";
const DELETE_API_URL = "http://localhost:8080/api/clients";

function authHeaders(token, extra = {}) {
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function getClients(page, limit, search, status, token) {
  const params = new URLSearchParams();
  if (page !== undefined) params.set("page", page);
  if (limit !== undefined) params.set("limit", limit);
  if (search) params.set("search", search);
  if (status) params.set("status", status);

  const query = params.toString();
  const response = await fetch(`${API_URL}${query ? `?${query}` : ""}`, {
    headers: authHeaders(token),
  });
  if (!response.ok) throw new Error("Gagal mengambil data client");
  return response.json();
}

export async function getClientById(id, token) {
  const response = await fetch(`${API_URL}/${id}`, { headers: authHeaders(token) });
  if (!response.ok) {
    throw new Error("Client tidak ditemukan");
  }
  return response.json();
}

export async function createClient(data, token) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat client");
  }
  return response.json();
}

export async function updateClient(id, data, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengupdate client");
  }
  return response.json();
}

export async function deleteClient(id, token) {
  const response = await fetch(`${DELETE_API_URL}/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menghapus client");
  }
  return true;
}

export async function getClientByProfileId(profileId, token) {
  const response = await fetch(`http://localhost:8080/api/clients/profile/${profileId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Client tidak ditemukan");
  }

  return response.json();
}

export async function createOrUpdateClientProfile(data, token) {
  const response = await fetch("http://localhost:8080/api/clients/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menyimpan profil");
  }

  return response.json();
}

export async function createPurchaseRequest(data, token) {
  const response = await fetch("http://localhost:8080/api/client/purchase", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat permintaan pembelian");
  }

  return response.json();
}

export async function updateClientStatus(id, status, token) {
  const response = await fetch(`${API_URL}/${id}/status`, {
    method: "PATCH",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify({ status }),
  });
  
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengupdate status client");
  }
  
  if (response.status === 204) return null;
  return response.json();
}