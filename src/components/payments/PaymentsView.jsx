import { useEffect, useMemo, useState } from "react";
import {
  Search, X, Eye, Receipt, CheckCircle2, Clock,
  AlertTriangle, Users, Loader2, XCircle,
  Image as ImageIcon, Wallet, ExternalLink,
} from "lucide-react";
import { getPayments, approvePayment, rejectPayment } from "../../services/paymentApi";
import Sidebar from "../layout/Sidebar";
import Header from "../layout/Header";
import { useAuth } from "../../context/AuthContext";

const formatPrice = (p) => new Intl.NumberFormat("id-ID").format(p);
const formatDate = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";
const formatDateTime = (d) => d ? new Date(d).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-";

const statusConfig = {
  PENDING: { label: "Menunggu Keputusan", dot: "bg-[#f59e0b]", bg: "bg-[#fffbeb]", text: "text-[#d97706]", border: "border-[#fde68a]" },
  APPROVED: { label: "Disetujui", dot: "bg-[#10b981]", bg: "bg-[#ecfdf5]", text: "text-[#059669]", border: "border-[#a7f3d0]" },
  REJECTED: { label: "Ditolak", dot: "bg-[#ef4444]", bg: "bg-[#fef2f2]", text: "text-[#dc2626]", border: "border-[#fecdd3]" },
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

function ProofPreview({ payment }) {
  if (!payment.proof_url) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#c7c4d8] bg-[#faf9fc] py-10 text-[#9a97a9]">
        <ImageIcon size={28} />
        <span className="text-sm font-medium">Tidak ada bukti pembayaran</span>
      </div>
    );
  }
  const isPdf = (payment.proof_url || "").toLowerCase().endsWith(".pdf");
  if (isPdf) {
    return (
      <iframe src={payment.proof_url} title="Bukti Pembayaran" className="h-[420px] w-full rounded-xl border border-[#e0e3e5]" />
    );
  }
  return (
    <img
      src={payment.proof_url}
      alt={`Bukti pembayaran ${payment.invoice_number}`}
      className="max-h-[460px] w-full rounded-xl object-contain"
    />
  );
}

