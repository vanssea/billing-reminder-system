import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  Inbox,
  Receipt,
  Wallet,
  XCircle,
} from "lucide-react";

import { getInvoices } from "../../services/invoiceApi";
import { getPayments } from "../../services/paymentApi";
import { getReminders } from "../../services/reminderApi";
import { getClients } from "../../services/clientApi";
import {
  formatRupiahExport,
  formatDateExport,
  formatDateTimeExport,
  periodLabel,
  downloadCSVReport,
  downloadPDFReport,
} from "../../utils/reportExport";

/* =========================================================
   HELPERS
========================================================= */

const formatRupiah = (v) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(v || 0);

const formatDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const DAY_MS = 24 * 60 * 60 * 1000;

const daysOverdue = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(
    0,
    Math.floor((today - new Date(dueDate).getTime()) / DAY_MS)
  );
};

const isInvoiceOverdue = (inv) =>
  inv.status === "OVERDUE" ||
  (inv.status !== "PAID" &&
    new Date(inv.due_date).setHours(0, 0, 0, 0) <
      new Date().setHours(0, 0, 0, 0));

const inRange = (dateStr, from, to) => {
  if (!dateStr) return true;
  const t = new Date(dateStr).setHours(0, 0, 0, 0);
  if (from && t < new Date(from).setHours(0, 0, 0, 0)) return false;
  if (to && t > new Date(to).setHours(0, 0, 0, 0)) return false;
  return true;
};

/* =========================================================
   CONFIG
========================================================= */

const tabs = [
  {
    key: "INVOICE",
    label: "Laporan Invoice",
    description: "Rekap invoice & status pembayarannya",
    icon: FileText,
    emptyTitle: "Tidak ada data invoice",
    emptyText: "Belum ada invoice pada periode ini.",
  },
  {
    key: "PEMBAYARAN",
    label: "Laporan Pembayaran",
    description: "Dana masuk & verifikasi pembayaran",
    icon: CreditCard,
    emptyTitle: "Tidak ada data pembayaran",
    emptyText: "Belum ada pembayaran pada periode ini.",
  },
  {
    key: "OVERDUE",
    label: "Laporan Overdue",
    description: "Invoice melewati jatuh tempo",
    icon: AlertTriangle,
    emptyTitle: "Tidak ada invoice overdue",
    emptyText: "Bagus! Tidak ada invoice yang melewati jatuh tempo.",
  },
  {
    key: "REMINDER",
    label: "Laporan Reminder",
    description: "Aktivitas pengiriman pengingat WhatsApp",
    icon: Bell,
    emptyTitle: "Tidak ada data reminder",
    emptyText: "Belum ada reminder terjadwal pada periode ini.",
  },
  {
    key: "EXPORT",
    label: "Export Data",
    description: "Unduh laporan dalam format CSV",
    icon: Download,
    emptyTitle: "",
    emptyText: "",
  },
];

const invoiceStatusConfig = {
  PAID: {
    label: "Lunas",
    color: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
  },
  SENT: {
    label: "Terkirim",
    color: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    bar: "bg-blue-500",
  },
  UNPAID: {
    label: "Belum Lunas",
    color: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-amber-500",
  },
  OVERDUE: {
    label: "Overdue",
    color: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    bar: "bg-red-500",
  },
  CANCELLED: {
    label: "Dibatalkan",
    color: "bg-slate-400",
    text: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    bar: "bg-slate-400",
  },
  DRAFT: {
    label: "Draft",
    color: "bg-slate-300",
    text: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    bar: "bg-slate-300",
  },
};

