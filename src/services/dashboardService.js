const API_URL = "http://localhost:8080/api/admin/dashboard";

export const getDashboardSummary = async () => {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error("Gagal memuat data dashboard");
  }

  const data = await response.json();

  return {
    ...data,
    upcoming_invoices: data.upcoming_invoices || [],
    pending_verifications: data.pending_verifications || [],
    reminders_today: data.reminders_today || { scheduled: 0, sent: 0, failed: 0 },
  };
};