export default function PaymentsView({ role = "admin" }) {
  const { user, accessToken } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailTarget, setDetailTarget] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectNotes, setRejectNotes] = useState("");

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getPayments(accessToken);
        if (!ignore) setPayments(data);
      } catch (err) {
        if (!ignore) setError(err.message || "Gagal memuat data pembayaran");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [accessToken]);

  useEffect(() => {
    document.body.style.overflow = detailTarget || approveTarget || rejectTarget ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [detailTarget, approveTarget, rejectTarget]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);

  const stats = useMemo(() => [
    { title: "Total Pembayaran", value: payments.length, description: "Semua bukti pembayaran masuk", icon: Wallet, className: "bg-gradient-to-r from-[#3525cd] to-[#5b44f3]" },
    { title: "Menunggu", value: payments.filter((p) => p.status === "PENDING").length, description: "Perlu keputusan admin", icon: Clock, className: "bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" },
    { title: "Disetujui", value: payments.filter((p) => p.status === "APPROVED").length, description: "Pembayaran berhasil dikonfirmasi", icon: CheckCircle2, className: "bg-gradient-to-r from-[#0d9488] to-[#14b8a6]" },
    { title: "Ditolak", value: payments.filter((p) => p.status === "REJECTED").length, description: "Pembayaran tidak valid", icon: XCircle, className: "bg-gradient-to-r from-[#dc2626] to-[#ef4444]" },
  ], [payments]);

  const filteredPayments = useMemo(() => {
    const kw = search.toLowerCase();
    return payments.filter((p) =>
      (
        (p.invoice_number || "").toLowerCase().includes(kw) ||
        (p.client_name || "").toLowerCase().includes(kw) ||
        (p.payment_method || "").toLowerCase().includes(kw)
      ) && (statusFilter === "ALL" || p.status === statusFilter)
    );
  }, [payments, search, statusFilter]);

  const replacePayment = (updated) => {
    setPayments((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setDetailTarget((prev) => (prev && prev.id === updated.id ? updated : prev));
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    setSaving(true);
    try {
      const updated = await approvePayment(approveTarget.id, accessToken, user?.id || null);
      replacePayment(updated);
      setSuccess(`Pembayaran ${approveTarget.invoice_number} disetujui. Invoice kini berstatus Lunas.`);
      setApproveTarget(null);
    } catch (err) {
      setError(err.message || "Gagal menyetujui pembayaran");
    } finally {
      setSaving(false);
    }
  };

  const openReject = (payment) => {
    setRejectNotes(payment.notes || "");
    setRejectTarget(payment);
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setSaving(true);
    try {
      const updated = await rejectPayment(rejectTarget.id, accessToken, {
        notes: rejectNotes.trim() || null,
      });
      replacePayment(updated);
      setSuccess(`Pembayaran ${rejectTarget.invoice_number} ditolak.`);
      setRejectTarget(null);
    } catch (err) {
      setError(err.message || "Gagal menolak pembayaran");
    } finally {
      setSaving(false);
    }
  };

  const canDecide = (p) => p.status === "PENDING";

  const panelTitle = role === "superadmin" ? "Payment Management" : "Payments";

  return (
    <div className="min-h-screen bg-[#fcf8ff] flex">
      <Sidebar role={role} />
      <Header role={role} />

      <main className="flex-1 mt-20 md:ml-[280px] p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden">
        {/* Banner */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-40 -top-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/80">{role === "superadmin" ? "Super Admin Panel" : "Admin Panel"}</p>
              <h1 className="mt-1 text-2xl font-bold">{panelTitle}</h1>
              <p className="mt-1 text-sm text-white/80">Tinjau bukti pembayaran client lalu setujui atau tolak.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => {
            const I = s.icon;
            return (
              <div key={s.title} className={`${s.className} relative overflow-hidden rounded-2xl p-5 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg`}>
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 right-12 h-16 w-16 rounded-full bg-white/10" />
                <div className="relative flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-white/80">{s.title}</p>
                    <p className="mt-1 text-3xl font-bold tracking-tight">{s.value}</p>
                    <p className="mt-1 text-xs text-white/70">{s.description}</p>
                  </div>
                  <div className="rounded-xl bg-white/20 p-2.5"><I size={20} /></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500"><AlertTriangle size={16} /></div>
            <span className="text-sm font-medium text-red-700">{error}</span>
            <button type="button" onClick={() => setError("")} className="ml-auto text-red-500 transition hover:text-red-700"><X size={16} /></button>
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-500"><CheckCircle2 size={16} /></div>
            <span className="text-sm font-medium text-emerald-700">{success}</span>
          </div>
        )}

        {/* Search & Filter */}
        <div className="mb-6 rounded-2xl border border-[#e5e2ea] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a97a9]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nomor invoice, client, atau metode pembayaran..."
                className="w-full rounded-xl border border-[#e0e3e5] bg-white py-2.5 pl-9 pr-3 text-sm text-[#191c1e] shadow-sm outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>
            <div className="flex flex-1 items-center gap-1 rounded-xl bg-[#f3f1f7] p-1">
              {[{ key: "ALL", label: "Semua" }, { key: "PENDING", label: "Menunggu" }, { key: "APPROVED", label: "Disetujui" }, { key: "REJECTED", label: "Ditolak" }].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatusFilter(s.key)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold whitespace-nowrap transition ${
                    statusFilter === s.key ? "bg-white text-[#3525cd] shadow-sm" : "text-[#8b8898] hover:text-[#464555]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-[#e0e3e5] bg-white shadow-sm">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="h-8 w-8 animate-spin text-[#3525cd]" />
                <p className="text-sm text-[#9a97a9]">Memuat data pembayaran...</p>
              </div>
            ) : (
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e0e3e5] bg-[#faf9fc] text-xs uppercase tracking-wide text-[#9a97a9]">
                    <th className="px-4 py-3 font-semibold">No. Invoice</th>
                    <th className="px-4 py-3 font-semibold">Client</th>
                    <th className="px-4 py-3 font-semibold">Metode</th>
                    <th className="px-4 py-3 font-semibold">Tanggal Bayar</th>
                    <th className="px-4 py-3 font-semibold">Jumlah</th>
                    <th className="px-4 py-3 font-semibold">Bukti</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.length === 0 ? (
                    <tr><td colSpan={8} className="px-4 py-12 text-center text-[#9a97a9]">Belum ada pembayaran yang cocok.</td></tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p.id} className="border-b border-[#e0e3e5] transition last:border-b-0 hover:bg-[#faf9fc]">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e2dfff] text-[#3525cd]"><Receipt size={14} /></div>
                            <span className="font-semibold text-[#3525cd]">{p.invoice_number || "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0fdfa] text-[10px] font-bold text-[#0d9488]"><Users size={12} /></div>
                            <span className="font-medium text-[#191c1e]">{p.client_name || "-"}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#464555]">{p.payment_method || "-"}</td>
                        <td className="px-4 py-3 text-[#464555]">{formatDate(p.payment_date)}</td>
                        <td className="px-4 py-3 font-semibold text-[#191c1e]">Rp {formatPrice(p.amount || 0)}</td>
                        <td className="px-4 py-3">
                          {p.proof_url ? (
                            <button type="button" onClick={() => setDetailTarget(p)} className="inline-flex items-center gap-1.5 rounded-lg bg-[#3525cd]/10 px-2.5 py-1.5 text-xs font-semibold text-[#3525cd] transition hover:bg-[#3525cd]/20">
                              <ImageIcon size={13} /> Lihat Bukti
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#f3f1f7] px-2.5 py-1.5 text-xs font-medium text-[#9a97a9]">
                              <XCircle size={13} /> Tidak ada
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => setDetailTarget(p)} title="Detail & Bukti" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#3525cd]/10 text-[#3525cd] transition hover:bg-[#3525cd]/20">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setApproveTarget(p)} disabled={!canDecide(p)} title="Setujui" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#10b981]/10 text-[#059669] transition hover:bg-[#10b981]/20 disabled:cursor-not-allowed disabled:opacity-40">
                              <CheckCircle2 className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => openReject(p)} disabled={!canDecide(p)} title="Tolak" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#dc2626]/10 text-[#dc2626] transition hover:bg-[#dc2626]/20 disabled:cursor-not-allowed disabled:opacity-40">
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Detail + Proof Modal */}
        {detailTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]" onClick={() => setDetailTarget(null)}>
            <div className="relative max-h-[92vh] w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e0e3e5] bg-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3525cd]/10 text-[#3525cd]"><Wallet size={18} /></div>
                  <div>
                    <p className="text-sm font-bold text-[#191c1e]">Bukti Pembayaran · {detailTarget.invoice_number || "-"}</p>
                    <p className="text-xs text-[#9a97a9]">{detailTarget.client_name || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={detailTarget.status} />
                  <button type="button" onClick={() => setDetailTarget(null)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3f1f7] text-[#464555] transition hover:bg-[#e5e2ea]"><X size={18} /></button>
                </div>
              </div>

              <div className="space-y-5 px-6 py-6">
                <ProofPreview payment={detailTarget} />

                {detailTarget.proof_url && (
                  <a href={detailTarget.proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3525cd] transition hover:underline">
                    Buka bukti di tab baru <ExternalLink size={12} />
                  </a>
                )}

                <div className="grid grid-cols-1 gap-x-6 gap-y-3 rounded-xl border border-[#e0e3e5] bg-[#faf9fc] p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#9a97a9]">No. Invoice</p>
                    <p className="text-sm font-semibold text-[#191c1e]">{detailTarget.invoice_number || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#9a97a9]">Client</p>
                    <p className="text-sm font-semibold text-[#191c1e]">{detailTarget.client_name || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#9a97a9]">Jumlah Dibayar</p>
                    <p className="text-sm font-bold text-[#059669]">Rp {formatPrice(detailTarget.amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#9a97a9]">Metode</p>
                    <p className="text-sm font-semibold text-[#191c1e]">{detailTarget.payment_method || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#9a97a9]">Tanggal Bayar</p>
                    <p className="text-sm font-semibold text-[#191c1e]">{formatDate(detailTarget.payment_date)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-[#9a97a9]">Diajukan</p>
                    <p className="text-sm font-semibold text-[#191c1e]">{formatDateTime(detailTarget.created_at)}</p>
                  </div>
                  {detailTarget.verified_at && (
                    <>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#9a97a9]">Diverifikasi Oleh</p>
                        <p className="truncate text-sm font-semibold text-[#191c1e]">{detailTarget.verified_by || "-"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#9a97a9]">Waktu Verifikasi</p>
                        <p className="text-sm font-semibold text-[#191c1e]">{formatDateTime(detailTarget.verified_at)}</p>
                      </div>
                    </>
                  )}
                  {detailTarget.notes && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium uppercase tracking-wide text-[#9a97a9]">Catatan</p>
                      <p className="text-sm text-[#464555]">{detailTarget.notes}</p>
                    </div>
                  )}
                </div>

                {canDecide(detailTarget) && (
                  <div className="flex flex-wrap justify-end gap-3 border-t border-[#e0e3e5] pt-4">
                    <button type="button" onClick={() => setApproveTarget(detailTarget)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg">
                      <CheckCircle2 size={16} /> Setujui
                    </button>
                    <button type="button" onClick={() => openReject(detailTarget)} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#dc2626] to-[#ef4444] px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg">
                      <XCircle size={16} /> Tolak
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Approve Confirmation */}
        {approveTarget && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={() => setApproveTarget(null)}>
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-[#059669] to-[#10b981] px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><CheckCircle2 size={18} /></div>
                  <h2 className="text-lg font-bold">Setujui Pembayaran?</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm leading-relaxed text-[#464555]">
                  Setujui pembayaran invoice <span className="font-bold">{approveTarget.invoice_number}</span> sebesar <span className="font-bold">Rp {formatPrice(approveTarget.amount || 0)}</span>? Status invoice akan otomatis menjadi <span className="font-bold">Lunas</span>.
                </p>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#e0e3e5] px-6 py-4">
                <button type="button" onClick={() => setApproveTarget(null)} className="rounded-xl border border-[#c7c4d8] px-5 py-2.5 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0]">Batal</button>
                <button type="button" onClick={handleApprove} disabled={saving} className="rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50">{saving ? "Menyetujui..." : "Setujui"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectTarget && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={() => setRejectTarget(null)}>
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-[#dc2626] to-[#ef4444] px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><XCircle size={18} /></div>
                  <div>
                    <h2 className="text-lg font-bold">Tolak Pembayaran?</h2>
                    <p className="text-xs text-white/80">Invoice {rejectTarget.invoice_number}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-6">
                <p className="text-sm leading-relaxed text-[#464555]">
                  Pembayaran akan ditandai <span className="font-bold">Ditolak</span>. Client perlu mengirim ulang bukti pembayaran yang benar.
                </p>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Alasan Penolakan</label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    rows={3}
                    placeholder="Contoh: Nominal transfer tidak sesuai dengan total invoice."
                    className="w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#e0e3e5] px-6 py-4">
                <button type="button" onClick={() => setRejectTarget(null)} className="rounded-xl border border-[#c7c4d8] px-5 py-2.5 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0]">Tidak</button>
                <button type="button" onClick={handleReject} disabled={saving} className="rounded-xl bg-gradient-to-r from-[#dc2626] to-[#ef4444] px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50">{saving ? "Menolak..." : "Tolak Pembayaran"}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
