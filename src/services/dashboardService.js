export const getDashboardSummary = async () => {
  return {
    stats: {
      total_invoices: 350,
      paid_invoices: 280,
      unpaid_invoices: 45,
      overdue_invoices: 12,
      pending_payments: 8
    },
    upcoming_invoices: [
      { id: 'INV-2023-001', client: 'PT Makmur Sejahtera', due_date: '24 Okt 2023', amount: 1500000, status: 'Unpaid' },
      { id: 'INV-2023-002', client: 'CV Bintang Terang', due_date: '25 Okt 2023', amount: 750000, status: 'Unpaid' }
    ],
    pending_verifications: [
      { client: 'PT Sumber Baru', amount: 2000000 },
      { client: 'CV Jaya Abadi', amount: 850000 }
    ],
    reminders_today: { scheduled: 120, sent: 95, failed: 5 }
  };
};