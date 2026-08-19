const API_URL = "http://localhost:8080/api/auth";

export async function getMe(token) {
  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Sesi tidak valid");
  }

  return response.json();
}