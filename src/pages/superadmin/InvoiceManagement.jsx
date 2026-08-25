import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import {
  Search, X, Eye, FileText, Receipt,
  CheckCircle2, Clock, AlertTriangle, Users, Loader2,
  Plus, Pencil, Trash2, ArrowDown, ArrowUp,
} from "lucide-react";
import { getInvoices, getInvoiceById, createInvoice, updateInvoice, deleteInvoice } from "../../services/invoiceApi";
import { getClients } from "../../services/clientApi";
import { getProducts } from "../../services/productApi";
import { useAuth } from "../../context/AuthContext";
import InvoiceTemplate from "../../components/invoice/InvoiceTemplate";

const formatPrice = (p) => new Intl.NumberFormat("id-ID").format(p); 
const formatDate = (d) => d ? new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-"; 

const statusConfig = {
  DRAFT: { label: "Draft", dot: "bg-[#64748b]", bg: "bg-[#f1f5f9]", text: "text-[#475569]", border: "border-[#cbd5e1]" }, 
  SENT: { label: "Terkirim", dot: "bg-[#3b82f6]", bg: "bg-[#eff6ff]", text: "text-[#2563eb]", border: "border-[#bfdbfe]" }, 
  UNPAID: { label: "Belum Lunas", dot: "bg-[#f59e0b]", bg: "bg-[#fffbeb]", text: "text-[#d97706]", border: "border-[#fde68a]" }, 
  PAID: { label: "Lunas", dot: "bg-[#10b981]", bg: "bg-[#ecfdf5]", text: "text-[#059669]", border: "border-[#a7f3d0]" }, 
  OVERDUE: { label: "Terlambat", dot: "bg-[#ef4444]", bg: "bg-[#fef2f2]", text: "text-[#dc2626]", border: "border-[#fecdd3]" }, 
  CANCELLED: { label: "Dibatalkan", dot: "bg-[#64748b]", bg: "bg-[#f8fafc]", text: "text-[#475569]", border: "border-[#cbd5e1]" }, 
}; 
function StatusBadge({ status }) { 
  const c = statusConfig[status] || statusConfig.UNPAID; 
  return ( 
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${c.bg} ${c.text} ${c.border}`}> 
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} /> 
      {c.label} 
    </span> 
  ); 
} 
 
export default function InvoiceManagement() {
  const { accessToken } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("desc");
  const [detailTarget, setDetailTarget] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [form, setForm] = useState({ invoice_number: "", client_id: "", invoice_date: "", due_date: "", status: "DRAFT", notes: "", items: [{ product_id: "", quantity: 1 }] });
 
  useEffect(() => { 
    let ignore = false; 
    (async () => { 
      try {
        setLoading(true); setError("");
        const [invData, cliData, prdData] = await Promise.all([getInvoices(accessToken), getClients(1, 1000, undefined, undefined, accessToken), getProducts()]);
        if (!ignore) { setClients((cliData && cliData.data) || cliData || []); setInvoices(invData); setProducts(prdData); }
      } catch (err) { if (!ignore) setError(err.message || "Gagal memuat data"); } finally { if (!ignore) setLoading(false); }
    })();
    return () => { ignore = true; };
  }, [accessToken]);
 
  useEffect(() => {
    document.body.style.overflow = detailTarget || modalOpen || deleteTarget ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [detailTarget, modalOpen, deleteTarget]);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(t);
  }, [success]);
 
  const stats = useMemo(() => [ 
    { title: "Total Invoice", value: invoices.length, description: "Semua invoice terdaftar", icon: FileText, className: "bg-gradient-to-r from-[#2563eb] to-[#3b82f6]" }, 
    { title: "Lunas", value: invoices.filter((i) => i.status === "PAID").length, description: "Invoice yang sudah dibayar", icon: CheckCircle2, className: "bg-gradient-to-r from-[#0d9488] to-[#14b8a6]" }, 
    { title: "Belum Lunas", value: invoices.filter((i) => i.status === "UNPAID" || i.status === "SENT" || i.status === "OVERDUE").length, description: "Invoice yang belum dibayar (terkirim, belum bayar, terlambat)", icon: Clock, className: "bg-gradient-to-r from-[#f59e0b] to-[#fbbf24]" },
    { title: "Terlambat", value: invoices.filter((i) => i.status === "OVERDUE").length, description: "Invoice yang sudah jatuh tempo", icon: AlertTriangle, className: "bg-gradient-to-r from-[#dc2626] to-[#ef4444]" }, 
  ], [invoices]); 
 
const filteredInvoices = useMemo(() => {
    const filtered = invoices.filter((inv) => {
      const kw = search.toLowerCase();
      const cl = clients.find((c) => c.id === inv.client_id);
      const clientName = cl ? (cl.company_name || "") : "";
      return (
        (inv.invoice_number || "").toLowerCase().includes(kw) ||
        clientName.toLowerCase().includes(kw) ||
        (inv.items || []).some((it) => (it.product_name || "").toLowerCase().includes(kw))
      ) && (statusFilter === "ALL" || inv.status === statusFilter);
    });
    return filtered.sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return sortOrder === "desc" ? tb - ta : ta - tb;
    });
  }, [invoices, clients, search, sortOrder, statusFilter]);
 
  const resolveClient = (cid) => clients.find((c) => c.id === cid) || { company_name: "-", pic_name: "-", email: "-", phone: "-", address: "-" };

  const toTemplateInvoice = (detail) => {
    const cl = resolveClient(detail.client_id);
    return {
      invoice_number: detail.invoice_number,
      invoice_date: detail.invoice_date,
      due_date: detail.due_date,
      subtotal: detail.subtotal,
      tax: detail.tax,
      discount: detail.discount,
      total: detail.total,
      notes: detail.notes,
      items: (detail.items || []).map((it) => ({ ...it })),
      client: {
        pic_name: cl.pic_name,
        company_name: cl.company_name,
        email: cl.email,
        address: cl.address,
      },
    };
  };

  const toDateInput = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

  const openAdd = () => {
    setEditingId(null);
    setForm({ invoice_number: "", client_id: "", invoice_date: "", due_date: "", status: "DRAFT", notes: "", items: [{ product_id: "", quantity: 1 }] });
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = async (inv) => {
    try {
      const detail = await getInvoiceById(inv.id, accessToken);
      setEditingId(inv.id);
      setForm({
        invoice_number: detail.invoice_number || "",
        client_id: detail.client_id || "",
        invoice_date: toDateInput(detail.invoice_date),
        due_date: toDateInput(detail.due_date),
        status: detail.status || "DRAFT",
        notes: detail.notes || "",
        items: (detail.items || []).map((it) => ({ product_id: it.product_id || "", quantity: it.quantity || 1 })),
      });
      setFormErrors({});
      setModalOpen(true);
    } catch (err) {
      setError(err.message || "Gagal mengambil data invoice");
    }
  };

  const setItem = (idx, key, value) => {
    setForm((prev) => {
      const items = prev.items.map((it, i) => (i === idx ? { ...it, [key]: value } : it));
      return { ...prev, items };
    });
    setFormErrors((prev) => ({ ...prev, items: undefined }));
  };

  const addItem = () => {
    setForm((prev) => ({ ...prev, items: [...prev.items, { product_id: "", quantity: 1 }] }));
  };

  const removeItem = (idx) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items: items.length ? items : [{ product_id: "", quantity: 1 }] };
    });
  };

  const handleSave = async () => {
    const errors = {};
    if (!form.client_id) errors.client_id = "Pilih client.";
    if (!form.invoice_date) errors.invoice_date = "Tanggal invoice wajib diisi.";
    if (!form.due_date) errors.due_date = "Tanggal jatuh tempo wajib diisi.";
    const validItems = form.items.filter((it) => it.product_id);
    if (validItems.length === 0) errors.items = "Tambahkan minimal satu produk.";
    if (Object.keys(errors).length) { setFormErrors(errors); return; }

    setSaving(true);
    try {
      const payload = {
        invoice_number: editingId ? form.invoice_number.trim() : "",
        client_id: form.client_id,
        invoice_date: new Date(`${form.invoice_date}T00:00:00Z`).toISOString(),
        due_date: new Date(`${form.due_date}T00:00:00Z`).toISOString(),
        status: form.status,
        notes: form.notes.trim() || null,
        created_by: null,
        items: validItems.map((it) => ({ product_id: it.product_id, quantity: Number(it.quantity) || 1 })),
      };
      if (editingId) {
        await updateInvoice(editingId, payload, accessToken);
      } else {
        await createInvoice(payload, accessToken);
      }
      setSuccess(editingId ? "Invoice berhasil diperbarui." : "Invoice berhasil ditambahkan.");
      setModalOpen(false);
      const refreshed = await getInvoices(accessToken);
      setInvoices(refreshed);
    } catch (err) {
      setError(err.message || "Gagal menyimpan invoice");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteInvoice(deleteTarget.id, accessToken);
      setSuccess("Invoice berhasil dihapus.");
      setDeleteTarget(null);
      setInvoices((prev) => prev.filter((i) => i.id !== deleteTarget.id));
    } catch (err) {
      setError(err.message || "Gagal menghapus invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcf8ff] pt-16 app-content">
      <Sidebar />
      <Header role="superadmin" />

      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" /> 
          <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" /> 
          <div className="absolute right-40 -top-6 h-20 w-20 rounded-full bg-white/10" /> 
          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/80">Super Admin Panel</p>
              <h1 className="mt-1 text-2xl font-bold">Invoice Management</h1>
              <p className="mt-1 text-sm text-white/80">Pantau seluruh invoice dan status pembayaran client.</p>
            </div>
            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#3525cd] shadow-sm transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Tambah Invoice
            </button>
          </div>
        </div> 
 
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
 
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500"><AlertTriangle size={16} /></div>
            <span className="text-sm font-medium text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-500"><CheckCircle2 size={16} /></div>
            <span className="text-sm font-medium text-emerald-700">{success}</span>
          </div>
        )} 
 
        <div className="mb-6 rounded-2xl border border-[#e5e2ea] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a97a9]" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari nomor invoice, client, atau produk..." className="w-full rounded-xl border border-[#e0e3e5] bg-white py-2.5 pl-9 pr-3 text-sm text-[#191c1e] shadow-sm outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20" />
            </div>
            <div className="flex flex-1 items-center gap-1 rounded-xl bg-[#f3f1f7] p-1">
              {[{ key: "ALL", label: "Semua" }, { key: "DRAFT", label: "Draft" }, { key: "SENT", label: "Terkirim" }, { key: "UNPAID", label: "Belum Lunas" }, { key: "PAID", label: "Lunas" }, { key: "OVERDUE", label: "Terlambat" }, { key: "CANCELLED", label: "Dibatalkan" }].map((s) => (
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
 
        <div className="overflow-hidden rounded-xl border border-[#e0e3e5] bg-white shadow-sm"> 
          <div className="overflow-x-auto"> 
            {loading ? ( 
              <div className="flex flex-col items-center justify-center gap-3 py-16"> 
                <Loader2 className="h-8 w-8 animate-spin text-[#3525cd]" /> 
                <p className="text-sm text-[#9a97a9]">Memuat data invoice...</p> 
              </div> 
            ) : ( 
              <table className="w-full min-w-[900px] text-left text-sm"> 
                <thead> 
                  <tr className="border-b border-[#e0e3e5] bg-[#faf9fc] text-xs uppercase tracking-wide text-[#9a97a9]"> 
                    <th className="px-4 py-3 font-semibold">
                      <button type="button" onClick={() => setSortOrder((o) => (o === "desc" ? "asc" : "desc"))} className="inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-[#3525cd]" title={sortOrder === "desc" ? "Urutkan terlama dulu" : "Urutkan terbaru dulu"}>
                        No. Invoice
                        {sortOrder === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : <ArrowUp className="h-3.5 w-3.5" />}
                      </button>
                    </th>
                    <th className="px-4 py-3 font-semibold">Client</th> 
                    <th className="px-4 py-3 font-semibold">Item</th> 
                    <th className="px-4 py-3 font-semibold">Total</th> 
                    <th className="px-4 py-3 font-semibold">Jatuh Tempo</th> 
                    <th className="px-4 py-3 font-semibold">Status</th> 
                    <th className="px-4 py-3 text-right font-semibold">Aksi</th> 
                  </tr> 
                </thead> 
                <tbody> 
                  {filteredInvoices.length === 0 ? ( 
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-[#9a97a9]">Tidak ada invoice yang cocok.</td></tr> 
                  ) : ( 
                    filteredInvoices.map((inv) => ( 
                      <tr key={inv.id} className="border-b border-[#e0e3e5] transition last:border-b-0 hover:bg-[#faf9fc]"> 
                        <td className="px-4 py-3"> 
                          <div className="flex items-center gap-2"> 
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e2dfff] text-[#3525cd]"><Receipt size={14} /></div> 
                            <span className="font-semibold text-[#3525cd]">{inv.invoice_number || "-"}</span> 
                          </div> 
                        </td> 
                        <td className="px-4 py-3"> 
                          <div className="flex items-center gap-2"> 
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0fdfa] text-[10px] font-bold text-[#0d9488]"><Users size={12} /></div> 
                            <span className="font-medium text-[#191c1e]">{resolveClient(inv.client_id).company_name}</span> 
                          </div> 
                        </td> 
                        <td className="px-4 py-3 text-[#464555]">{(inv.items || []).reduce((s, it) => s + (it.quantity || 0), 0)} item</td> 
                        <td className="px-4 py-3 font-semibold text-[#191c1e]">Rp {formatPrice(inv.total || 0)}</td> 
                        <td className="px-4 py-3 text-[#464555]">{formatDate(inv.due_date)}</td> 
                        <td className="px-4 py-3"><StatusBadge status={inv.status} /></td> 
                        <td className="px-4 py-3"> 
                          <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={async () => { try { const detail = await getInvoiceById(inv.id, accessToken); setDetailTarget(detail); } catch (err) { setError(err.message || "Gagal mengambil detail invoice"); } }} title="Detail" className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3525cd]/10 text-[#3525cd] transition hover:bg-[#3525cd]/20"><Eye className="h-4 w-4" /></button>
                            <button type="button" onClick={() => openEdit(inv)} title="Edit" className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f59e0b]/10 text-[#d97706] transition hover:bg-[#f59e0b]/20"><Pencil className="h-4 w-4" /></button>
                            <button type="button" onClick={() => setDeleteTarget(inv)} title="Hapus" className="flex h-8 w-8 items-center justify-center rounded-md bg-[#dc2626]/10 text-[#dc2626] transition hover:bg-[#dc2626]/20"><Trash2 className="h-4 w-4" /></button>
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
 
{detailTarget && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]" onClick={() => setDetailTarget(null)}>
              <div className="relative max-h-[92vh] w-full max-w-[860px] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
                <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#e0e3e5] bg-white px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3525cd]/10 text-[#3525cd]"><FileText size={18} /></div>
                    <div>
                      <p className="text-sm font-bold text-[#191c1e]">{detailTarget.invoice_number || "-"}</p>
                      <p className="text-xs text-[#9a97a9]">Detail Invoice</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={detailTarget.status} />
                    <button type="button" onClick={() => setDetailTarget(null)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3f1f7] text-[#464555] transition hover:bg-[#e5e2ea]"><X size={18} /></button>
                  </div>
                </div>
                <div className="bg-[#f0f0f5]">
                  <InvoiceTemplate invoice={toTemplateInvoice(detailTarget)} />
                </div>
              </div>
            </div>
        )}

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#e0e3e5] bg-white shadow-2xl">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[#3525cd] to-[#5b44f3] px-6 py-5 text-white">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                <div className="absolute -bottom-3 right-10 h-12 w-12 rounded-full bg-white/10" />
                <div className="relative flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    {editingId ? <Pencil size={18} /> : <Plus size={18} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">{editingId ? "Edit Invoice" : "Tambah Invoice"}</h2>
                    <p className="text-xs text-white/80">{editingId ? "Perbarui data invoice di bawah ini." : "Isi data invoice baru untuk ditambahkan."}</p>
                  </div>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"><X className="h-4 w-4" /></button>
              </div>

              <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Nomor Invoice</label>
                    <input type="text" disabled value={form.invoice_number} placeholder={editingId ? "INV-2026-XXXX" : "Otomatis dihasilkan sistem"} className="w-full cursor-not-allowed rounded-lg border border-[#e7e5f4] bg-[#f4f2f8] px-3 py-2 text-sm text-[#9a97a9] outline-none" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Client</label>
                    <select value={form.client_id} onChange={(e) => { setForm({ ...form, client_id: e.target.value }); setFormErrors((p) => ({ ...p, client_id: undefined })); }} className="w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20">
                      <option value="">Pilih Client...</option>
                      {clients.map((c) => <option key={c.id} value={c.id}>{c.company_name || c.pic_name || c.email}</option>)}
                    </select>
                    {formErrors.client_id && <p className="mt-1 text-xs font-medium text-[#ba1a1a]">{formErrors.client_id}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Tanggal Invoice</label>
                    <input type="date" value={form.invoice_date} onChange={(e) => { setForm({ ...form, invoice_date: e.target.value }); setFormErrors((p) => ({ ...p, invoice_date: undefined })); }} className="w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20" />
                    {formErrors.invoice_date && <p className="mt-1 text-xs font-medium text-[#ba1a1a]">{formErrors.invoice_date}</p>}
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Jatuh Tempo</label>
                    <input type="date" value={form.due_date} onChange={(e) => { setForm({ ...form, due_date: e.target.value }); setFormErrors((p) => ({ ...p, due_date: undefined })); }} className="w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20" />
                    {formErrors.due_date && <p className="mt-1 text-xs font-medium text-[#ba1a1a]">{formErrors.due_date}</p>}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20">
                    {[
                      ...(editingId
                        ? Object.keys(statusConfig)
                        : ["DRAFT", "SENT"]),
                    ].map((s) => <option key={s} value={s}>{statusConfig[s].label}</option>)}
                  </select>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="block text-sm font-semibold text-[#464555]">Item Produk</label>
                    <button type="button" onClick={addItem} className="inline-flex items-center gap-1 rounded-lg border border-[#3525cd]/30 bg-[#3525cd]/5 px-2.5 py-1 text-xs font-semibold text-[#3525cd] transition hover:bg-[#3525cd]/10"><Plus className="h-3.5 w-3.5" /> Tambah Item</button>
                  </div>
                  {form.items.map((it, idx) => (
                    <div key={idx} className="mb-2 grid grid-cols-[1fr_100px_36px] items-center gap-2">
                      <select value={it.product_id} onChange={(e) => setItem(idx, "product_id", e.target.value)} className="w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20">
                        <option value="">Pilih Produk...</option>
                        {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <input type="number" min="1" value={it.quantity} onChange={(e) => setItem(idx, "quantity", e.target.value)} className="w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20" />
                      <button type="button" onClick={() => removeItem(idx)} disabled={form.items.length === 1} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dc2626]/30 text-[#dc2626] transition hover:bg-[#dc2626]/10 disabled:opacity-40"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  ))}
                  {formErrors.items && <p className="mt-1 text-xs font-medium text-[#ba1a1a]">{formErrors.items}</p>}
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Notes</label>
                  <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Catatan tambahan invoice (opsional)" className="w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20" />
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#e0e3e5] px-6 py-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 rounded-xl border border-[#e0e3e5] bg-white py-2.5 text-sm font-semibold text-[#464555] transition hover:bg-[#faf9fc]">Batal</button>
                <button type="button" onClick={handleSave} disabled={saving} className="flex-1 rounded-xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50">{saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Invoice"}</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteTarget(null)}>
            <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-[#dc2626] to-[#ef4444] px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20"><Trash2 size={18} /></div>
                  <h2 className="text-lg font-bold">Hapus Invoice?</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm leading-relaxed text-[#464555]">
                  Yakin ingin menghapus invoice <span className="font-bold">"{deleteTarget.invoice_number}"</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#e0e3e5] px-6 py-4">
                <button type="button" onClick={() => setDeleteTarget(null)} className="rounded-xl border border-[#c7c4d8] px-5 py-2.5 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0]">Batal</button>
                <button type="button" onClick={handleDelete} disabled={saving} className="rounded-xl bg-gradient-to-r from-[#dc2626] to-[#ef4444] px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50">{saving ? "Menghapus..." : "Hapus"}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div> 
  ); 
} 
