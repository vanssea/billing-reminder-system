import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  X,
  Package,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  RefreshCcw,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import {
  getProducts,
  createProduct,
  updateProduct,
  updateProductStatus,
} from "../../services/productApi";

const emptyForm = {
  name: "",
  storage: "",
  max_mailbox: "",
  price: "",
  billing_cycle: "Bulanan",
  status: "Active",
};

const statusStyles = {
  Active: "bg-[#10b981]/10 text-[#0f9d6e]",
  Inactive: "bg-[#e2e8f0] text-[#64748b]",
};

const statusDots = {
  Active: "bg-[#10b981]",
  Inactive: "bg-[#94a3b8]",
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Inactive}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${statusDots[status] || statusDots.Inactive}`} />
      {status}
    </span>
  );
}

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [statusTarget, setStatusTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await getProducts();
      setProducts(data || []);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data produk dari server/Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => [
      {
        title: "Total Produk",
        value: products.length,
        description: "Semua paket layanan aktif",
        icon: Package,
      },
      {
        title: "Aktif",
        value: products.filter((p) => p.status === "Active").length,
        description: "Paket yang tersedia untuk client",
        icon: CheckCircle2,
      },
      {
        title: "Nonaktif",
        value: products.filter((p) => p.status === "Inactive").length,
        description: "Paket disembunyikan",
        icon: XCircle,
      },
    ],
    [products]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchSearch = product.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All Status" || product.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [products, search, statusFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name || "",
      storage: product.storage || "",
      max_mailbox: product.max_mailbox || "",
      price: product.price || "",
      billing_cycle: product.billing_cycle || "Bulanan",
      status: product.status || "Active",
    });
    setErrors({});
    setModalOpen(true);
  };

const handleSave = async () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = "Nama produk wajib diisi";
    if (!form.storage.trim()) newErrors.storage = "Kapasitas storage wajib diisi";
    if (!form.price.toString().trim()) newErrors.price = "Harga wajib diisi";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      // UBAH DI SINI: Pastikan price dan max_mailbox dikirim sebagai tipe data Angka (Number)
      const payload = {
        name: form.name,
        storage: form.storage,
        max_mailbox: form.max_mailbox ? Number(form.max_mailbox) : 0,
        price: Number(form.price),
        billing_cycle: form.billing_cycle,
        status: form.status || "Active",
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        setSuccess("Produk berhasil diperbarui.");
      } else {
        await createProduct(payload);
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

  const confirmToggleStatus = async () => {
    if (!statusTarget) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const newStatus = statusTarget.status === "Active" ? "Inactive" : "Active";
      await updateProductStatus(statusTarget.id, newStatus);

      setSuccess(`Status produk berhasil diubah menjadi ${newStatus}.`);
      setStatusTarget(null);
      await loadProducts();
    } catch (err) {
      console.error(err);
      setError("Gagal mengubah status produk.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20";

  const fieldClass = (field) =>
    errors[field]
      ? "w-full rounded-lg border border-[#ba1a1a] bg-[#fffafa] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#ba1a1a]"
      : inputClass;

  return (
    <div className="flex min-h-screen bg-[#fcf8ff] font-sans">
      <Sidebar role="admin" />
      
    <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen w-full relative">
        <Header />

        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8 mt-20">
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#191c1e]">Pengelolaan Produk</h1>
              <p className="mt-1 text-sm text-[#777587]">
                Kelola paket dan harga layanan Email Hosting.
              </p>
            </div>

            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg bg-[#3525cd] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a1db0]"
            >
              <Plus className="h-4 w-4" />
              Tambah Produk
            </button>
          </div>

          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-sm font-medium text-[#ba1a1a]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-[#10b981]/30 bg-[#d1fae5] px-4 py-3 text-sm font-medium text-[#0f9d6e]">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div key={stat.title} className="rounded-xl border border-[#e0e3e5] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#777587]">{stat.title}</p>
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f0ecf9] text-[#3525cd]">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-[#191c1e]">{stat.value}</p>
                <p className="mt-1 text-xs text-[#9a97a9]">{stat.description}</p>
              </div>
            ))}
          </div>

          {/* Table Card */}
          <div className="overflow-hidden rounded-xl border border-[#e0e3e5] bg-white shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-3 border-b border-[#e0e3e5] p-4">
              <div className="relative min-w-[220px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a97a9]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama produk..."
                  className="w-full rounded-lg border border-[#c7c4d8] bg-white py-2 pl-9 pr-3 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#464555] outline-none transition focus:border-[#3525cd]"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[940px] text-left text-sm">
                <thead>
                  <tr className="border-b border-[#e0e3e5] bg-[#faf9fc] text-xs uppercase tracking-wide text-[#9a97a9]">
                    <th className="px-4 py-3 font-semibold">Nama Produk</th>
                    <th className="px-4 py-3 font-semibold">Storage</th>
                    <th className="px-4 py-3 font-semibold">Max Mailbox</th>
                    <th className="px-4 py-3 font-semibold">Harga</th>
                    <th className="px-4 py-3 font-semibold">Siklus</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-[#9a97a9]">
                        Tidak ada produk yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product.id} className="border-b border-[#e0e3e5] transition hover:bg-[#faf9fc]">
                        <td className="px-4 py-3 font-semibold text-[#191c1e]">{product.name}</td>
                        <td className="px-4 py-3 text-[#464555]">{product.storage}</td>
                        <td className="px-4 py-3 text-[#464555]">{product.max_mailbox}</td>
                        <td className="px-4 py-3 text-[#464555]">Rp {Number(product.price).toLocaleString("id-ID")}</td>
                        <td className="px-4 py-3 text-[#464555]">{product.billing_cycle}</td>
                        <td className="px-4 py-3">
                          <StatusBadge status={product.status} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setDetailTarget(product)}
                              title="Detail"
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3525cd]/10 text-[#3525cd] transition hover:bg-[#3525cd]/20"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEdit(product)}
                              title="Edit"
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f59e0b]/10 text-[#b45309] transition hover:bg-[#f59e0b]/20"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setStatusTarget(product)}
                              title="Nonaktifkan / Ubah Status"
                              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#64748b]/10 text-[#475569] transition hover:bg-[#64748b]/20"
                            >
                              <RefreshCcw className="h-4 w-4" />
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

          {/* Modal Tambah/Edit Produk */}
          {modalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-[#e0e3e5] bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#e0e3e5] px-5 py-4">
                  <h2 className="text-lg font-bold text-[#191c1e]">
                    {editingId ? "Edit Produk" : "Tambah Produk Baru"}
                  </h2>
                  <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-[#464555] hover:bg-[#eceef0]">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 px-5 py-5 max-h-[60vh] overflow-y-auto">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#464555]">Nama Produk</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="cth: Email Hosting Business"
                      className={fieldClass("name")}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#464555]">Storage</label>
                    <input
                      type="text"
                      value={form.storage}
                      onChange={(e) => setForm({ ...form, storage: e.target.value })}
                      placeholder="cth: 10 GB"
                      className={fieldClass("storage")}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#464555]">Max Mailbox</label>
                    <input
                      type="text"
                      value={form.max_mailbox}
                      onChange={(e) => setForm({ ...form, max_mailbox: e.target.value })}
                      placeholder="cth: 25"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#464555]">Harga (Rp)</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      placeholder="cth: 200000"
                      className={fieldClass("price")}
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#464555]">Siklus Pembayaran</label>
                    <select
                      value={form.billing_cycle}
                      onChange={(e) => setForm({ ...form, billing_cycle: e.target.value })}
                      className={inputClass}
                    >
                      <option>Bulanan</option>
                      <option>Tahunan</option>
                    </select>
                  </div>

                  {editingId && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#464555]">Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className={inputClass}
                      >
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-[#e0e3e5] px-5 py-4">
                  <button onClick={() => setModalOpen(false)} className="rounded-lg border px-4 py-2 text-sm font-semibold text-[#464555]">
                    Batal
                  </button>
                  <button onClick={handleSave} className="rounded-lg bg-[#3525cd] px-4 py-2 text-sm font-semibold text-white">
                    {editingId ? "Simpan Perubahan" : "Tambah Produk"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Konfirmasi Ubah Status / Nonaktifkan */}
          {statusTarget && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0ecf9] text-[#3525cd]">
                  <RefreshCcw className="h-7 w-7" />
                </div>
                <h2 className="text-lg font-bold text-[#191c1e]">Ubah Status Produk?</h2>
                <p className="mt-2 text-sm text-[#777587]">
                  Ubah status <span className="font-semibold text-[#191c1e]">"{statusTarget.name}"</span> menjadi {statusTarget.status === "Active" ? "Inactive (Nonaktif)" : "Active"}?
                </p>
                <div className="mt-6 flex gap-2">
                  <button onClick={() => setStatusTarget(null)} className="flex-1 rounded-lg border px-4 py-2 text-sm font-semibold text-[#464555]">
                    Batal
                  </button>
                  <button onClick={confirmToggleStatus} className="flex-1 rounded-lg bg-[#3525cd] px-4 py-2 text-sm font-semibold text-white">
                    Ya, Ubah
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Detail Produk */}
          {detailTarget && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
                <div className="flex items-center justify-between border-b pb-3">
                  <h2 className="text-lg font-bold text-[#191c1e]">Detail Produk</h2>
                  <button onClick={() => setDetailTarget(null)} className="rounded-lg p-1 text-[#464555]">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="py-4 space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-[#777587]">Nama</span><span className="font-medium">{detailTarget.name}</span></div>
                  <div className="flex justify-between"><span className="text-[#777587]">Storage</span><span className="font-medium">{detailTarget.storage}</span></div>
                  <div className="flex justify-between"><span className="text-[#777587]">Max Mailbox</span><span className="font-medium">{detailTarget.max_mailbox}</span></div>
                  <div className="flex justify-between"><span className="text-[#777587]">Harga</span><span className="font-medium">Rp {Number(detailTarget.price).toLocaleString("id-ID")}</span></div>
                  <div className="flex justify-between"><span className="text-[#777587]">Siklus</span><span className="font-medium">{detailTarget.billing_cycle}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[#777587]">Status</span><StatusBadge status={detailTarget.status} /></div>
                </div>
                <div className="flex justify-end border-t pt-3">
                  <button onClick={() => setDetailTarget(null)} className="rounded-lg bg-[#3525cd] px-4 py-2 text-sm font-semibold text-white">
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}