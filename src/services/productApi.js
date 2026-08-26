const API_URL = "http://localhost:8080/api/products";
const CLIENT_API_URL = "http://localhost:8080/api/client";
const ADMIN_PRODUCT_API_URL = "http://localhost:8080/api/admin/products";

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

export async function createProduct(data, token) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal membuat produk");
  }

  return response.json();
}

export async function updateProduct(id, data, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengupdate produk");
  }

  return response.json();
}

export async function deleteProduct(id, token) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
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

// ==========================================
// FUNGSI TAMBAHAN KHUSUS UNTUK ADMIN PRODUCT
// ==========================================
export async function updateProductStatus(id, newStatus, token) {
  // 1. Ambil data produk yang ada saat ini berdasarkan ID-nya
  const getResponse = await fetch(`${API_URL}/${id}`);
  if (!getResponse.ok) {
    throw new Error("Gagal mengambil data produk untuk update status");
  }
  const currentProduct = await getResponse.json();

  // 2. Gabungkan data lama dengan status baru yang ingin diubah
  const updatedPayload = {
    ...currentProduct,
    status: newStatus,
  };

  // 3. Kirim kembali seluruh data lengkap ke endpoint PUT
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(updatedPayload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal mengubah status produk");
  }

  return response.json();
}