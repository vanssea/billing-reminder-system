const API_URL = "http://localhost:8080/api/admin/dashboard";
const SUPER_ADMIN_URL = "http://localhost:8080/api/super-admin/dashboard";

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

export const getSuperAdminDashboard = async () => {
  const response = await fetch(SUPER_ADMIN_URL);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Gagal memuat data dashboard superadmin");
  }

  const data = await response.json();

  return {
    stats: data.stats || {},
    reminders_today: data.reminders_today || { scheduled: 0, sent: 0, failed: 0 },
    revenue_periods: data.revenue_periods || [],
    invoice_status: data.invoice_status || [],
    upcoming_invoices: data.upcoming_invoices || [],
    overdue_invoices: data.overdue_invoices || [],
    recent_payments: data.recent_payments || [],
    pending_verifications: data.pending_verifications || [],
    recent_activities: data.recent_activities || [],
  };
};
