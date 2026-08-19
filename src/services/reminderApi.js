const API_URL = "http://localhost:8080/api/reminders";

export async function getReminders() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Gagal mengambil data reminder");
  }

  return response.json();
}

export async function retryReminder(id) {
  const response = await fetch(`${API_URL}/${id}/retry`, {
    method: "POST",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal memproses retry reminder");
  }

  return response.json();
}