import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Eye,
  X,
  Clock,
  CheckCircle2,
  XCircle,
  Receipt,
  DollarSign,
  ShieldCheck,
  Wallet,
  Banknote,
  CreditCard,
  FileText,
  User,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { useAuth } from "../../context/AuthContext";
import {
  getPayments,
  approvePayment as approvePaymentRequest,
  rejectPayment as rejectPaymentRequest,
} from "../../services/paymentApi";

const mapPayment = (row) => ({
  id: row.id,
  invoiceNumber: row.invoice_number,
  clientName: row.client_name,
  companyName: row.company_name,
  invoiceTotal: Number(row.invoice_total ?? 0),
  amount: Number(row.amount ?? 0),
  paymentMethod: row.payment_method || "BANK_TRANSFER",
  paymentDate: row.payment_date,
  dueDate: row.due_date,
  status: row.status,
  proofUrl: row.proof_url,
  verifiedBy: row.verified_by,
  verifiedAt: row.verified_at,
  notes: row.notes,
});

const formatRupiah = (num) => "Rp" + new Intl.NumberFormat("id-ID").format(num);

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

const formatDateShort = (date) =>
  date
    ? new Date(date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

const statusConfig = {
  PENDING: { chip: "bg-[#fffbeb] text-[#d97706] border-[#fde68a]", dot: "bg-[#f59e0b]" },
  APPROVED: { chip: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]", dot: "bg-[#10b981]" },
  REJECTED: { chip: "bg-[#fef2f2] text-[#dc2626] border-[#fecdd3]", dot: "bg-[#ef4444]" },
};

function StatusBadge({ status }) {
  const c = statusConfig[status] || statusConfig.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold ${c.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status}
    </span>
  );
}

const methodConfig = {
  BANK_TRANSFER: { label: "Bank Transfer", tile: "bg-[#dbeafe] text-[#1d4ed8]", icon: Wallet },
  CASH: { label: "Cash", tile: "bg-[#d1fae5] text-[#065f46]", icon: Banknote },
  OTHER: { label: "Other", tile: "bg-[#e0e7ff] text-[#3730a3]", icon: CreditCard },
};

function MethodChip({ method }) {
  const m = methodConfig[method] || methodConfig.BANK_TRANSFER;
  const Icon = m.icon;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${m.tile}`}>
        <Icon size={13} />
      </span>
      <span className="whitespace-nowrap text-sm text-[#464555]">{m.label}</span>
    </span>
  );
}

const inputClass =
  "w-full rounded-xl border border-[#e0e3e5] bg-white px-3.5 py-2.5 text-sm text-[#191c1e] shadow-sm outline-none transition placeholder:text-[#9a97a9] focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20";

function ModalShell({ children, maxWidth = "max-w-lg", onClose }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[1px]" onClick={onClose}>
      <div className={`my-auto w-full ${maxWidth} overflow-hidden rounded-2xl border border-[#e0e3e5] bg-white shadow-2xl`} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon: Icon, iconTile, title, subtitle, action, onClose }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-[#e0e3e5] px-6 py-5">
      <div className="flex items-center gap-3.5">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTile}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-base font-bold tracking-tight text-[#191c1e]">{title}</p>
          {subtitle && <p className="mt-0.5 font-mono text-xs text-[#9a97a9]">{subtitle}</p>}
          {action}
        </div>
      </div>
      <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#9a97a9] transition hover:bg-[#f3f1f7] hover:text-[#464555]">
        <X size={18} />
      </button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 py-1.5">
      <span className="text-sm text-[#777587]">{label}</span>
      <span className="text-right text-sm font-semibold text-[#191c1e]">{value}</span>
    </div>
  );
}

function SectionTitle({ icon: Icon, children }) {
  return (
    <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9a97a9]">
      <Icon size={12} />
      {children}
    </p>
  );
}

