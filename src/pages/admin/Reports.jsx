import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import {
  AlertTriangle,
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
import { getClients } from "../../services/clientApi";

/* =========================================================
   HELPERS
========================================================= */

const formatRupiah = (v) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v || 0);

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

const DAY_MS = 24 * 60 * 60 * 1000;

const daysOverdue = (dueDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((today - new Date(dueDate).getTime()) / DAY_MS));
};

const isInvoiceOverdue = (inv) =>
  inv.status === "OVERDUE" ||
  (inv.status !== "PAID" && new Date(inv.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0));

const inRange = (dateStr, from, to) => {
  if (!dateStr) return true;
  const t = new Date(dateStr).setHours(0, 0, 0, 0);
  if (from && t < new Date(from).setHours(0, 0, 0, 0)) return false;
  if (to && t > new Date(to).setHours(0, 0, 0, 0)) return false;
  return true;
};

const toCSV = (headers, rows) =>
  ["\uFEFF" + headers.join(";"), ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))].join("\r\n");

const downloadCSV = (filename, csv) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
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
    key: "EXPORT",
    label: "Export Data",
    description: "Unduh laporan dalam format CSV",
    icon: Download,
    emptyTitle: "",
    emptyText: "",
  },
];

const invoiceStatusConfig = {
  PAID:    { label: "Lunas",        color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", bar: "bg-emerald-500" },
  SENT:    { label: "Terkirim",     color: "bg-blue-500",    text: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200",    bar: "bg-blue-500" },
  UNPAID:  { label: "Belum Lunas",  color: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   bar: "bg-amber-500" },
  OVERDUE: { label: "Overdue",      color: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200",     bar: "bg-red-500" },
};

const paymentStatusConfig = {
  PENDING:  { label: "Menunggu Verifikasi", text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  VERIFIED: { label: "Terverifikasi",       text: "text-blue-700",    bg: "bg-blue-50",    border: "border-blue-200" },
  APPROVED: { label: "Disetujui",           text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  REJECTED: { label: "Ditolak",             text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
};

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AdminReports() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState("INVOICE");
  const [periodFrom, setPeriodFrom] = useState("");
  const [periodTo, setPeriodTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const [invoiceData, paymentData, clientData] = await Promise.all([
          getInvoices(),
          getPayments(),
          getClients(1, 1000),
        ]);
        if (!ignore) {
          setInvoices(invoiceData || []);
          setPayments(paymentData || []);
          setClients((clientData && clientData.data) || clientData || []);
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Gagal memuat data laporan dari server.");
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => { ignore = true; };
  }, []);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const clientMap = useMemo(() => {
    const map = {};
    clients.forEach((c) => { map[c.id] = c; });
    return map;
  }, [clients]);

  const invoiceById = useMemo(() => {
    const map = {};
    invoices.forEach((inv) => { map[inv.id] = inv; });
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
    let totalNilai = 0, lunas = 0, nilaiLunas = 0, terkirim = 0, nilaiTerkirim = 0;
    let belumLunas = 0, nilaiBelumLunas = 0, overdue = 0, nilaiOverdue = 0;
    filteredInvoices.forEach((inv) => {
      totalNilai += inv.total || 0;
      if (isInvoiceOverdue(inv)) {
        overdue += 1;
        nilaiOverdue += inv.total || 0;
      } else if (inv.status === "PAID") {
        lunas += 1;
        nilaiLunas += inv.total || 0;
      } else if (inv.status === "SENT") {
        terkirim += 1;
        nilaiTerkirim += inv.total || 0;
      } else {
        belumLunas += 1;
        nilaiBelumLunas += inv.total || 0;
      }
    });
    return { count: filteredInvoices.length, totalNilai, lunas, nilaiLunas, terkirim, nilaiTerkirim, belumLunas, nilaiBelumLunas, overdue, nilaiOverdue };
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
          invoice_number: inv?.invoice_number || "-",
          client_name: inv ? clientMap[inv.client_id]?.company_name || "-" : "-",
        };
      }),
    [filteredPayments, invoiceById, clientMap]
  );

  const paymentStats = useMemo(() => {
    let diterima = 0, nilaiDiterima = 0, menunggu = 0, nilaiMenunggu = 0, ditolak = 0, nilaiDitolak = 0;
    filteredPayments.forEach((p) => {
      if (p.status === "VERIFIED" || p.status === "APPROVED") {
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
    return { count: filteredPayments.length, diterima, nilaiDiterima, menunggu, nilaiMenunggu, ditolak, nilaiDitolak };
  }, [filteredPayments]);

  const methodBreakdown = useMemo(() => {
    const map = {};
    filteredPayments.forEach((p) => {
      if (p.status !== "VERIFIED" && p.status !== "APPROVED") return;
      const key = p.payment_method || "Tidak disebutkan";
      if (!map[key]) map[key] = { method: key, count: 0, total: 0 };
      map[key].count += 1;
      map[key].total += p.amount || 0;
    });
    const list = Object.values(map).sort((a, b) => b.total - a.total);
    const maxTotal = list.length ? list[0].total : 0;
    return { list, maxTotal };
  }, [filteredPayments]);

  /* ---------- LAPORAN OVERDUE ---------- */

  const overdueRows = useMemo(
    () =>
      invoices
        .filter((inv) => isInvoiceOverdue(inv) && inRange(inv.due_date, periodFrom, periodTo))
        .map((inv) => ({ ...inv, days: daysOverdue(inv.due_date) }))
        .sort((a, b) => b.days - a.days),
    [invoices, periodFrom, periodTo]
  );

  const overdueStats = useMemo(() => {
    const totalTunggakan = overdueRows.reduce((s, inv) => s + (inv.total || 0), 0);
    const avgDays = overdueRows.length ? Math.round(overdueRows.reduce((s, r) => s + r.days, 0) / overdueRows.length) : 0;
    const maxDays = overdueRows.length ? overdueRows[0].days : 0;
    return { count: overdueRows.length, totalTunggakan, avgDays, maxDays };
  }, [overdueRows]);

  /* ---------- EXPORT ---------- */

  const exportInvoice = () => {
    const csv = toCSV(
      ["No Invoice", "Client", "Tanggal Invoice", "Jatuh Tempo", "Subtotal", "Pajak", "Total", "Status"],
      filteredInvoices.map((inv) => [
        inv.invoice_number,
        clientMap[inv.client_id]?.company_name || "-",
        formatDate(inv.invoice_date),
        formatDate(inv.due_date),
        inv.subtotal ?? 0,
        inv.tax ?? 0,
        inv.total ?? 0,
        invoiceStatusConfig[inv.status]?.label || inv.status,
      ])
    );
    downloadCSV(`laporan-invoice-${periodFrom || "semua"}_${periodTo || "periode"}.csv`, csv);
    showSuccess("Laporan invoice berhasil diunduh.");
  };

  const exportPayment = () => {
    const csv = toCSV(
      ["No Invoice", "Client", "Tanggal Bayar", "Metode", "Jumlah", "Status"],
      paymentRows.map((p) => [
        p.invoice_number,
        p.client_name,
        formatDate(p.payment_date || p.created_at),
        p.payment_method || "-",
        p.amount ?? 0,
        paymentStatusConfig[p.status]?.label || p.status,
      ])
    );
    downloadCSV(`laporan-pembayaran-${periodFrom || "semua"}_${periodTo || "periode"}.csv`, csv);
    showSuccess("Laporan pembayaran berhasil diunduh.");
  };

  const exportOverdue = () => {
    const csv = toCSV(
      ["No Invoice", "Client", "Jatuh Tempo", "Hari Terlambat", "Total", "Status"],
      overdueRows.map((inv) => [
        inv.invoice_number,
        clientMap[inv.client_id]?.company_name || "-",
        formatDate(inv.due_date),
        inv.days,
        inv.total ?? 0,
        "Overdue",
      ])
    );
    downloadCSV(`laporan-overdue-${periodFrom || "semua"}_${periodTo || "periode"}.csv`, csv);
    showSuccess("Laporan overdue berhasil diunduh.");
  };

  const handleExportAll = () => {
    exportInvoice();
    exportPayment();
    exportOverdue();
    showSuccess("Semua laporan berhasil diunduh.");
  };

  const resetPeriod = () => { setPeriodFrom(""); setPeriodTo(""); };

  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];

  return (
    <div className="min-h-screen bg-[#fcf8ff] pt-16 app-content">
      <Sidebar role="admin" />
      <Header />
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">

        {/* ===================================================
            BANNER
        =================================================== */}

        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-40 -top-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-bold">Laporan</h1>
            <p className="mt-1 text-sm text-white/80">Ringkasan invoice, pembayaran, dan tunggakan beserta export datanya.</p>
          </div>
        </div>

        {/* ===================================================
            TABS — Invoice / Pembayaran / Overdue / Export
        =================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            const counts = {
              INVOICE: invoiceStats.count,
              PEMBAYARAN: paymentStats.count,
              OVERDUE: overdueStats.count,
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
                <div className={`absolute -right-5 -top-5 h-16 w-16 rounded-full ${isActive ? "bg-white/10" : "bg-[#f3f1f7]"}`} />
                <div className="relative flex items-start justify-between">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${isActive ? "bg-white/20 text-white" : "bg-[#3525cd]/8 text-[#3525cd]"}`}>
                    <Icon size={17} />
                  </div>
                  {counts[tab.key] !== null && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${isActive ? "bg-white/20 text-white" : "bg-[#f3f1f7] text-[#464555]"}`}>
                      {counts[tab.key]}
                    </span>
                  )}
                </div>
                <p className={`relative mt-3 text-sm font-bold ${isActive ? "text-white" : "text-[#191c1e]"}`}>{tab.label}</p>
                <p className={`relative mt-0.5 text-[11px] ${isActive ? "text-white/75" : "text-[#9996a5]"}`}>{tab.description}</p>
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
            <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-[#f3f1f7] border-t-[#3525cd]">
              <span className="sr-only">Memuat data...</span>
            </div>
            <p className="mt-5 text-sm font-semibold text-[#8b8898]">Memuat data laporan...</p>
          </div>
        ) : activeTab === "INVOICE" ? (
          <InvoiceReport
            rows={filteredInvoices}
            stats={invoiceStats}
            clientMap={clientMap}
            tab={currentTab}
            onExport={exportInvoice}
          />
        ) : activeTab === "PEMBAYARAN" ? (
          <PaymentReport
            rows={paymentRows}
            stats={paymentStats}
            breakdown={methodBreakdown}
            tab={currentTab}
            onExport={exportPayment}
          />
        ) : activeTab === "OVERDUE" ? (
          <OverdueReport
            rows={overdueRows}
            stats={overdueStats}
            clientMap={clientMap}
            tab={currentTab}
            onExport={exportOverdue}
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
            onExportInvoice={exportInvoice}
            onExportPayment={exportPayment}
            onExportOverdue={exportOverdue}
            onExportAll={handleExportAll}
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
        <div className="rounded-xl bg-white/20 p-2.5"><Icon size={20} /></div>
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
                <th key={h} className="whitespace-nowrap px-5 py-3.5 font-semibold">{h}</th>
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

/* =========================================================
   LAPORAN INVOICE
======================================================== */

function InvoiceReport({ rows, stats, clientMap, tab, onExport }) {
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
          <div style={{ width: pct(stats.belumLunas) }} className={`${invoiceStatusConfig.UNPAID.bar} transition-all`} />
          <div style={{ width: pct(stats.overdue) }} className={`${invoiceStatusConfig.OVERDUE.bar} transition-all`} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5">
          {[
            { key: "PAID", count: stats.lunas },
            { key: "SENT", count: stats.terkirim },
            { key: "UNPAID", count: stats.belumLunas },
            { key: "OVERDUE", count: stats.overdue },
          ].map(({ key, count }) => {
            const sc = invoiceStatusConfig[key];
            return (
              <span key={key} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#646174]">
                <span className={`h-2.5 w-2.5 rounded-full ${sc.bar}`} />
                {sc.label}: {count} ({pct(count)})
              </span>
            );
          })}
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#8b8898]">
          Menampilkan <span className="font-bold text-[#191c1e]">{rows.length}</span> invoice
        </p>
        <ExportButton onClick={onExport}>Export CSV</ExportButton>
      </div>

      {rows.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <ReportTable headers={["No Invoice", "Client", "Tanggal Invoice", "Jatuh Tempo", "Total", "Status"]}>
          {rows.map((inv) => {
            const sc = invoiceStatusConfig[inv.status] || invoiceStatusConfig.UNPAID;
            return (
              <tr key={inv.id} className="transition hover:bg-[#faf9fc]">
                <td className="px-5 py-4 font-bold text-[#191c1e]">{inv.invoice_number}</td>
                <td className="px-5 py-4 text-[#464555]">{clientMap[inv.client_id]?.company_name || "-"}</td>
                <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{formatDate(inv.invoice_date)}</td>
                <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{formatDate(inv.due_date)}</td>
                <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#191c1e]">{formatRupiah(inv.total)}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${sc.text} ${sc.bg} ${sc.border}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${sc.color}`} />
                    {sc.label}
                  </span>
                </td>
              </tr>
            );
          })}
        </ReportTable>
      )}
    </>
  );
}

/* =========================================================
   LAPORAN PEMBAYARAN
======================================================== */

function PaymentReport({ rows, stats, breakdown, tab, onExport }) {
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Transaksi" value={stats.count} subtitle="Seluruh pembayaran" icon={Receipt} className="bg-gradient-to-r from-[#2563eb] to-[#3b82f6]" />
        <StatCard title="Dana Diterima" value={stats.diterima} subtitle={formatRupiah(stats.nilaiDiterima)} icon={CheckCircle2} className="bg-gradient-to-r from-[#0d9488] to-[#14b8a6]" />
        <StatCard title="Menunggu Verifikasi" value={stats.menunggu} subtitle={formatRupiah(stats.nilaiMenunggu)} icon={Clock3} className="bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" />
        <StatCard title="Ditolak" value={stats.ditolak} subtitle={formatRupiah(stats.nilaiDitolak)} icon={XCircle} className="bg-gradient-to-r from-[#dc2626] to-[#ef4444]" />
      </div>

      {breakdown.list.length > 0 && (
        <div className="mb-6 rounded-2xl border border-[#e8e6ee] bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-[#9996a5]">Dana Masuk per Metode Pembayaran</p>
          <div className="mt-4 space-y-3.5">
            {breakdown.list.map((m) => (
              <div key={m.method}>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-bold text-[#464555]">{m.method} <span className="font-medium text-[#9996a5]">&middot; {m.count}x</span></span>
                  <span className="font-semibold text-[#191c1e]">{formatRupiah(m.total)}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#f3f1f7]">
                  <div
                    style={{ width: `${breakdown.maxTotal ? Math.round((m.total / breakdown.maxTotal) * 100) : 0}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-[#3525cd] to-[#5b44f3]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[#8b8898]">
          Menampilkan <span className="font-bold text-[#191c1e]">{rows.length}</span> pembayaran
        </p>
        <ExportButton onClick={onExport}>Export CSV</ExportButton>
      </div>

      {rows.length === 0 ? (
        <EmptyState tab={tab} />
      ) : (
        <PaymentTable rows={rows} />
      )}
    </>
  );
}

function PaymentTable({ rows }) {
  return (
    <ReportTable headers={["No Invoice", "Client", "Tanggal Bayar", "Metode", "Jumlah", "Status"]}>
      {rows.map((p) => {
        const sc = paymentStatusConfig[p.status] || paymentStatusConfig.PENDING;
        return (
          <tr key={p.id} className="transition hover:bg-[#faf9fc]">
            <td className="px-5 py-4 font-bold text-[#191c1e]">{p.invoice_number}</td>
            <td className="px-5 py-4 text-[#464555]">{p.client_name}</td>
            <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{formatDate(p.payment_date || p.created_at)}</td>
            <td className="px-5 py-4 text-[#464555]">{p.payment_method || "-"}</td>
            <td className="whitespace-nowrap px-5 py-4 font-semibold text-[#191c1e]">{formatRupiah(p.amount)}</td>
            <td className="px-5 py-4">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${sc.text} ${sc.bg} ${sc.border}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  p.status === "APPROVED" ? "bg-emerald-500" :
                  p.status === "VERIFIED" ? "bg-blue-500" :
                  p.status === "REJECTED" ? "bg-red-500" : "bg-amber-500"
                }`} />
                {sc.label}
              </span>
            </td>
          </tr>
        );
      })}
    </ReportTable>
  );
}

/* =========================================================
   LAPORAN OVERDUE
======================================================== */

function OverdueReport({ rows, stats, clientMap, tab, onExport }) {
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
        <ExportButton onClick={onExport}>Export CSV</ExportButton>
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
   EXPORT PANEL
======================================================== */

function ExportPanel({ periodFrom, periodTo, setPeriodFrom, setPeriodTo, resetPeriod, invoiceCount, paymentCount, overdueCount, onExportInvoice, onExportPayment, onExportOverdue, onExportAll }) {
  const exports = [
    {
      title: "Laporan Invoice",
      description: "Rekap seluruh invoice beserta status lunas, belum lunas, dan overdue.",
      count: `${invoiceCount} invoice`,
      icon: FileText,
      onClick: onExportInvoice,
    },
    {
      title: "Laporan Pembayaran",
      description: "Riwayat pembayaran masuk lengkap dengan metode dan status verifikasi.",
      count: `${paymentCount} pembayaran`,
      icon: CreditCard,
      onClick: onExportPayment,
    },
    {
      title: "Laporan Overdue",
      description: "Daftar invoice yang melewati jatuh tempo beserta usia keterlambatannya.",
      count: `${overdueCount} invoice`,
      icon: AlertTriangle,
      onClick: onExportOverdue,
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

      <button
        type="button"
        onClick={onExportAll}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] py-4 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <FileSpreadsheet size={18} />
        Export Semua Laporan (CSV)
      </button>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {exports.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex flex-col rounded-2xl border border-[#e8e6ee] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3525cd]/8 text-[#3525cd]">
                  <Icon size={20} />
                </div>
                <span className="rounded-full bg-[#f3f1f7] px-2.5 py-0.5 text-[11px] font-bold text-[#464555]">{item.count}</span>
              </div>
              <p className="mt-4 text-sm font-bold text-[#191c1e]">{item.title}</p>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-[#9996a5]">{item.description}</p>
              <button
                type="button"
                onClick={item.onClick}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#3525cd] py-2.5 text-xs font-bold text-white transition hover:bg-[#2c20ae]"
              >
                <Download size={14} />
                Download CSV
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
