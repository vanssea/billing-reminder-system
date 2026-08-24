const API_URL = "http://localhost:8080/api/testimonials";

export async function getTestimonials() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Gagal mengambil data testimoni");
  }

  return response.json();
}

export async function getTestimonialById(id) {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Testimoni tidak ditemukan");
  }

  return response.json();
}

export async function createTestimonial(data, token) {
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
    throw new Error(message || "Gagal membuat testimoni");
  }

  return response.json();
}

export async function updateTestimonial(id, data, token) {
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
    throw new Error(message || "Gagal mengupdate testimoni");
  }

  return response.json();
}

export async function deleteTestimonial(id, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menghapus testimoni");
  }

  return true;
}