export default function PaymentManagement() {
  const { user, accessToken } = useAuth();
  const verifierName = user?.full_name || "Superadmin";
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailId, setDetailId] = useState(null);
  const [approveId, setApproveId] = useState(null);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadPayments = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await getPayments(accessToken);
      setPayments(rows.map(mapPayment));
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const isAnyModalOpen = detailId || approveId || rejectId;
  useEffect(() => {
    document.body.style.overflow = isAnyModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isAnyModalOpen]);

  useEffect(() => {
    if (!successMsg) return;
    const timer = setTimeout(() => setSuccessMsg(""), 3000);
    return () => clearTimeout(timer);
  }, [successMsg]);

  const countBy = (status) => payments.filter((p) => p.status === status).length;

  const totalAmount = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);

  const stats = [
    { title: "Total Payments", value: payments.length, sub: "All client payments", icon: Receipt, gradient: "from-[#2563eb] to-[#3b82f6]" },
    { title: "Pending Verification", value: countBy("PENDING"), sub: "Awaiting verification", icon: Clock, gradient: "from-[#f59e0b] to-[#fbbf24]" },
    { title: "Approved", value: countBy("APPROVED"), sub: "Verified payments", icon: CheckCircle2, gradient: "from-[#0d9488] to-[#14b8a6]" },
    { title: "Rejected", value: countBy("REJECTED"), sub: "Declined payments", icon: XCircle, gradient: "from-[#dc2626] to-[#ef4444]" },
    { title: "Total Payment Amount", value: formatRupiah(totalAmount), sub: "Sum of all payments", icon: DollarSign, gradient: "from-[#3525cd] to-[#5b44f3]" },
  ];

  const filteredPayments = useMemo(() => {
    const keyword = search.toLowerCase().trim();
    return payments.filter((p) => {
      const matchSearch =
        !keyword ||
        p.invoiceNumber.toLowerCase().includes(keyword) ||
        p.clientName.toLowerCase().includes(keyword) ||
        p.companyName.toLowerCase().includes(keyword);
      const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [payments, search, statusFilter]);

  const detailPayment = payments.find((p) => p.id === detailId) || null;
  const approvePayment = payments.find((p) => p.id === approveId) || null;
  const rejectPayment = payments.find((p) => p.id === rejectId) || null;

  const closeAllModals = () => {
    setApproveId(null);
    setRejectId(null);
    setRejectReason("");
    setRejectError("");
    setDetailId(null);
  };

  const handleApproveConfirm = async () => {
    if (!approvePayment || processing) return;
    setProcessing(true);
    try {
      await approvePaymentRequest(approvePayment.id, accessToken);
      await loadPayments();
      closeAllModals();
      setSuccessMsg(`Payment ${approvePayment.invoiceNumber} has been approved`);
    } catch (err) {
      setError(err.message || "Failed to approve payment");
    } finally {
      setProcessing(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectPayment || processing) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setRejectError("Reason for rejection is required");
      return;
    }
    setProcessing(true);
    try {
      await rejectPaymentRequest(rejectPayment.id, accessToken, { notes: reason });
      await loadPayments();
      closeAllModals();
      setSuccessMsg(`Payment ${rejectPayment.invoiceNumber} has been rejected`);
    } catch (err) {
      setError(err.message || "Failed to reject payment");
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = () => {
    setRejectReason("");
    setRejectError("");
    setRejectId(detailId);
  };

  const statusTabs = [
    { value: "ALL", label: "All" },
    { value: "PENDING", label: "Pending" },
    { value: "APPROVED", label: "Approved" },
    { value: "REJECTED", label: "Rejected" },
  ];

  return (
    <div className="min-h-screen bg-[#fcf8ff] pt-16 app-content">
      <Sidebar />
      <Header role="superadmin" />

      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Banner */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-40 -top-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="relative">
            <p className="text-sm font-medium text-white/80">Super Admin Panel</p>
            <h1 className="mt-1 text-2xl font-bold">Payment Management</h1>
            <p className="mt-1 text-sm text-white/80">Monitor and verify client payments</p>
          </div>
        </div>

        {/* Success Message */}
        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#a7f3d0] bg-[#ecfdf5] px-4 py-3 text-sm font-medium text-[#059669] shadow-sm">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-[#fecdd3] bg-[#fef2f2] px-4 py-3 text-sm font-medium text-[#dc2626] shadow-sm">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {error}
            </span>
            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-md p-1 transition hover:bg-[#dc2626]/10"
            >
              <X size={14} />
            </button>
          </div>
        )}

        {/* Summary Cards */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className={`relative overflow-hidden rounded-2xl bg-gradient-to-r p-5 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg ${stat.gradient}`}>
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
                <div className="absolute -bottom-4 right-12 h-16 w-16 rounded-full bg-white/10" />
                <div className="relative flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white/80">{stat.title}</p>
                    <p className="mt-1 truncate text-2xl font-bold tracking-tight xl:text-3xl">{stat.value}</p>
                    <p className="mt-1 truncate text-xs text-white/70">{stat.sub}</p>
                  </div>
                  <div className="shrink-0 rounded-xl bg-white/20 p-2.5"><Icon size={20} /></div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Toolbar */}
        <div className="mb-6 rounded-2xl border border-[#e5e2ea] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a97a9]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoice, client, or company..."
                className="w-full rounded-xl border border-[#e0e3e5] bg-white py-2.5 pl-9 pr-3 text-sm text-[#191c1e] shadow-sm outline-none transition placeholder:text-[#9a97a9] focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>
            <div className="flex flex-1 items-center gap-1 rounded-xl bg-[#f3f1f7] p-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => setStatusFilter(tab.value)}
                  className={`flex-1 rounded-lg px-2 py-2 text-xs font-bold whitespace-nowrap transition ${
                    statusFilter === tab.value ? "bg-white text-[#3525cd] shadow-sm" : "text-[#8b8898] hover:text-[#464555]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Card */}
        <div className="overflow-hidden rounded-xl border border-[#e0e3e5] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1140px] table-fixed text-left text-sm">
              <thead>
                <tr className="border-b border-[#e0e3e5] bg-[#faf9fc] text-xs uppercase tracking-wide text-[#9a97a9]">
                  <th className="w-[125px] px-5 py-3.5 font-semibold">Invoice</th>
                  <th className="w-[185px] px-5 py-3.5 font-semibold">Client</th>
                  <th className="w-[190px] px-5 py-3.5 font-semibold">Company</th>
                  <th className="w-[135px] px-5 py-3.5 font-semibold">Amount</th>
                  <th className="w-[165px] px-5 py-3.5 font-semibold">Payment Method</th>
                  <th className="w-[125px] px-5 py-3.5 font-semibold">Payment Date</th>
                  <th className="w-[135px] px-5 py-3.5 font-semibold">Status</th>
                  <th className="w-[80px] px-5 py-3.5 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eceaf2]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <Loader2 size={22} className="mx-auto mb-3 animate-spin text-[#3525cd]" />
                      <p className="text-sm font-medium text-[#464555]">Loading payments...</p>
                      <p className="mt-0.5 text-xs text-[#9a97a9]">Fetching data from server</p>
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#faf9fc] text-[#c7c4d8]">
                        <Receipt size={22} />
                      </div>
                      <p className="text-sm font-medium text-[#464555]">No payments found</p>
                      <p className="mt-0.5 text-xs text-[#9a97a9]">Client payments will appear here</p>
                    </td>
                  </tr>
                ) : filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-16 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#faf9fc] text-[#c7c4d8]">
                        <Search size={22} />
                      </div>
                      <p className="text-sm font-medium text-[#464555]">No payments match your filters</p>
                      <p className="mt-0.5 text-xs text-[#9a97a9]">Try changing the keyword or filter criteria</p>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((pay) => (
                    <tr key={pay.id} className="transition hover:bg-[#faf9fc]">
                      <td className="px-5 py-4">
                        <p className="font-mono text-xs font-semibold text-[#3525cd]">{pay.invoiceNumber}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#e2dfff] text-xs font-bold text-[#3525cd]">
                            {pay.clientName.split(" ").map((w) => w[0]).slice(0, 2).join("")}
                          </div>
                          <span className="whitespace-nowrap font-medium text-[#191c1e]">{pay.clientName}</span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-[#464555]">{pay.companyName}</td>
                      <td className="px-5 py-4">
                        <p className="font-semibold tabular-nums text-[#191c1e]">{formatRupiah(pay.amount)}</p>
                      </td>
                      <td className="px-5 py-4"><MethodChip method={pay.paymentMethod} /></td>
                      <td className="px-5 py-4 whitespace-nowrap text-[#464555]">{formatDateShort(pay.paymentDate)}</td>
                      <td className="px-5 py-4"><StatusBadge status={pay.status} /></td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setDetailId(pay.id)}
                            title="View Detail"
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3525cd]/10 text-[#3525cd] transition hover:bg-[#3525cd]/20"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {detailPayment && (
          <ModalShell maxWidth="max-w-2xl" onClose={() => setDetailId(null)}>
            <ModalHeader
              icon={FileText}
              iconTile="bg-[#3525cd]/10 text-[#3525cd]"
              title="Payment Detail"
              subtitle={detailPayment.invoiceNumber}
              action={<div className="mt-1"><StatusBadge status={detailPayment.status} /></div>}
              onClose={() => setDetailId(null)}
            />

            <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
              {/* Client Information */}
              <div className="rounded-xl border border-[#e0e3e5] p-4">
                <SectionTitle icon={User}>Client Information</SectionTitle>
                <InfoRow label="Client Name" value={detailPayment.clientName} />
                <InfoRow label="Company Name" value={detailPayment.companyName} />
              </div>

              {/* Invoice Information */}
              <div className="rounded-xl border border-[#e0e3e5] p-4">
                <SectionTitle icon={FileText}>Invoice Information</SectionTitle>
                <InfoRow label="Invoice Number" value={<span className="font-mono">{detailPayment.invoiceNumber}</span>} />
                <InfoRow label="Invoice Total" value={formatRupiah(detailPayment.invoiceTotal)} />
                <InfoRow label="Due Date" value={formatDateShort(detailPayment.dueDate)} />
              </div>

              {/* Payment Information */}
              <div className="rounded-xl border border-[#e0e3e5] p-4">
                <SectionTitle icon={DollarSign}>Payment Information</SectionTitle>
                <InfoRow label="Payment Amount" value={<span className="tabular-nums">{formatRupiah(detailPayment.amount)}</span>} />
                <InfoRow label="Payment Date" value={formatDateShort(detailPayment.paymentDate)} />
                <InfoRow label="Payment Method" value={<MethodChip method={detailPayment.paymentMethod} />} />
                <InfoRow label="Status" value={<StatusBadge status={detailPayment.status} />} />
              </div>

              {/* Payment Proof */}
              <div className="rounded-xl border border-[#e0e3e5] p-4">
                <SectionTitle icon={ImageIcon}>Payment Proof</SectionTitle>
                {detailPayment.proofUrl ? (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-[#c7c4d8] bg-[#faf9fc] px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3525cd]/10 text-[#3525cd]">
                        <ImageIcon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#191c1e]">Payment proof uploaded by client</p>
                        <p className="text-xs text-[#9a97a9]">{detailPayment.clientName} · {detailPayment.companyName}</p>
                      </div>
                    </div>
                    <a
                      href={detailPayment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#3525cd]/10 px-3.5 py-2 text-xs font-semibold text-[#3525cd] transition hover:bg-[#3525cd]/20"
                    >
                      <ExternalLink size={13} />
                      View Payment Proof
                    </a>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-dashed border-[#e0e3e5] bg-[#faf9fc] px-4 py-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f3f1f7] text-[#9a97a9]">
                      <ImageIcon size={18} />
                    </div>
                    <p className="text-sm text-[#777587]">No payment proof available</p>
                  </div>
                )}
              </div>

              {/* Verification Information */}
              <div className="rounded-xl border border-[#e0e3e5] p-4">
                <SectionTitle icon={ShieldCheck}>Verification Information</SectionTitle>
                {detailPayment.verifiedBy ? (
                  <>
                    <InfoRow label="Verified By" value={detailPayment.verifiedBy} />
                    <InfoRow label="Verified At" value={formatDateTime(detailPayment.verifiedAt)} />
                  </>
                ) : (
                  <div className="flex items-center gap-2.5 rounded-lg bg-[#fffbeb] px-3.5 py-2.5 ring-1 ring-inset ring-[#fde68a]">
                    <Clock size={15} className="shrink-0 text-[#d97706]" />
                    <p className="text-sm font-medium text-[#d97706]">Not verified yet</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="rounded-xl border border-[#e0e3e5] p-4">
                <SectionTitle icon={FileText}>
                  {detailPayment.status === "REJECTED" && detailPayment.notes ? "Rejection Reason" : "Notes"}
                </SectionTitle>
                {detailPayment.notes ? (
                  <p className={`text-sm leading-relaxed ${detailPayment.status === "REJECTED" ? "rounded-lg bg-[#fef2f2] px-3.5 py-2.5 text-[#dc2626]" : "text-[#464555]"}`}>
                    {detailPayment.notes}
                  </p>
                ) : (
                  <p className="text-sm text-[#9a97a9]">-</p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-[#e0e3e5] bg-[#faf9fc] px-6 py-4">
              {detailPayment.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    onClick={openRejectModal}
                    className="mr-auto inline-flex items-center gap-1.5 rounded-xl border border-[#fecdd3] bg-white px-4 py-2.5 text-sm font-semibold text-[#dc2626] shadow-sm transition hover:bg-[#fef2f2]"
                  >
                    <XCircle size={15} />
                    Reject Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setApproveId(detailPayment.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                  >
                    <CheckCircle2 size={15} />
                    Approve Payment
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className={`${detailPayment.status === "PENDING" ? "" : "ml-auto"} rounded-xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg`}
              >
                Close
              </button>
            </div>
          </ModalShell>
        )}

        {/* Approve Confirmation Modal */}
        {approvePayment && (
          <ModalShell maxWidth="max-w-md" onClose={() => setApproveId(null)}>
            <ModalHeader
              icon={CheckCircle2}
              iconTile="bg-[#ecfdf5] text-[#059669]"
              title="Approve Payment?"
              subtitle={approvePayment.invoiceNumber}
              onClose={() => setApproveId(null)}
            />

            <div className="px-6 py-6">
              <p className="text-sm text-[#464555]">Are you sure you want to approve this client payment?</p>

              <div className="mt-4 space-y-2 rounded-xl bg-[#faf9fc] px-4 py-3.5 ring-1 ring-inset ring-[#e0e3e5]">
                <InfoRow label="Client" value={approvePayment.clientName} />
                <InfoRow label="Company" value={approvePayment.companyName} />
                <InfoRow label="Invoice" value={<span className="font-mono">{approvePayment.invoiceNumber}</span>} />
                <InfoRow label="Amount" value={<span className="tabular-nums">{formatRupiah(approvePayment.amount)}</span>} />
              </div>

              <p className="mt-3 text-xs text-[#9a97a9]">This payment will be marked as APPROVED and verified by {verifierName}.</p>
            </div>

            <div className="flex justify-end gap-3 border-t border-[#e0e3e5] bg-[#faf9fc] px-6 py-4">
              <button
                type="button"
                onClick={() => setApproveId(null)}
                className="rounded-xl border border-[#e0e3e5] bg-white px-5 py-2.5 text-sm font-medium text-[#464555] shadow-sm transition hover:bg-[#f8f9fa]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveConfirm}
                disabled={processing}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#10b981] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {processing ? "Processing..." : "Approve Payment"}
              </button>
            </div>
          </ModalShell>
        )}

        {/* Reject Modal */}
        {rejectPayment && (
          <ModalShell maxWidth="max-w-md" onClose={() => setRejectId(null)}>
            <ModalHeader
              icon={AlertTriangle}
              iconTile="bg-[#fef2f2] text-[#dc2626]"
              title="Reject Payment"
              subtitle={rejectPayment.invoiceNumber}
              onClose={() => setRejectId(null)}
            />

            <form onSubmit={handleRejectSubmit}>
              <div className="px-6 py-6">
                <div className="space-y-2 rounded-xl bg-[#faf9fc] px-4 py-3.5 ring-1 ring-inset ring-[#e0e3e5]">
                  <InfoRow label="Client" value={rejectPayment.clientName} />
                  <InfoRow label="Company" value={rejectPayment.companyName} />
                  <InfoRow label="Amount" value={<span className="tabular-nums">{formatRupiah(rejectPayment.amount)}</span>} />
                </div>

                <div className="mt-4">
                  <label htmlFor="reject-reason" className="mb-1.5 block text-sm font-medium text-[#191c1e]">
                    Reason for rejection <span className="text-[#dc2626]">*</span>
                  </label>
                  <textarea
                    id="reject-reason"
                    value={rejectReason}
                    onChange={(e) => {
                      setRejectReason(e.target.value);
                      if (e.target.value.trim()) setRejectError("");
                    }}
                    rows={3}
                    placeholder="Example: Payment proof is invalid..."
                    className={`${inputClass} resize-none`}
                  />
                  {rejectError && <p className="mt-1.5 text-xs font-medium text-[#ba1a1a]">{rejectError}</p>}
                </div>

                <p className="mt-3 text-xs text-[#9a97a9]">This payment will be marked as REJECTED and verified by {verifierName}.</p>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#e0e3e5] bg-[#faf9fc] px-6 py-4">
                <button
                  type="button"
                  onClick={() => setRejectId(null)}
                  className="rounded-xl border border-[#e0e3e5] bg-white px-5 py-2.5 text-sm font-medium text-[#464555] shadow-sm transition hover:bg-[#f8f9fa]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#dc2626] to-[#ef4444] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processing ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
                  {processing ? "Processing..." : "Reject Payment"}
                </button>
              </div>
            </form>
          </ModalShell>
        )}
      </main>
    </div>
  );
}
