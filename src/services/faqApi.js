const API_URL = import.meta.env.VITE_API_URL + "/api/faqs";

export async function getFAQs() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Gagal mengambil data FAQ");
  }

  return response.json();
}

export async function getFAQById(id) {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("FAQ tidak ditemukan");
  }

  return response.json();
}

export async function createFAQ(data, token) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat FAQ");
  }

  return response.json();
}

export async function updateFAQ(id, data, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengupdate FAQ");
  }

  return response.json();
}

export async function deleteFAQ(id, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menghapus FAQ");
  }

  return true;
}