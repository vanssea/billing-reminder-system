import { useCallback, useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { useAuth } from "../../context/AuthContext";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Eye,
  Package,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Clock,
  ShieldCheck,
  Sparkles,
  Rocket,
  AlertTriangle,
} from "lucide-react";

import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../../services/productApi";

const formatPrice = (price) =>
  new Intl.NumberFormat("id-ID").format(price);

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

const toUiStatus = (status) =>
  (status || "").toUpperCase() === "ACTIVE" ? "Active" : "Inactive";

const statusToDb = { Active: "ACTIVE", Inactive: "INACTIVE" };

const emptyForm = {
  name: "",
  description: "",
  price: "",
  price_yearly: "",
  billing_type: "monthly",
  features: "",
  popular: false,
  status: "Active",
};

const colorCycle = ["blue", "purple", "orange"];
const iconCycle = [Rocket, ShieldCheck, Sparkles];

const colorStyles = {
  blue: "bg-gradient-to-r from-[#2563eb] to-[#3b82f6]",
  purple: "bg-gradient-to-r from-[#3525cd] to-[#6d5cff]",
  orange: "bg-gradient-to-r from-[#d97706] to-[#f59e0b]",
};

function FieldError({ errors, field }) {
  return errors[field] ? (
    <p className="mt-1 text-xs font-medium text-[#ba1a1a]">{errors[field]}</p>
  ) : null;
}

function StatusBadge({ status }) {
  const active = status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
        active ? "bg-[#ecfdf5] text-[#059669]" : "bg-[#f1f5f9] text-[#64748b]"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-[#10b981]" : "bg-[#94a3b8]"}`} />
      {status}
    </span>
  );
}

