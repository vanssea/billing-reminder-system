const API_URL = "http://localhost:8080/api/products";
const CLIENT_API_URL = "http://localhost:8080/api/client";

export async function getProducts() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Gagal mengambil data produk");
  }

  return response.json();
}

export async function getProductById(id) {
  const response = await fetch(`${API_URL}/${id}`);

  if (!response.ok) {
    throw new Error("Produk tidak ditemukan");
  }

  return response.json();
}

export async function createProduct(data) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat produk");
  }

  return response.json();
}

export async function updateProduct(id, data) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengupdate produk");
  }

  return response.json();
}

export async function deleteProduct(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal menghapus produk");
  }

  return true;
}

export async function purchaseProduct(productId, billingCycle, token) {
  const response = await fetch(`${CLIENT_API_URL}/purchase`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      product_id: productId,
      billing_cycle: billingCycle,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat permintaan pembelian");
  }

  return response.json();
}