const paymentStatusConfig = {
  PENDING: {
    label: "Menunggu Keputusan",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  APPROVED: {
    label: "Disetujui",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  REJECTED: {
    label: "Ditolak",
    dot: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

const reminderStatusConfig = {
  PENDING: {
    label: "Terjadwal",
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-amber-500",
  },
  SENT: {
    label: "Terkirim",
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    bar: "bg-emerald-500",
  },
  FAILED: {
    label: "Gagal",
    dot: "bg-red-500",
    text: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    bar: "bg-red-500",
  },
  SKIPPED: {
    label: "Dilewati",
    dot: "bg-slate-400",
    text: "text-slate-600",
    bg: "bg-slate-100",
    border: "border-slate-200",
    bar: "bg-slate-400",
  },
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function SuperAdminReports() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState("INVOICE");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");

        const [invoiceData, paymentData, reminderData, clientData] =
          await Promise.all([
            getInvoices(),
            getPayments(),
            getReminders(),
            getClients(1, 1000),
          ]);

        if (!ignore) {
          setInvoices(invoiceData || []);
          setPayments(paymentData || []);
          setReminders(reminderData || []);
          setClients((clientData && clientData.data) || clientData || []);
        }
      } catch {
        if (!ignore) {
          setError("Gagal memuat data laporan dari server.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, []);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [clients]);

  const invoiceById = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => {
      map[inv.id] = inv;
    });
    return map;
  }, [invoices]);

  /* ---------- LAPORAN INVOICE ---------- */

  const filteredInvoices = useMemo(
    () =>
      invoices
        .filter((inv) => inRange(inv.invoice_date, periodFrom, periodTo))
        .sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date)),
    [invoices, periodFrom, periodTo]
  );

  const invoiceStats = useMemo(() => {
    let totalNilai = 0,
      lunas = 0,
      nilaiLunas = 0,
      terkirim = 0,
      nilaiTerkirim = 0,
      unpaid = 0,
      nilaiUnpaid = 0,
      overdue = 0,
      nilaiOverdue = 0,
      dibatalkan = 0,
      draft = 0;

    filteredInvoices.forEach((inv) => {
      totalNilai += inv.total || 0;
      if (inv.status === "CANCELLED") {
        dibatalkan += 1;
      } else if (inv.status === "DRAFT") {
        draft += 1;
      } else if (isInvoiceOverdue(inv)) {
        overdue += 1;
        nilaiOverdue += inv.total || 0;
      } else if (inv.status === "PAID") {
        lunas += 1;
        nilaiLunas += inv.total || 0;
      } else if (inv.status === "SENT") {
        terkirim += 1;
        nilaiTerkirim += inv.total || 0;
      } else {
        unpaid += 1;
        nilaiUnpaid += inv.total || 0;
      }
    });

    const belumLunas = terkirim + unpaid + overdue;
    const nilaiBelumLunas = nilaiTerkirim + nilaiUnpaid + nilaiOverdue;

    return {
      count: filteredInvoices.length,
      totalNilai,
      lunas,
      nilaiLunas,
      terkirim,
      nilaiTerkirim,
      unpaid,
      nilaiUnpaid,
      belumLunas,
      nilaiBelumLunas,
      overdue,
      nilaiOverdue,
      dibatalkan,
      draft,
    };
  }, [filteredInvoices]);

  /* ---------- LAPORAN PEMBAYARAN ---------- */

  const filteredPayments = useMemo(
    () =>
      payments
        .filter((p) => inRange(p.payment_date || p.created_at, periodFrom, periodTo))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [payments, periodFrom, periodTo]
  );

  const paymentRows = useMemo(
    () =>
      filteredPayments.map((p) => {
        const inv = invoiceById[p.invoice_id];
        return {
          ...p,
          invoice_number: inv?.invoice_number || p.invoice_number || "-",
          client_name: inv
            ? clientMap[inv.client_id]?.company_name ||
              p.client_name ||
              "-"
            : p.client_name || "-",
        };
      }),
    [filteredPayments, invoiceById, clientMap]
  );

  const paymentStats = useMemo(() => {
    let diterima = 0,
      nilaiDiterima = 0,
      menunggu = 0,
      nilaiMenunggu = 0,
      ditolak = 0,
      nilaiDitolak = 0;

    filteredPayments.forEach((p) => {
      if (p.status === "APPROVED") {
        diterima += 1;
        nilaiDiterima += p.amount || 0;
      } else if (p.status === "PENDING") {
        menunggu += 1;
        nilaiMenunggu += p.amount || 0;
      } else if (p.status === "REJECTED") {
        ditolak += 1;
        nilaiDitolak += p.amount || 0;
      }
    });

    return {
      count: filteredPayments.length,
      diterima,
      nilaiDiterima,
      menunggu,
      nilaiMenunggu,
      ditolak,
      nilaiDitolak,
    };
  }, [filteredPayments]);

  /* ---------- LAPORAN OVERDUE ---------- */

  const overdueRows = useMemo(
    () =>
      invoices
        .filter(
          (inv) =>
            isInvoiceOverdue(inv) && inRange(inv.due_date, periodFrom, periodTo)
        )
        .map((inv) => ({ ...inv, days: daysOverdue(inv.due_date) }))
        .sort((a, b) => b.days - a.days),
    [invoices, periodFrom, periodTo]
  );

  const overdueStats = useMemo(() => {
    const totalTunggakan = overdueRows.reduce((s, inv) => s + (inv.total || 0), 0);
    const avgDays = overdueRows.length
      ? Math.round(overdueRows.reduce((s, r) => s + r.days, 0) / overdueRows.length)
      : 0;
    const maxDays = overdueRows.length ? overdueRows[0].days : 0;
    return { count: overdueRows.length, totalTunggakan, avgDays, maxDays };
  }, [overdueRows]);

  /* ---------- LAPORAN REMINDER ---------- */

  const filteredReminders = useMemo(
    () =>
      reminders
        .filter((r) => inRange(r.scheduled_at, periodFrom, periodTo))
        .sort(
          (a, b) => new Date(b.scheduled_at || 0) - new Date(a.scheduled_at || 0)
        ),
    [reminders, periodFrom, periodTo]
  );

  const reminderStats = useMemo(() => {
    let pending = 0,
      sent = 0,
      failed = 0,
      skipped = 0;

    filteredReminders.forEach((r) => {
      if (r.status === "SENT") sent += 1;
      else if (r.status === "FAILED") failed += 1;
      else if (r.status === "SKIPPED") skipped += 1;
      else pending += 1;
    });

    const processed = sent + failed;
    const successRate = processed ? Math.round((sent / processed) * 100) : 0;

    return { count: filteredReminders.length, pending, sent, failed, skipped, successRate };
  }, [filteredReminders]);

  /* ---------- EXPORT CSV & PDF ---------- */

  const period = periodLabel(periodFrom, periodTo);

  const invoiceExportRows = () =>
    filteredInvoices.map((inv) => [
      inv.invoice_number,
      clientMap[inv.client_id]?.company_name || "-",
      formatDateExport(inv.invoice_date),
      formatDateExport(inv.due_date),
      formatRupiahExport(inv.subtotal),
      formatRupiahExport(inv.tax),
      formatRupiahExport(inv.total),
      invoiceStatusConfig[inv.status]?.label || inv.status,
    ]);

  const invoiceSummary = () => [
    { label: "Total Invoice", value: String(invoiceStats.count) },
    { label: "Nilai Total Invoiced", value: formatRupiah(invoiceStats.totalNilai) },
    { label: "Lunas", value: `${invoiceStats.lunas} (${formatRupiah(invoiceStats.nilaiLunas)})` },
    { label: "Belum Lunas", value: `${invoiceStats.belumLunas} (${formatRupiah(invoiceStats.nilaiBelumLunas)})` },
    { label: "Overdue", value: `${invoiceStats.overdue} (${formatRupiah(invoiceStats.nilaiOverdue)})` },
    { label: "Dibatalkan", value: String(invoiceStats.dibatalkan) },
  ];

  const exportInvoice = () => {
    downloadCSVReport({
      filename: `laporan-invoice-${periodFrom || "semua"}_${periodTo || "periode"}.csv`,
      title: "Laporan Invoice",
      period,
      headers: ["No Invoice", "Client", "Tanggal Invoice", "Jatuh Tempo", "Subtotal", "Pajak", "Total", "Status"],
      rows: invoiceExportRows(),
    });
    showSuccess("Laporan invoice (CSV) berhasil diunduh.");
  };

  const exportInvoicePdf = async () => {
    await downloadPDFReport({
      filename: `laporan-invoice-${periodFrom || "semua"}_${periodTo || "periode"}.pdf`,
      title: "Laporan Invoice",
      period,
      summary: invoiceSummary(),
      headers: ["No Invoice", "Client", "Tanggal", "Jatuh Tempo", "Subtotal", "Pajak", "Total", "Status"],
      rows: invoiceExportRows(),
      colWidths: [1.3, 1.8, 1, 1, 1, 0.9, 1.1, 1],
      aligns: [undefined, undefined, undefined, undefined, "right", "right", "right", undefined],
    });
    showSuccess("Laporan invoice (PDF) berhasil diunduh.");
  };

  const paymentExportRows = () =>
    paymentRows.map((p) => [
      p.invoice_number,
      p.client_name,
      formatDateExport(p.payment_date || p.created_at),
      p.payment_method || "-",
      formatRupiahExport(p.amount),
      paymentStatusConfig[p.status]?.label || p.status,
    ]);

  const paymentSummary = () => [
    { label: "Total Transaksi", value: String(paymentStats.count) },
    { label: "Disetujui", value: `${paymentStats.diterima} (${formatRupiah(paymentStats.nilaiDiterima)})` },
    { label: "Menunggu Verifikasi", value: `${paymentStats.menunggu} (${formatRupiah(paymentStats.nilaiMenunggu)})` },
    { label: "Ditolak", value: `${paymentStats.ditolak} (${formatRupiah(paymentStats.nilaiDitolak)})` },
  ];

  const exportPayment = () => {
    downloadCSVReport({
      filename: `laporan-pembayaran-${periodFrom || "semua"}_${periodTo || "periode"}.csv`,
      title: "Laporan Pembayaran",
      period,
      headers: ["No Invoice", "Client", "Tanggal Bayar", "Metode", "Jumlah", "Status"],
      rows: paymentExportRows(),
    });
    showSuccess("Laporan pembayaran (CSV) berhasil diunduh.");
  };

  const exportPaymentPdf = async () => {
    await downloadPDFReport({
      filename: `laporan-pembayaran-${periodFrom || "semua"}_${periodTo || "periode"}.pdf`,
      title: "Laporan Pembayaran",
      period,
      summary: paymentSummary(),
      headers: ["No Invoice", "Client", "Tanggal Bayar", "Metode", "Jumlah", "Status"],
      rows: paymentExportRows(),
      colWidths: [1.2, 1.9, 1.1, 1.1, 1.1, 1.1],
      aligns: [undefined, undefined, undefined, undefined, "right", undefined],
    });
    showSuccess("Laporan pembayaran (PDF) berhasil diunduh.");
  };

  const overdueExportRows = () =>
    overdueRows.map((inv) => [
      inv.invoice_number,
      clientMap[inv.client_id]?.company_name || "-",
      formatDateExport(inv.due_date),
      `${inv.days} hari`,
      formatRupiahExport(inv.total),
    ]);

  const overdueSummary = () => [
    { label: "Invoice Overdue", value: String(overdueStats.count) },
    { label: "Total Tunggakan", value: formatRupiah(overdueStats.totalTunggakan) },
    { label: "Rata-rata Terlambat", value: `${overdueStats.avgDays} hari` },
    { label: "Terlama", value: `${overdueStats.maxDays} hari` },
  ];

  const exportOverdue = () => {
    downloadCSVReport({
      filename: `laporan-overdue-${periodFrom || "semua"}_${periodTo || "periode"}.csv`,
      title: "Laporan Overdue",
      period,
      headers: ["No Invoice", "Client", "Jatuh Tempo", "Terlambat", "Total"],
      rows: overdueExportRows(),
    });
    showSuccess("Laporan overdue (CSV) berhasil diunduh.");
  };

  const exportOverduePdf = async () => {
    await downloadPDFReport({
      filename: `laporan-overdue-${periodFrom || "semua"}_${periodTo || "periode"}.pdf`,
      title: "Laporan Overdue",
      period,
      summary: overdueSummary(),
      headers: ["No Invoice", "Client", "Jatuh Tempo", "Terlambat", "Total"],
      rows: overdueExportRows(),
      colWidths: [1.3, 2, 1.2, 1, 1.3],
      aligns: [undefined, undefined, undefined, undefined, "right"],
    });
    showSuccess("Laporan overdue (PDF) berhasil diunduh.");
  };

  const reminderExportRows = () =>
    filteredReminders.map((r) => [
      r.invoice_number || "-",
      r.client_name || "-",
      r.reminder_type || "-",
      formatDateExport(r.due_date),
      formatDateTimeExport(r.scheduled_at),
      formatDateTimeExport(r.sent_at),
      reminderStatusConfig[r.status]?.label || r.status,
    ]);

  const reminderSummary = () => [
    { label: "Total Reminder", value: String(reminderStats.count) },
    { label: "Terkirim", value: String(reminderStats.sent) },
    { label: "Gagal", value: String(reminderStats.failed) },
    { label: "Success Rate", value: `${reminderStats.successRate}%` },
  ];

  const exportReminder = () => {
    downloadCSVReport({
      filename: `laporan-reminder-${periodFrom || "semua"}_${periodTo || "periode"}.csv`,
      title: "Laporan Reminder",
      period,
      headers: ["No Invoice", "Client", "Tipe", "Jatuh Tempo", "Jadwal Kirim", "Dikirim At", "Status"],
      rows: reminderExportRows(),
    });
    showSuccess("Laporan reminder (CSV) berhasil diunduh.");
  };

  const exportReminderPdf = async () => {
    await downloadPDFReport({
      filename: `laporan-reminder-${periodFrom || "semua"}_${periodTo || "periode"}.pdf`,
      title: "Laporan Reminder",
      period,
      summary: reminderSummary(),
      headers: ["No Invoice", "Client", "Tipe", "Jadwal Kirim", "Dikirim At", "Status"],
      rows: reminderExportRows(),
      colWidths: [1.3, 1.7, 0.8, 1.2, 1.4, 1.1],
    });
    showSuccess("Laporan reminder (PDF) berhasil diunduh.");
  };

  const handleExportAllCsv = () => {
    exportInvoice();
    exportPayment();
    exportOverdue();
    exportReminder();
    showSuccess("Semua laporan CSV berhasil diunduh.");
  };

  const handleExportAllPdf = async () => {
    await exportInvoicePdf();
    await exportPaymentPdf();
    await exportOverduePdf();
    await exportReminderPdf();
    showSuccess("Semua laporan PDF berhasil diunduh.");
  };

  const resetPeriod = () => {
    setPeriodFrom("");
    setPeriodTo("");
  };

  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];

  return (
    <div className="min-h-screen bg-[#fcf8ff] pt-16 md:pl-[280px]">
      <Sidebar />
      <Header role="superadmin" />

      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* ===================================================
            BANNER
        =================================================== */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-40 -top-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Super Admin Panel</p>
            <h1 className="mt-1 text-2xl font-bold">Laporan</h1>
            <p className="mt-1 text-sm text-white/80">
              Ringkasan invoice, pembayaran, tunggakan, dan reminder beserta export datanya.
            </p>
          </div>
        </div>

        {/* ===================================================
            TABS
        =================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const counts = {
              INVOICE: invoiceStats.count,
              PEMBAYARAN: paymentStats.count,
              OVERDUE: overdueStats.count,
              REMINDER: reminderStats.count,
              EXPORT: null,
            };
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative overflow-hidden rounded-2xl p-4 text-left transition ${
                  isActive
                    ? "bg-gradient-to-r from-[#3525cd] to-[#5b44f3] shadow-md"
                    : "border border-[#e8e6ee] bg-white shadow-sm hover:border-[#3525cd]/30 hover:shadow-md"
                }`}
              >
                <div
                  className={`absolute -right-5 -top-5 h-16 w-16 rounded-full ${
                    isActive ? "bg-white/10" : "bg-[#f3f1f7]"
                  }`}
                />
                <div className="relative flex items-start justify-between">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                      isActive ? "bg-white/20 text-white" : "bg-[#3525cd]/8 text-[#3525cd]"
                    }`}
                  >
                    <Icon size={17} />
                  </div>
                  {counts[tab.key] !== null && (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        isActive ? "bg-white/20 text-white" : "bg-[#f3f1f7] text-[#464555]"
                      }`}
                    >
                      {counts[tab.key]}
                    </span>
                  )}
                </div>
                <p className={`relative mt-3 text-sm font-bold ${isActive ? "text-white" : "text-[#191c1e]"}`}>
                  {tab.label}
                </p>
                <p className={`relative mt-0.5 text-[11px] ${isActive ? "text-white/75" : "text-[#9996a5]"}`}>
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* ===================================================
            FILTER PERIODE
        =================================================== */}

        {activeTab !== "EXPORT" && (
          <div className="mb-6 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#e5e2ea] bg-white p-4 shadow-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#9996a5]">
              <CalendarDays size={14} />
              Periode Laporan
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className="rounded-xl border border-[#e5e2ea] bg-[#faf9fc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/15"
              />
              <span className="text-xs font-semibold text-[#aaa7b5]">s/d</span>
              <input
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className="rounded-xl border border-[#e5e2ea] bg-[#faf9fc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/15"
              />
              {(periodFrom || periodTo) && (
                <button
                  type="button"
                  onClick={resetPeriod}
                  className="text-xs font-semibold text-[#3525cd] hover:underline"
                >
                  Reset periode
                </button>
              )}
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-sm">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {/* ===================================================
            CONTENT
        =================================================== */}

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e5e2ea] bg-white py-24 text-center">
            <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-[#f3f1f7] border-t-[#3525cd]" />
            <p className="mt-5 text-sm font-semibold text-[#8b8898]">Memuat data laporan...</p>
          </div>
        ) : activeTab === "INVOICE" ? (
          <InvoiceReport
            rows={filteredInvoices}
            stats={invoiceStats}
            clientMap={clientMap}
            tab={currentTab}
            onExport={exportInvoice}
            onExportPdf={exportInvoicePdf}
          />
        ) : activeTab === "PEMBAYARAN" ? (
          <PaymentReport
            rows={paymentRows}
            stats={paymentStats}
            tab={currentTab}
            onExport={exportPayment}
            onExportPdf={exportPaymentPdf}
          />
        ) : activeTab === "OVERDUE" ? (
          <OverdueReport
            rows={overdueRows}
            stats={overdueStats}
            clientMap={clientMap}
            tab={currentTab}
            onExport={exportOverdue}
            onExportPdf={exportOverduePdf}
          />
        ) : activeTab === "REMINDER" ? (
          <ReminderReport
            rows={filteredReminders}
            stats={reminderStats}
            tab={currentTab}
            onExport={exportReminder}
            onExportPdf={exportReminderPdf}
          />
        ) : (
          <ExportPanel
            periodFrom={periodFrom}
            periodTo={periodTo}
            setPeriodFrom={setPeriodFrom}
            setPeriodTo={setPeriodTo}
            resetPeriod={resetPeriod}
            invoiceCount={invoiceStats.count}
            paymentCount={paymentStats.count}
            overdueCount={overdueStats.count}
            reminderCount={reminderStats.count}
            onExportInvoice={exportInvoice}
            onExportPayment={exportPayment}
            onExportOverdue={exportOverdue}
            onExportReminder={exportReminder}
            onExportAll={handleExportAllCsv}
            onExportInvoicePdf={exportInvoicePdf}
            onExportPaymentPdf={exportPaymentPdf}
            onExportOverduePdf={exportOverduePdf}
            onExportReminderPdf={exportReminderPdf}
            onExportAllPdf={handleExportAllPdf}
          />
        )}
      </main>
    </div>
  );
}