export default function ProductManagement() {
  const { accessToken } = useAuth();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getProducts();
      setProducts((data || []).map((p) => ({ ...p, status: toUiStatus(p.status) })));
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data produk dari server.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => loadProducts(), 0);
    return () => clearTimeout(timer);
  }, [loadProducts]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    const hasModal = modalOpen || detailTarget || deleteTarget;
    if (hasModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen, detailTarget, deleteTarget]);

  const stats = useMemo(
    () => [
      {
        title: "Total Produk",
        value: products.length,
        description: "Semua paket produk terdaftar",
        icon: Package,
        className: "bg-gradient-to-r from-[#2563eb] to-[#3b82f6]",
      },
      {
        title: "Aktif",
        value: products.filter((p) => p.status === "Active").length,
        description: "Produk dengan status aktif",
        icon: CheckCircle2,
        className: "bg-gradient-to-r from-[#0d9488] to-[#14b8a6]",
      },
      {
        title: "Inaktif",
        value: products.filter((p) => p.status === "Inactive").length,
        description: "Produk dengan status inaktif",
        icon: XCircle,
        className: "bg-gradient-to-r from-[#dc2626] to-[#ef4444]",
      },
    ],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const keyword = search.toLowerCase();
      const matchSearch =
        (product.name || "").toLowerCase().includes(keyword) ||
        (product.description || "").toLowerCase().includes(keyword);
      const matchStatus =
        statusFilter === "ALL" || product.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      description: product.description || "",
      price: product.price || "",
      price_yearly: product.price_yearly || "",
      billing_type: product.billing_type || "monthly",
      features: (product.features || []).join(", "),
      popular: product.popular || false,
      status: product.status || "Active",
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Nama produk wajib diisi";
    if (!form.description.trim()) newErrors.description = "Deskripsi wajib diisi";
    if (!form.price && form.price !== 0) newErrors.price = "Harga wajib diisi";

    setFormErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        name: form.name,
        description: form.description,
        price: Number(String(form.price).replace(/[^0-9]/g, "")) || 0,
        price_yearly: form.price_yearly ? Number(String(form.price_yearly).replace(/[^0-9]/g, "")) || null : null,
        billing_type: form.billing_type,
        features: form.features
          ? form.features.split(",").map((f) => f.trim()).filter(Boolean)
          : [],
        popular: form.popular,
        status: statusToDb[form.status] || form.status,
      };

      if (editingId) {
        await updateProduct(editingId, payload, accessToken);
        setSuccess("Data produk berhasil diperbarui.");
      } else {
        await createProduct(payload, accessToken);
        setSuccess("Produk baru berhasil ditambahkan.");
      }

      await loadProducts();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan data produk.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await deleteProduct(deleteTarget.id, accessToken);
      setProducts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setSuccess("Produk berhasil dihapus.");
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus produk.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20";

  const fieldClass = (field) =>
    formErrors[field]
      ? "w-full rounded-lg border border-[#ba1a1a] bg-[#fffafa] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20"
      : inputClass;

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

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/80">Super Admin Panel</p>
              <h1 className="mt-1 text-2xl font-bold">Product Management</h1>
              <p className="mt-1 text-sm text-white/80">
                Kelola paket produk dan layanan hosting pada sistem HostFlow.
              </p>
            </div>

            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#3525cd] shadow-sm transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </button>
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
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Search & Filter */}
        <div className="mb-6 rounded-2xl border border-[#e5e2ea] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a97a9]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama atau deskripsi produk..."
                className="w-full rounded-xl border border-[#e0e3e5] bg-white py-2.5 pl-9 pr-3 text-sm text-[#191c1e] shadow-sm outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>
            <div className="flex flex-1 items-center gap-1 rounded-xl bg-[#f3f1f7] p-1">
              {[{ key: "ALL", label: "Semua" }, { key: "Active", label: "Aktif" }, { key: "Inactive", label: "Nonaktif" }].map((s) => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => setStatusFilter(s.key)}
                  className={`flex-1 rounded-lg px-3.5 py-2 text-xs font-bold whitespace-nowrap transition ${
                    statusFilter === s.key ? "bg-white text-[#3525cd] shadow-sm" : "text-[#8b8898] hover:text-[#464555]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full rounded-xl border border-[#e0e3e5] bg-white px-4 py-12 text-center text-[#9a97a9]">
              {loading ? "Memuat data produk..." : "Tidak ada produk yang cocok dengan filter."}
            </div>
          ) : (
            filteredProducts.map((product, index) => {
              const Icon = iconCycle[index % iconCycle.length];
              const colorKey = colorCycle[index % colorCycle.length];

              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-2xl border border-[#e0e3e5] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* Product Header */}
                  <div className={`relative h-36 overflow-hidden p-5 text-white ${colorStyles[colorKey]}`}>
                    <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
                    <div className="absolute right-20 bottom-[-40px] h-28 w-28 rounded-full bg-white/10" />

                    <div className="relative flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                        <Icon size={21} />
                      </div>
                      <StatusBadge status={product.status} />
                    </div>
                  </div>

                  {/* Product Content */}
                  <div className="p-5">
                    <h2 className="text-xl font-bold text-[#191c1e]">{product.name}</h2>

                    <div className="mt-2 flex items-end gap-2">
                      <span className="text-2xl font-bold text-[#3525cd]">
                        Rp {formatPrice(product.price)}
                      </span>
                      <span className="mb-1 text-sm text-[#777487]">/bulan</span>
                    </div>

                    <p className="mt-3 min-h-[42px] text-sm leading-relaxed text-[#64748b] line-clamp-2">
                      {product.description || "-"}
                    </p>

                    <div className="my-4 border-t border-[#e5e7eb]" />

                    <div className="flex items-center gap-2 text-sm text-[#464555]">
                      <CalendarDays className="h-4 w-4 text-[#3525cd]" />
                      <span>{product.billing_type || "monthly"} / Bulanan</span>
                    </div>

                    <div className="mt-2 flex items-center gap-2 text-xs text-[#9a97a9]">
                      <Clock className="h-4 w-4" />
                      Diperbarui {formatDateTime(product.updated_at)}
                    </div>

                    {/* Actions */}
                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDetailTarget(product)}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[#c7c4d8] bg-white py-2.5 text-sm font-semibold text-[#3525cd] transition hover:bg-[#f5f3ff]"
                      >
                        <Eye className="h-4 w-4" />
                        Detail
                      </button>

                      <button
                        type="button"
                        onClick={() => openEdit(product)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#f59e0b]/10 text-[#b45309] transition hover:bg-[#f59e0b]/20"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTarget(product)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#ba1a1a]/10 text-[#ba1a1a] transition hover:bg-[#ba1a1a]/20"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Tambah/Edit */}
        {modalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#e0e3e5] bg-white shadow-2xl">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[#3525cd] to-[#5b44f3] px-6 py-5 text-white">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                <div className="absolute -bottom-3 right-10 h-12 w-12 rounded-full bg-white/10" />

                <div className="relative flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    {editingId ? <Pencil size={18} /> : <Plus size={18} />}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">
                      {editingId ? "Edit Produk" : "Tambah Produk"}
                    </h2>
                    <p className="text-xs text-white/80">
                      {editingId ? "Perbarui data produk di bawah ini." : "Isi data produk baru untuk ditambahkan."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Nama Produk</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => {
                      setForm({ ...form, name: e.target.value });
                      setFormErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="cth: Paket Hosting Basic"
                    className={fieldClass("name")}
                  />
                  <FieldError errors={formErrors} field="name" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Deskripsi</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => {
                      setForm({ ...form, description: e.target.value });
                      setFormErrors((prev) => ({ ...prev, description: undefined }));
                    }}
                    placeholder="cth: Hosting dengan 10GB SSD, bandwidth unlimited"
                    rows={3}
                    className={fieldClass("description")}
                  />
                  <FieldError errors={formErrors} field="description" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Harga Bulanan (IDR)</label>
                    <input
                      type="text"
                      value={form.price}
                      onChange={(e) => {
                        setForm({ ...form, price: e.target.value.replace(/[^0-9]/g, "") });
                        setFormErrors((prev) => ({ ...prev, price: undefined }));
                      }}
                      placeholder="cth: 150000"
                      className={fieldClass("price")}
                    />
                    <FieldError errors={formErrors} field="price" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Harga Tahunan (IDR)</label>
                    <input
                      type="text"
                      value={form.price_yearly}
                      onChange={(e) =>
                        setForm({ ...form, price_yearly: e.target.value.replace(/[^0-9]/g, "") })
                      }
                    placeholder="cth: 1500000"
                    className={inputClass}
                  />
                </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Billing Type</label>
                    <select
                      value={form.billing_type}
                      onChange={(e) => setForm({ ...form, billing_type: e.target.value })}
                      className={inputClass}
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#464555]">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className={inputClass}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">
                    Fitur (pisahkan dengan koma)
                  </label>
                  <input
                    type="text"
                    value={form.features}
                    onChange={(e) => setForm({ ...form, features: e.target.value })}
                    placeholder="cth: SSD 10GB, Bandwidth Unlimited, SSL Gratis"
                    className={inputClass}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="popular"
                    checked={form.popular}
                    onChange={(e) => setForm({ ...form, popular: e.target.checked })}
                    className="h-4 w-4 rounded border-[#c7c4d8] text-[#3525cd] focus:ring-[#3525cd]"
                  />
                  <label htmlFor="popular" className="text-sm font-semibold text-[#464555]">
                    Tandai sebagai Populer
                  </label>
                </div>
              </div>

              <div className="flex gap-3 border-t border-[#e0e3e5] px-6 py-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 rounded-xl border border-[#e0e3e5] bg-white py-2.5 text-sm font-semibold text-[#464555] transition hover:bg-[#faf9fc]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] py-2.5 text-sm font-semibold text-white transition hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Produk"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {detailTarget && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
            onClick={() => setDetailTarget(null)}
          >
            <div
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#e0e3e5] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#3525cd] via-[#5b44f3] to-[#6d5cff] px-6 py-6 text-white">
                <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/10" />
                <div className="absolute right-20 bottom-[-35px] h-28 w-28 rounded-full bg-white/10" />

                <div className="relative flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                      <ShieldCheck size={22} />
                    </div>
                    <div>
                      <p className="text-xl font-bold">{detailTarget.name}</p>
                      <p className="text-sm text-white/75">Detail Produk</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailTarget(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="relative mt-6 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">HARGA</p>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold">Rp {formatPrice(detailTarget.price)}</span>
                      <span className="text-sm text-white/80">/bulan</span>
                    </div>
                  </div>
                  <StatusBadge status={detailTarget.status} />
                </div>
              </div>

              {/* Modal Body */}
              <div className="max-h-[55vh] overflow-y-auto p-6">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9a97a9]">DESKRIPSI</p>
                  <p className="mt-2 text-sm leading-relaxed text-[#464555]">{detailTarget.description || "-"}</p>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-[#e7e5f4] bg-[#faf9ff] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a97a9]">HARGA BULANAN</p>
                    <p className="mt-2 text-lg font-bold text-[#3525cd]">Rp {formatPrice(detailTarget.price)}</p>
                  </div>
                  <div className="rounded-xl border border-[#e7e5f4] bg-[#faf9ff] p-4">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a97a9]">HARGA TAHUNAN</p>
                    <p className="mt-2 text-lg font-bold text-[#3525cd]">
                      {detailTarget.price_yearly ? `Rp ${formatPrice(detailTarget.price_yearly)}` : "-"}
                    </p>
                  </div>
                </div>

                {detailTarget.features && detailTarget.features.length > 0 && (
                  <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9a97a9]">FITUR</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {detailTarget.features.map((f, i) => (
                        <span key={i} className="rounded-full bg-[#f0ecf9] px-3 py-1 text-xs font-semibold text-[#3525cd]">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-3 rounded-xl border border-[#e0e3e5] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3525cd]/10 text-[#3525cd]">
                      <Clock size={17} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a97a9]">DIBUAT</p>
                      <p className="mt-1 text-xs font-semibold text-[#464555]">{formatDateTime(detailTarget.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-xl border border-[#ccfbf1] bg-[#f0fdfa] p-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0d9488]/10 text-[#0d9488]">
                      <CalendarDays size={17} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">TERAKHIR DIPERBARUI</p>
                      <p className="mt-1 text-xs font-semibold text-[#464555]">{formatDateTime(detailTarget.updated_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex justify-end border-t border-[#e0e3e5] px-6 py-4">
                <button
                  type="button"
                  onClick={() => setDetailTarget(null)}
                  className="rounded-xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation */}
        {deleteTarget && (
          <div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setDeleteTarget(null)}
          >
            <div
              className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-[#dc2626] to-[#ef4444] px-6 py-5 text-white">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Trash2 size={18} />
                  </div>
                  <h2 className="text-lg font-bold">Hapus Produk?</h2>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm leading-relaxed text-[#464555]">
                  Yakin ingin menghapus produk{" "}
                  <span className="font-bold">"{deleteTarget.name}"</span>? Tindakan ini tidak dapat dibatalkan.
                </p>
              </div>
              <div className="flex justify-end gap-3 border-t border-[#e0e3e5] px-6 py-4">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="rounded-xl border border-[#c7c4d8] px-5 py-2.5 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-[#dc2626] to-[#ef4444] px-5 py-2.5 text-sm font-semibold text-white shadow-md disabled:opacity-50"
                >
                  {loading ? "Menghapus..." : "Hapus"}
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
