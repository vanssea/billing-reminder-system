import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Eye,
  FileText,
  History,
  Inbox,
  RefreshCw,
  Search,
  Send,
  SkipForward,
  X,
} from "lucide-react";

import { getReminders, retryReminder } from "../../services/reminderApi";
import { useAuth } from "../../context/AuthContext";

/* =========================================================
   CONFIG
========================================================= */

const reminderTypes = ["H-30", "H-14", "H-10", "H-7", "H-3", "H-1"];

const typeConfig = {
  "H-30": { label: "H-30", description: "30 hari sebelum jatuh tempo", color: "bg-indigo-500" },
  "H-14": { label: "H-14", description: "14 hari sebelum jatuh tempo", color: "bg-blue-500" },
  "H-10": { label: "H-10", description: "10 hari sebelum jatuh tempo", color: "bg-cyan-500" },
  "H-7":  { label: "H-7",  description: "7 hari sebelum jatuh tempo",  color: "bg-sky-500" },
  "H-3":  { label: "H-3",  description: "3 hari sebelum jatuh tempo",  color: "bg-amber-500" },
  "H-1":  { label: "H-1",  description: "1 hari sebelum jatuh tempo",  color: "bg-red-500" },
};

const statusConfig = {
  PENDING:  { label: "Terjadwal", color: "bg-amber-500",   text: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200" },
  SENT:     { label: "Terkirim",  color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  FAILED:   { label: "Gagal",     color: "bg-red-500",     text: "text-red-700",     bg: "bg-red-50",     border: "border-red-200" },
  SKIPPED:  { label: "Dilewati",  color: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-50",   border: "border-slate-200" },
};

const tabs = [
  {
    key: "JADWAL",
    label: "Jadwal Reminder",
    description: "Menunggu jadwal kirim WhatsApp",
    icon: CalendarClock,
    match: (r) => r.status === "PENDING",
    emptyTitle: "Tidak ada jadwal reminder",
    emptyText: "Reminder yang menunggu jadwal kirim akan tampil di sini.",
  },
  {
    key: "TERKIRIM",
    label: "Sudah Dikirim",
    description: "Reminder berhasil terkirim ke client",
    icon: Send,
    match: (r) => r.status === "SENT",
    emptyTitle: "Belum ada reminder terkirim",
    emptyText: "Reminder yang sudah terkirim via WhatsApp akan tampil di sini.",
  },
  {
    key: "GAGAL",
    label: "Reminder Gagal",
    description: "Perlu dicek dan dicoba kirim ulang",
    icon: AlertCircle,
    match: (r) => r.status === "FAILED",
    emptyTitle: "Tidak ada reminder gagal",
    emptyText: "Bagus! Semua reminder berhasil dikirim tanpa kendala.",
  },
  {
    key: "DILEWATI",
    label: "Dilewati",
    description: "Reminder yang dilewati sistem",
    icon: SkipForward,
    match: (r) => r.status === "SKIPPED",
    emptyTitle: "Tidak ada reminder dilewati",
    emptyText: "Reminder yang dilewati sistem akan tampil di sini.",
  },
  {
    key: "HISTORY",
    label: "History",
    description: "Seluruh riwayat reminder invoice",
    icon: History,
    match: () => true,
    emptyTitle: "Tidak ada reminder ditemukan",
    emptyText: "Riwayat seluruh reminder akan tampil di sini.",
  },
];

/* =========================================================
   HELPERS
========================================================= */

const formatDate = (v) =>
  v ? new Date(v).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "-";

const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AdminReminders() {
  const { accessToken } = useAuth();
  const [reminders, setReminders] = useState([]);
  const [activeTab, setActiveTab] = useState("JADWAL");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("NEWEST");
  const [selectedReminder, setSelectedReminder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadReminders = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getReminders(accessToken);
      setReminders(data || []);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data reminder dari server.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    const timer = setTimeout(loadReminders, 0);
    return () => clearTimeout(timer);
  }, [loadReminders]);

  useEffect(() => {
    document.body.style.overflow = selectedReminder ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [selectedReminder]);

  const showSuccess = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const stats = useMemo(() => {
    const total = reminders.length;
    const pending = reminders.filter((r) => r.status === "PENDING").length;
    const sent = reminders.filter((r) => r.status === "SENT").length;
    const failed = reminders.filter((r) => r.status === "FAILED").length;
    const skipped = reminders.filter((r) => r.status === "SKIPPED").length;
    return { total, pending, sent, failed, skipped };
  }, [reminders]);

  const tabCounts = useMemo(
    () => ({
      JADWAL: stats.pending,
      TERKIRIM: stats.sent,
      GAGAL: stats.failed,
      DILEWATI: stats.skipped,
      HISTORY: stats.total,
    }),
    [stats]
  );

  const currentTab = tabs.find((t) => t.key === activeTab) || tabs[0];

  const filteredReminders = useMemo(() => {
    const kw = search.toLowerCase().trim();
    const filtered = reminders.filter((r) => {
      const matchTab = currentTab.match(r);
      const matchSearch =
        r.id.toLowerCase().includes(kw) ||
        r.invoice_number.toLowerCase().includes(kw) ||
        r.client_name.toLowerCase().includes(kw);
      const matchType = typeFilter === "ALL" || r.reminder_type === typeFilter;
      return matchTab && matchSearch && matchType;
    });
    const sortField = activeTab === "JADWAL" ? "scheduled_at" : "created_at";
    return [...filtered].sort((a, b) => {
      const ta = new Date(a[sortField]).getTime();
      const tb = new Date(b[sortField]).getTime();
      return sortOrder === "NEWEST" ? tb - ta : ta - tb;
    });
  }, [reminders, currentTab, activeTab, search, typeFilter, sortOrder]);

  const handleRetry = async (reminder) => {
    try {
      setError("");
      await retryReminder(reminder.id, accessToken);
      setSelectedReminder(null);
      showSuccess("Reminder dimasukkan kembali ke antrean WhatsApp.");
      await loadReminders();
    } catch (err) {
      console.error(err);
      setError("Gagal memproses retry reminder.");
    }
  };

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
            <h1 className="mt-1 text-2xl font-bold">Reminder</h1>
            <p className="mt-1 text-sm text-white/80">Pantau jadwal, pengiriman, dan riwayat reminder WhatsApp invoice ke client.</p>
          </div>
        </div>

        {/* ===================================================
            TABS — Jadwal / Terkirim / Gagal / History
        =================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
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
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${isActive ? "bg-white/20 text-white" : "bg-[#f3f1f7] text-[#464555]"}`}>
                    {tabCounts[tab.key]}
                  </span>
                </div>
                <p className={`relative mt-3 text-sm font-bold ${isActive ? "text-white" : "text-[#191c1e]"}`}>{tab.label}</p>
                <p className={`relative mt-0.5 text-[11px] ${isActive ? "text-white/75" : "text-[#9996a5]"}`}>{tab.description}</p>
              </button>
            );
          })}
        </div>

        {/* ===================================================
            STATS
        =================================================== */}

        <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { title: "Total Reminder", value: stats.total, description: "Keseluruhan reminder invoice", icon: Bell, className: "bg-gradient-to-r from-[#2563eb] to-[#3b82f6]" },
            { title: "Terjadwal", value: stats.pending, description: "Menunggu jadwal kirim", icon: Clock3, className: "bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" },
            { title: "Terkirim", value: stats.sent, description: "Sudah sampai ke client", icon: Send, className: "bg-gradient-to-r from-[#0d9488] to-[#14b8a6]" },
            { title: "Gagal", value: stats.failed, description: "Gagal terkirim via WhatsApp", icon: AlertCircle, className: "bg-gradient-to-r from-[#dc2626] to-[#ef4444]" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className={`${s.className} relative overflow-hidden rounded-2xl p-5 text-white shadow-md`}>
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 right-12 h-16 w-16 rounded-full bg-white/10" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{s.title}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{s.value}</p>
                    <p className="mt-1 text-xs text-white/70">{s.description}</p>
                  </div>
                  <div className="rounded-xl bg-white/20 p-2.5"><Icon size={20} /></div>
                </div>
              </div>
            );
          })}
        </div>

        {successMessage && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
            <CheckCircle2 size={18} />
            {successMessage}
          </div>
        )}

        {/* ===================================================
            FILTER BAR
        =================================================== */}

        <div className="mb-6 rounded-2xl border border-[#e5e2ea] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">

            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a97a9]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari invoice atau client..."
                className="w-full rounded-xl border border-[#e0e3e5] bg-white py-2.5 pl-9 pr-3 text-sm text-[#191c1e] shadow-sm outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-[#f3f1f7] p-1">
              {[{ key: "NEWEST", label: "Terbaru" }, { key: "OLDEST", label: "Terlama" }].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setSortOrder(s.key)}
                  className={`rounded-lg px-3.5 py-2 text-xs font-bold transition ${
                    sortOrder === s.key ? "bg-white text-[#3525cd] shadow-sm" : "text-[#8b8898] hover:text-[#464555]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-xs font-semibold text-[#9996a5]">Tipe:</span>
              {["ALL", ...reminderTypes].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeFilter(t)}
                  className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                    typeFilter === t
                      ? "bg-[#3525cd] text-white"
                      : "border border-[#e0dfe6] bg-white text-[#646174] hover:border-[#3525cd]/30"
                  }`}
                >
                  {t === "ALL" ? "Semua" : t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RESULTS COUNT */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-[#8b8898]">
            Menampilkan <span className="font-bold text-[#191c1e]">{filteredReminders.length}</span> dari{" "}
            <span className="font-bold text-[#191c1e]">{reminders.length}</span> reminder
          </p>
          {(search || typeFilter !== "ALL" || sortOrder !== "NEWEST") && (
            <button
              type="button"
              onClick={() => { setSearch(""); setTypeFilter("ALL"); setSortOrder("NEWEST"); }}
              className="text-xs font-semibold text-[#3525cd] hover:underline"
            >
              Reset filter
            </button>
          )}
        </div>

        {/* ===================================================
            CARD GRID
        =================================================== */}

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-700 shadow-sm">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e5e2ea] bg-white py-24 text-center">
            <div className="flex h-16 w-16 animate-spin items-center justify-center rounded-full border-4 border-[#f3f1f7] border-t-[#3525cd]">
              <span className="sr-only">Memuat data...</span>
            </div>
            <p className="mt-5 text-sm font-semibold text-[#8b8898]">Memuat data reminder...</p>
          </div>
        ) : filteredReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#e5e2ea] bg-white py-20 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f3f1f7] text-[#bbb8c6]">
              <Inbox size={28} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#464555]">{currentTab.emptyTitle}</h3>
            <p className="mt-1 text-sm text-[#9996a5]">{currentTab.emptyText}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredReminders.map((r) => (
              <ReminderCard
                key={r.id}
                reminder={r}
                onDetail={() => setSelectedReminder(r)}
              />
            ))}
          </div>
        )}
      </main>

      {/* ===================================================
          DETAIL MODAL
      =================================================== */}

      {selectedReminder && (
        <DetailModal
          reminder={selectedReminder}
          onClose={() => setSelectedReminder(null)}
          onRetry={() => handleRetry(selectedReminder)}
        />
      )}
    </div>
  );
}

