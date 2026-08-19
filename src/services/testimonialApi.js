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

export async function createTestimonial(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
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

export async function updateTestimonial(id, data) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
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

export async function deleteTestimonial(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menghapus testimoni");
  }

  return true;
}