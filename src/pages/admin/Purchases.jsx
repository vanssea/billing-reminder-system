import { useEffect, useMemo, useState } from "react";
import {
  Search,
  CheckCircle2,
  XCircle,
  Package,
  Eye,
  RefreshCcw,
  ShoppingCart,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { useAuth } from "../../context/AuthContext";
import {
  getAllPurchaseRequests,
  updatePurchaseRequestStatus,
} from "../../services/purchaseApi";

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(price);

const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const statusConfig = {
  PENDING: { label: "Menunggu", dot: "bg-[#f59e0b]", bg: "bg-[#fffbeb]", text: "text-[#d97706]", border: "border-[#fde68a]" },
  APPROVED: { label: "Disetujui", dot: "bg-[#10b981]", bg: "bg-[#ecfdf5]", text: "text-[#059669]", border: "border-[#a7f3d0]" },
  REJECTED: { label: "Ditolak", dot: "bg-[#ef4444]", bg: "bg-[#fef2f2]", text: "text-[#dc2626]", border: "border-[#fecdd3]" },
  CANCELLED: { label: "Dibatalkan", dot: "bg-[#94a3b8]", bg: "bg-[#f1f5f9]", text: "text-[#64748b]", border: "border-[#e2e8f0]" },
};

function StatusBadge({ status }) {
  const c = statusConfig[status] || statusConfig.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

export default function AdminPurchases() {
  const { accessToken } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailTarget, setDetailTarget] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [actionType, setActionType] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const loadRequests = async () => {
    try {
      setError("");
      const data = await getAllPurchaseRequests(accessToken);
      setRequests(data || []);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data permintaan pembelian.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const filtered = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        !search ||
        r.product_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.client_id?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [requests, search, statusFilter]);

  const stats = useMemo(
    () => [
      {
        title: "Total",
        value: requests.length,
        description: "Semua permintaan",
        icon: ShoppingCart,
        className: "bg-gradient-to-r from-[#3525cd] to-[#5b44f3]",
      },
      {
        title: "Menunggu",
        value: requests.filter((r) => r.status === "PENDING").length,
        description: "Perlu keputusan",
        icon: Clock,
        className: "bg-gradient-to-r from-[#d97706] to-[#f59e0b]",
      },
      {
        title: "Disetujui",
        value: requests.filter((r) => r.status === "APPROVED").length,
        description: "Invoice sudah dibuat",
        icon: CheckCircle2,
        className: "bg-gradient-to-r from-[#059669] to-[#10b981]",
      },
      {
        title: "Ditolak",
        value: requests.filter((r) => r.status === "REJECTED").length,
        description: "Ditolak oleh admin",
        icon: XCircle,
        className: "bg-gradient-to-r from-[#dc2626] to-[#ef4444]",
      },
    ],
    [requests]
  );

  const handleApprove = async () => {
    if (!actionTarget) return;
    try {
      setLoading(true);
      await updatePurchaseRequestStatus(actionTarget.id, "APPROVED", adminNotes || null, accessToken);
      setSuccess("Permintaan pembelian disetujui. Invoice otomatis dibuat.");
      setActionTarget(null);
      setAdminNotes("");
      await loadRequests();
    } catch (err) {
      setError("Gagal menyetujui: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!actionTarget) return;
    try {
      setLoading(true);
      await updatePurchaseRequestStatus(actionTarget.id, "REJECTED", adminNotes || null, accessToken);
      setSuccess("Permintaan pembelian ditolak.");
      setActionTarget(null);
      setAdminNotes("");
      await loadRequests();
    } catch (err) {
      setError("Gagal menolak: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openAction = (request, type) => {
    setActionTarget(request);
    setActionType(type);
    setAdminNotes("");
  };

  return (
    <div className="min-h-screen bg-[#fcf8ff] pt-16 app-content">
      <Sidebar role="admin" />
      <Header role="admin" />

      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Banner */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-40 -top-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/80">Admin Panel</p>
              <h1 className="mt-1 text-2xl font-bold">Purchase Requests</h1>
              <p className="mt-1 text-sm text-white/80">
                Kelola permintaan pembelian dari client. Setujui untuk membuat invoice otomatis.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
              <AlertTriangle size={16} />
            </div>
            <span className="text-sm font-medium text-red-700">{error}</span>
          </div>
        )}

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${stat.className}`}
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 right-12 h-16 w-16 rounded-full bg-white/10" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{stat.title}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{stat.value}</p>
                    <p className="mt-1 text-xs text-white/70">{stat.description}</p>
                  </div>
                  <div className="rounded-xl bg-white/20 p-2.5">
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Success */}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-sm font-medium text-emerald-700">{success}</span>
          </div>
        )}

        {/* Table Card */}
        <div className="overflow-hidden rounded-xl border border-[#e0e3e5] bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-[#e0e3e5] p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a97a9]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama produk atau client..."
                className="w-full rounded-lg border border-[#c7c4d8] bg-white py-2 pl-9 pr-3 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>

            <div className="flex flex-1 items-center gap-1 rounded-xl bg-[#f3f1f7] p-1">
              {[
                { key: "ALL", label: "Semua" },
                { key: "PENDING", label: "Menunggu" },
                { key: "APPROVED", label: "Disetujui" },
                { key: "REJECTED", label: "Ditolak" },
              ].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatusFilter(s.key)}
                  className={`flex-1 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
                    statusFilter === s.key
                      ? "bg-white text-[#3525cd] shadow-sm"
                      : "text-[#8b8898] hover:text-[#464555]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e0e3e5] bg-[#faf9fc] text-xs uppercase tracking-wide text-[#9a97a9]">
                  <th className="px-4 py-3 font-semibold">Produk</th>
                  <th className="px-4 py-3 font-semibold">Siklus</th>
                  <th className="px-4 py-3 font-semibold">Jumlah</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 font-semibold">Catatan</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && requests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#9a97a9]">
                      <RefreshCcw className="mx-auto mb-2 animate-spin text-[#3525cd]" size={20} />
                      Memuat data...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#9a97a9]">
                      <Package size={32} className="mx-auto mb-2 opacity-40" />
                      Tidak ada permintaan pembelian yang cocok.
                    </td>
                  </tr>
                ) : (
                  filtered.map((req) => (
                    <tr
                      key={req.id}
                      className="border-b border-[#e0e3e5] transition last:border-b-0 hover:bg-[#faf9fc]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e2dfff] text-sm font-bold text-[#3525cd]">
                            <Package size={16} />
                          </div>
                          <div>
                            <div className="font-medium text-[#191c1e]">{req.product_name}</div>
                            <div className="text-xs text-[#9a97a9]">ID: {req.client_id?.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center rounded-md bg-[#f0eef9] px-2 py-1 text-xs font-semibold text-[#3525cd]">
                          {req.billing_cycle === "yearly" ? "Tahunan" : "Bulanan"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-[#191c1e]">{formatPrice(req.amount)}</td>
                      <td className="px-4 py-3"><StatusBadge status={req.status} /></td>
                      <td className="px-4 py-3 text-xs text-[#64748b]">{formatDateTime(req.created_at)}</td>
                      <td className="px-4 py-3 max-w-[150px] truncate text-xs text-[#64748b]">
                        {req.admin_notes || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailTarget(req)}
                            title="Detail"
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#3525cd]/10 text-[#3525cd] transition hover:bg-[#3525cd]/20"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {req.status === "PENDING" && (
                            <>
                              <button
                                type="button"
                                onClick={() => openAction(req, "approve")}
                                title="Setujui"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#10b981]/10 text-[#059669] transition hover:bg-[#10b981]/20"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openAction(req, "reject")}
                                title="Tolak"
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#dc2626]/10 text-[#dc2626] transition hover:bg-[#dc2626]/20"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Detail Modal */}
      {detailTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setDetailTarget(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#191c1e]">Detail Permintaan</h2>
              <button onClick={() => setDetailTarget(null)} className="rounded-lg p-1 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-[#9a97a9]">Produk</span><span className="font-medium">{detailTarget.product_name}</span></div>
              <div className="flex justify-between"><span className="text-[#9a97a9]">Siklus</span><span className="font-medium">{detailTarget.billing_cycle === "yearly" ? "Tahunan" : "Bulanan"}</span></div>
              <div className="flex justify-between"><span className="text-[#9a97a9]">Jumlah</span><span className="font-medium">{formatPrice(detailTarget.amount)}</span></div>
              <div className="flex justify-between"><span className="text-[#9a97a9]">Status</span><StatusBadge status={detailTarget.status} /></div>
              <div className="flex justify-between"><span className="text-[#9a97a9]">Dibuat</span><span className="font-medium">{formatDateTime(detailTarget.created_at)}</span></div>
              {detailTarget.admin_notes && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[11px] font-bold uppercase text-[#9a97a9]">Catatan Admin</p>
                  <p className="mt-1 text-sm text-[#191c1e]">{detailTarget.admin_notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => { setActionTarget(null); setAdminNotes(""); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center gap-3">
              {actionType === "approve" ? (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"><CheckCircle2 size={20} /></div>
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600"><XCircle size={20} /></div>
              )}
              <div>
                <h2 className="text-lg font-bold text-[#191c1e]">
                  {actionType === "approve" ? "Setujui Permintaan" : "Tolak Permintaan"}
                </h2>
                <p className="text-xs text-[#9a97a9]">{actionTarget.product_name} - {formatPrice(actionTarget.amount)}</p>
              </div>
            </div>
            {actionType === "approve" && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                Invoice akan otomatis dibuat dengan status UNPAID setelah persetujuan.
              </div>
            )}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-bold text-[#64748b]">Catatan (opsional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
                placeholder={actionType === "approve" ? "Catatan untuk client..." : "Alasan penolakan..."}
                className="w-full rounded-xl border border-[#c7c4d8] bg-white px-3 py-2.5 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setActionTarget(null); setAdminNotes(""); }}
                className="rounded-xl border border-[#c7c4d8] bg-white px-4 py-2 text-sm font-semibold text-[#64748b] transition hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={actionType === "approve" ? handleApprove : handleReject}
                disabled={loading}
                className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition ${
                  actionType === "approve"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {loading ? "Memproses..." : actionType === "approve" ? "Setujui" : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