/* =========================================================
   REMINDER CARD
======================================================== */

function ReminderCard({ reminder, onDetail }) {
  const tc = typeConfig[reminder.reminder_type] || typeConfig["H-14"];
  const sc = statusConfig[reminder.status] || statusConfig.PENDING;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-[#e8e6ee] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">

      {/* Type color strip */}
      <div className={`h-1.5 ${tc.color}`} />

      <div className="p-5">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3525cd]/8 text-[#3525cd]">
              <Bell size={18} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#191c1e]">{reminder.invoice_number}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${sc.text} ${sc.bg} ${sc.border}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${sc.color}`} />
            {sc.label}
          </span>
        </div>

        {/* Client */}
        <div className="mt-4 flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eeeafe] text-xs font-bold text-[#3525cd]">
            {reminder.client_name.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#464555]">{reminder.client_name}</p>
            <p className="truncate text-[11px] text-[#9996a5]">Jatuh tempo {formatDate(reminder.due_date)}</p>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9996a5]">Jadwal</p>
            <p className="mt-0.5 text-xs font-semibold text-[#464555]">{formatDateTime(reminder.scheduled_at)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9996a5]">Terkirim</p>
            <p className="mt-0.5 text-xs font-semibold text-[#464555]">{formatDateTime(reminder.sent_at)}</p>
          </div>
        </div>

        {/* Type badge */}
        <div className="mt-4 flex items-center justify-between">
          <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-bold text-white ${tc.color}`}>
            <CircleDot size={11} />
            {tc.label} &mdash; {tc.description}
          </span>
        </div>

        {/* Actions */}
        <div className="mt-4 flex items-center gap-2 border-t border-[#f0edf3] pt-4">
          <button type="button" onClick={onDetail} className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#3525cd] py-2.5 text-xs font-bold text-white transition hover:bg-[#2c20ae]">
            <Eye size={14} />
            Detail
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DETAIL MODAL
======================================================== */

function DetailModal({ reminder, onClose, onRetry }) {
  const tc = typeConfig[reminder.reminder_type] || typeConfig["H-14"];
  const sc = statusConfig[reminder.status] || statusConfig.PENDING;

  const rows = [
    { label: "Invoice Number", value: reminder.invoice_number, icon: FileText },
    { label: "Client", value: reminder.client_name, icon: Send },
    { label: "Reminder Type", value: tc.label, icon: CircleDot },
    { label: "Due Date", value: formatDate(reminder.due_date), icon: CalendarDays },
    { label: "Scheduled At", value: formatDateTime(reminder.scheduled_at), icon: Clock3 },
    { label: "Status", value: sc.label, icon: CheckCircle2 },
    { label: "Sent At", value: formatDateTime(reminder.sent_at), icon: Send },
    { label: "Created At", value: formatDateTime(reminder.created_at), icon: CalendarDays },
  ];

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-[92vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#3525cd] via-[#4a3ae0] to-[#6d5cff] px-6 py-6 text-white sm:px-8">
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
          <div className="absolute right-24 bottom-[-35px] h-24 w-24 rounded-full bg-white/10" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
                <Bell size={22} />
              </div>
              <div>
                <p className="text-sm text-white/75">Detail Reminder</p>
                <p className="mt-0.5 text-xl font-bold">{reminder.invoice_number}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25">
              <X size={18} />
            </button>
          </div>

          <div className="relative mt-5 flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold text-white ${tc.color}`}>
              <CircleDot size={12} />
              {tc.label}
            </span>
            <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold ${sc.bg} ${sc.text}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${sc.color}`} />
              {sc.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {rows.map((item) => (
              <div key={item.label} className="rounded-xl border border-[#e8e6ee] bg-white p-4">
                <div className="flex items-center gap-2">
                  <item.icon size={14} className="text-[#aaa7b5]" />
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9996a5]">{item.label}</p>
                </div>
                <p className="mt-2 text-sm font-bold text-[#191c1e]">{item.value}</p>
              </div>
            ))}
          </div>

          {reminder.status === "FAILED" && reminder.error_message && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
              <div className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                  <AlertCircle size={16} />
                </div>
                <div>
                  <p className="text-sm font-bold text-red-700">Pesan Error</p>
                  <p className="mt-0.5 text-sm text-red-600">{reminder.error_message}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-[#eeeaf2] bg-[#faf9fc] px-6 py-4 sm:px-8">
          <div>
            {reminder.status === "FAILED" && (
              <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl border border-[#3525cd]/20 bg-[#3525cd]/5 px-4 py-2.5 text-sm font-semibold text-[#3525cd] transition hover:bg-[#3525cd]/10">
                <RefreshCw size={15} />
                Coba Lagi
              </button>
            )}
          </div>
          <button type="button" onClick={onClose} className="inline-flex items-center rounded-xl bg-[#3525cd] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c20ae]">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