/* =========================================================
   SHARED PIECES
======================================================== */

function StatCard({ title, value, subtitle, icon: Icon, className }) {
  return (
    <div className={`${className} relative overflow-hidden rounded-2xl p-5 text-white shadow-md`}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-4 right-12 h-16 w-16 rounded-full bg-white/10" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">{title}</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-white/70">{subtitle}</p>}
        </div>
        <div className="rounded-xl bg-white/20 p-2.5">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function ReportTable({ headers, children }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8e6ee] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#faf9fc] text-[10px] uppercase tracking-wider text-[#9996a5]">
            <tr>
              {headers.map((h) => (
                <th key={h} className="whitespace-nowrap px-5 py-3.5 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0edf3]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function EmptyState({ tab }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e5e2ea] bg-white py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f1f7] text-[#bbb8c6]">
        <Inbox size={28} />
      </div>
      <h3 className="mt-4 text-lg font-bold text-[#464555]">{tab.emptyTitle}</h3>
      <p className="mt-1 text-sm text-[#9996a5]">{tab.emptyText}</p>
    </div>
  );
}

function ExportButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-[#3525cd]/20 bg-[#3525cd]/5 px-4 py-2.5 text-sm font-semibold text-[#3525cd] transition hover:bg-[#3525cd]/10 sm:self-auto"
    >
      <Download size={15} />
      {children}
    </button>
  );
}

function ExportActions({ onCsv, onPdf }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
      <ExportButton onClick={onCsv}>
        <span className="inline-flex items-center gap-1.5">
          <FileSpreadsheet size={14} /> CSV
        </span>
      </ExportButton>
      <ExportButton onClick={onPdf}>
        <span className="inline-flex items-center gap-1.5">
          <FileText size={14} /> PDF
        </span>
      </ExportButton>
    </div>
  );
}

function StatusChip({ config, fallback }) {
  const sc = config || fallback;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${sc.text} ${sc.bg} ${sc.border}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${sc.dot || sc.color}`} />
      {sc.label}
    </span>
  );
}

/* =========================================================
   LAPORAN INVOICE
======================================================= */

function InvoiceReport({ rows, stats, clientMap, tab, onExport, onExportPdf }) {
  const pct = (v) => `${stats.count ? Math.round((v / stats.count) * 100) : 0}%`;

  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Invoice" value={stats.count} subtitle={formatRupiah(stats.totalNilai)} icon={Receipt} className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6]" />
        <StatCard title="Lunas" value={stats.lunas} subtitle={formatRupiah(stats.nilaiLunas)} icon={CheckCircle2} className="bg-gradient-to-r from-[#0d9488] to-[#14b8a6]" />
        <StatCard title="Belum Lunas" value={stats.belumLunas} subtitle={formatRupiah(stats.nilaiBelumLunas)} icon={Clock3} className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" />
        <StatCard title="Overdue" value={stats.overdue} subtitle={formatRupiah(stats.nilaiOverdue)} icon={AlertTriangle} className="bg-gradient-to-r from-[#dc2626] to-[#ef4444]" />
      </div>

      <div className="mb-6 rounded-2xl border border-[#e8e6ee] bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-[#9996a5]">Komposisi Status Invoice</p>
        <div className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-[#f3f1f7]">
          <div style={{ width: pct(stats.lunas) }} className={`${invoiceStatusConfig.PAID.bar} transition-all`} />
          <div style={{ width: pct(stats.terkirim) }} className={`${invoiceStatusConfig.SENT.bar} transition-all`} />
          <div style={{ width: pct(stats.unpaid) }} className={`${invoiceStatusConfig.UNPAID.bar} transition-all`} />
          <div style={{ width: pct(stats.overdue) }} className={`${invoiceStatusConfig.OVERDUE.bar} transition-all`} />
          <div style={{ width: pct(stats.dibatalkan) }} className={`${invoiceStatusConfig.CANCELLED.bar} transition-all`} />
          <div style={{ width: pct(stats.draft) }} className={`${invoiceStatusConfig.DRAFT.bar} transition-all`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
          {[
            { key: "PAID", name: "Lunas", count: stats.lunas },
            { key: "SENT", name: "Terkirim", count: stats.terkirim },
            { key: "UNPAID", name: "Belum Bayar", count: stats.unpaid },
            { key: "OVERDUE", name: "Overdue", count: stats.overdue },
            { key: "CANCELLED", name: "Dibatalkan", count: stats.dibatalkan },
            { key: "DRAFT", name: "Draft", count: stats.draft },
          ].map(({ key, name, count }) => {
            const sc = invoiceStatusConfig[key];
            return (
              <span key={key} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#646174]">
                <span className={`h-2.5 w-2.5 rounded-full ${sc.bar}`} />
                {name}: {count} ({pct(count)})
              </span>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#8b8898]">
          Menampilkan <span className="font-bold text-[#191c1e]">{rows.length}</span> invoice
        </p>
        <ExportActions onCsv={onExport} onPdf={onExportPdf} />
      </div>

      {rows.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ReportTable headers={["No Invoice", "Client", "Tanggal Invoice", "Jatuh Tempo", "Total", "Status"]}>
          {rows.map((inv) => (
            <tr key={inv.id} className="transition hover:bg-[#faf9fc]">
              <td className="px-5 py-4 font-bold text-[#191c1e]">{inv.invoice_number}</td>
              <td className="px-5 py-4 text-[#464555]">{clientMap[inv.client_id]?.company_name || "-"}</td>
              <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{formatDate(inv.invoice_date)}</td>
              <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{formatDate(inv.due_date)}</td>
              <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#191c1e]">{formatRupiah(inv.total)}</td>
              <td className="px-5 py-4">
                <StatusChip config={invoiceStatusConfig[inv.status]} fallback={invoiceStatusConfig.UNPAID} />
              </td>
            </tr>
          ))}
        </ReportTable>
      )}
    </>
  );
}

/* =========================================================
   LAPORAN PEMBAYARAN
======================================================= */

function PaymentReport({ rows, stats, tab, onExport, onExportPdf }) {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Transaksi" value={stats.count} subtitle="Seluruh pembayaran" icon={Receipt} className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6]" />
        <StatCard title="Disetujui" value={stats.diterima} subtitle={formatRupiah(stats.nilaiDiterima)} icon={CheckCircle2} className="bg-gradient-to-r from-[#0d9488] to-[#14b8a6]" />
        <StatCard title="Menunggu Verifikasi" value={stats.menunggu} subtitle={formatRupiah(stats.nilaiMenunggu)} icon={Clock3} className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" />
        <StatCard title="Ditolak" value={stats.ditolak} subtitle={formatRupiah(stats.nilaiDitolak)} icon={XCircle} className="bg-gradient-to-r from-[#dc2626] to-[#ef4444]" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#8b8898]">
          Menampilkan <span className="font-bold text-[#191c1e]">{rows.length}</span> pembayaran
        </p>
        <ExportActions onCsv={onExport} onPdf={onExportPdf} />
      </div>

      {rows.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ReportTable headers={["No Invoice", "Client", "Tanggal Bayar", "Metode", "Jumlah", "Status"]}>
          {rows.map((p) => (
            <tr key={p.id} className="transition hover:bg-[#faf9fc]">
              <td className="px-5 py-4 font-bold text-[#191c1e]">{p.invoice_number}</td>
              <td className="px-5 py-4 text-[#464555]">{p.client_name}</td>
              <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{formatDate(p.payment_date || p.created_at)}</td>
              <td className="px-5 py-4 text-[#464555]">{p.payment_method || "-"}</td>
              <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#191c1e]">{formatRupiah(p.amount)}</td>
              <td className="px-5 py-4">
                <StatusChip config={paymentStatusConfig[p.status]} fallback={paymentStatusConfig.PENDING} />
              </td>
            </tr>
          ))}
        </ReportTable>
      )}
    </>
  );
}

/* =========================================================
   LAPORAN OVERDUE
======================================================= */

function OverdueReport({ rows, stats, clientMap, tab, onExport, onExportPdf }) {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Invoice Overdue" value={stats.count} subtitle="Melewati jatuh tempo" icon={AlertTriangle} className="bg-gradient-to-r from-[#dc2626] to-[#ef4444]" />
        <StatCard title="Total Tunggakan" value={formatRupiah(stats.totalTunggakan)} subtitle="Belum dibayar" icon={Wallet} className="bg-gradient-to-r from-[#b91c1c] to-[#ef4444]" />
        <StatCard title="Rata-rata Terlambat" value={`${stats.avgDays} hari`} subtitle="Usia keterlambatan" icon={Clock3} className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" />
        <StatCard title="Terlama" value={`${stats.maxDays} hari`} subtitle="Keterlambatan terbesar" icon={CalendarDays} className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6]" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#8b8898]">
          Menampilkan <span className="font-bold text-[#191c1e]">{rows.length}</span> invoice overdue
        </p>
        <ExportActions onCsv={onExport} onPdf={onExportPdf} />
      </div>

      {rows.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ReportTable headers={["No Invoice", "Client", "Jatuh Tempo", "Terlambat", "Total"]}>
          {rows.map((inv) => (
            <tr key={inv.id} className="transition hover:bg-[#faf9fc]">
              <td className="px-5 py-4 font-bold text-[#191c1e]">{inv.invoice_number}</td>
              <td className="px-5 py-4 text-[#464555]">{clientMap[inv.client_id]?.company_name || "-"}</td>
              <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{formatDate(inv.due_date)}</td>
              <td className="px-5 py-4">
                <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                  {inv.days} hari
                </span>
              </td>
              <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#191c1e]">{formatRupiah(inv.total)}</td>
            </tr>
          ))}
        </ReportTable>
      )}
    </>
  );
}

/* =========================================================
   LAPORAN REMINDER
======================================================= */

function ReminderReport({ rows, stats, tab, onExport, onExportPdf }) {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Total Reminder" value={stats.count} subtitle="Seluruh reminder pada periode" icon={Bell} className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6]" />
        <StatCard title="Terkirim" value={stats.sent} subtitle={`${stats.pending} menunggu jadwal`} icon={CheckCircle2} className="bg-gradient-to-r from-[#0d9488] to-[#14b8a6]" />
        <StatCard title="Gagal" value={stats.failed} subtitle={`${stats.skipped} dilewati`} icon={AlertTriangle} className="bg-gradient-to-r from-[#dc2626] to-[#ef4444]" />
        <StatCard title="Success Rate" value={`${stats.successRate}%`} subtitle="Dari reminder terproses" icon={Clock3} className="bg-gradient-to-r from-[#3525cd] to-[#5b44f3]" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#8b8898]">
          Menampilkan <span className="font-bold text-[#191c1e]">{rows.length}</span> reminder
        </p>
        <ExportActions onCsv={onExport} onPdf={onExportPdf} />
      </div>

      {rows.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ReportTable
          headers={["No Invoice", "Client", "Tipe", "Jatuh Tempo", "Jadwal Kirim", "Dikirim At", "Status"]}
        >
          {rows.map((r) => (
            <tr key={r.id} className="transition hover:bg-[#faf9fc]">
              <td className="px-5 py-4 font-bold text-[#191c1e]">{r.invoice_number || "-"}</td>
              <td className="px-5 py-4 text-[#464555]">{r.client_name || "-"}</td>
              <td className="px-5 py-4 font-semibold text-[#464555]">{r.reminder_type || "-"}</td>
              <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{formatDate(r.due_date)}</td>
              <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{formatDateTimeExport(r.scheduled_at)}</td>
              <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{formatDateTimeExport(r.sent_at)}</td>
              <td className="px-5 py-4">
                <StatusChip config={reminderStatusConfig[r.status]} fallback={reminderStatusConfig.PENDING} />
              </td>
            </tr>
          ))}
        </ReportTable>
      )}
    </>
  );
}

/* =========================================================
   EXPORT PANEL
======================================================= */

function ExportPanel({
  periodFrom,
  periodTo,
  setPeriodFrom,
  setPeriodTo,
  resetPeriod,
  invoiceCount,
  paymentCount,
  overdueCount,
  reminderCount,
  onExportInvoice,
  onExportPayment,
  onExportOverdue,
  onExportReminder,
  onExportAll,
  onExportInvoicePdf,
  onExportPaymentPdf,
  onExportOverduePdf,
  onExportReminderPdf,
  onExportAllPdf,
}) {
  const exports = [
    {
      title: "Laporan Invoice",
      description: "Rekap seluruh invoice beserta status lunas, belum lunas, dan overdue.",
      count: `${invoiceCount} invoice`,
      icon: FileText,
      onClick: onExportInvoice,
      onClickPdf: onExportInvoicePdf,
    },
    {
      title: "Laporan Pembayaran",
      description: "Riwayat pembayaran masuk lengkap dengan metode dan status verifikasinya.",
      count: `${paymentCount} pembayaran`,
      icon: CreditCard,
      onClick: onExportPayment,
      onClickPdf: onExportPaymentPdf,
    },
    {
      title: "Laporan Overdue",
      description: "Daftar invoice yang melewati jatuh tempo beserta usia keterlambatannya.",
      count: `${overdueCount} invoice`,
      icon: AlertTriangle,
      onClick: onExportOverdue,
      onClickPdf: onExportOverduePdf,
    },
    {
      title: "Laporan Reminder",
      description: "Aktivitas pengingat WhatsApp: jadwal kirim, terkirim, gagal, dan dilewati.",
      count: `${reminderCount} reminder`,
      icon: Bell,
      onClick: onExportReminder,
      onClickPdf: onExportReminderPdf,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#e8e6ee] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#9996a5]">Periode Export</p>
            <p className="mt-1 text-sm text-[#8b8898]">Kosongkan kedua tanggal untuk mengexport seluruh data.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              value={periodFrom}
              onChange={(e) => setPeriodFrom(e.target.value)}
              className="rounded-xl border border-[#e5e2ea] bg-[#faf9fc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/15"
            />
            <span className="text-xs font-semibold text-[#aaa7b5]">s/d</span>
            <input
              type="date"
              value={periodTo}
              onChange={(e) => setPeriodTo(e.target.value)}
              className="rounded-xl border border-[#e5e2ea] bg-[#faf9fc] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/15"
            />
            {(periodFrom || periodTo) && (
              <button type="button" onClick={resetPeriod} className="text-xs font-semibold text-[#3525cd] hover:underline">
                Reset periode
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={onExportAll}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] py-4 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <FileSpreadsheet size={18} />
          Export Semua Laporan (CSV)
        </button>
        <button
          type="button"
          onClick={onExportAllPdf}
          className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#b02463] to-[#e0447c] py-4 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
        >
          <FileText size={18} />
          Export Semua Laporan (PDF)
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        {exports.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.title}
              className="flex flex-col rounded-2xl border border-[#e8e6ee] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3525cd]/8 text-[#3525cd]">
                  <Icon size={20} />
                </div>
                <span className="rounded-full bg-[#f3f1f7] px-2.5 py-0.5 text-[11px] font-bold text-[#464555]">
                  {item.count}
                </span>
              </div>
              <p className="mt-4 text-sm font-bold text-[#191c1e]">{item.title}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-[#9996a5]">{item.description}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={item.onClick}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#3525cd] py-2.5 text-xs font-bold text-white transition hover:bg-[#2c20ae]"
                >
                  <FileSpreadsheet size={14} />
                  CSV
                </button>
                <button
                  type="button"
                  onClick={item.onClickPdf}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#b02463]/25 bg-[#b02463]/5 py-2.5 text-xs font-bold text-[#b02463] transition hover:bg-[#b02463]/10"
                >
                  <FileText size={14} />
                  PDF
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
