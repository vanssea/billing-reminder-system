import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  X,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
  Eye,
  RefreshCcw
} from "lucide-react";

// Import komponen layout milikmu
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";

// Import API Admin (pastikan path-nya sesuai)
import {
  getClients,
  createClient,
  updateClient,
  updateClientStatus,
} from "../../services/clientApi";

const emptyForm = {
  company_name: "",
  pic_name: "",
  email: "",
  phone: "",
  address: "",
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

const statusToDb = {
  Active: "ACTIVE",
  Inactive: "INACTIVE",
};

const dbToStatus = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
};

const toUiStatus = (status) =>
  dbToStatus[(status || "").toUpperCase()] || status || "Inactive";

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Inactive}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${statusDots[status] || statusDots.Inactive}`} />
      {status}
    </span>
  );
}

export default function AdminClients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [statusTarget, setStatusTarget] = useState(null); // Pengganti Delete
  const [detailTarget, setDetailTarget] = useState(null);

  useEffect(() => {
    // Debounce search agar tidak spam API
    const timer = setTimeout(() => {
      loadClients();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, statusFilter, page]);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

const loadClients = async () => {
    try {
      setLoading(true);
      setError("");

      const dbStatus = statusFilter === "All Status" ? "" : statusToDb[statusFilter];
      const res = await getClients(page, 10, search, dbStatus);
      
      // PERBAIKAN DI SINI: Hapus .data yang dobel
      const fetchedData = res.data || [];
      
      setClients(
        fetchedData.map((client) => ({
          ...client,
          status: toUiStatus(client.status),
        }))
      );
      
      // PERBAIKAN DI SINI: Langsung akses res.pagination
      setTotalPages(res.pagination?.total_pages || 1);
      setTotalItems(res.pagination?.total || 0);
      
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data client dari server.");
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(
    () => [
      {
        title: "Total Clients",
        value: totalItems,
        description: "Semua client terdaftar",
        icon: Users,
      },
      {
        title: "Active (Halaman Ini)",
        value: clients.filter((client) => client.status === "Active").length,
        description: "Client aktif yang ditampilkan",
        icon: UserCheck,
      },
      {
        title: "Inactive (Halaman Ini)",
        value: clients.filter((client) => client.status === "Inactive").length,
        description: "Client inaktif yang ditampilkan",
        icon: UserX,
      },
    ],
    [clients, totalItems]
  );

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (client) => {
    setEditingId(client.id);
    setForm({
      company_name: client.company_name || "",
      pic_name: client.pic_name || "",
      email: client.email || "",
      phone: client.phone || "",
      address: client.address || "",
      status: client.status || "Active",
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const newErrors = {};

    if (!form.company_name.trim()) newErrors.company_name = "Nama wajib diisi";
    if (!form.pic_name.trim()) newErrors.pic_name = "Nama PIC wajib diisi";
    if (!form.email.trim()) newErrors.email = "Email wajib diisi";
    else if (!form.email.includes("@"))
      newErrors.email = "Email harus mengandung @";
    if (!form.phone.trim()) newErrors.phone = "No. Telepon wajib diisi";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const payload = {
        company_name: form.company_name,
        pic_name: form.pic_name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        status: statusToDb[form.status] || form.status,
      };

      if (editingId) {
        await updateClient(editingId, payload);
        setSuccess("Data client berhasil diperbarui.");
      } else {
        await createClient(payload);
        setSuccess("Client baru berhasil ditambahkan.");
      }

      await loadClients();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan data client.");
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

      const newDbStatus = statusTarget.status === "Active" ? "INACTIVE" : "ACTIVE";
      await updateClientStatus(statusTarget.id, newDbStatus);

      setSuccess(`Status client berhasil diubah menjadi ${toUiStatus(newDbStatus)}.`);
      setStatusTarget(null);
      await loadClients();
    } catch (err) {
      console.error(err);
      setError("Gagal mengubah status client.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20";

  const fieldClass = (field) =>
    errors[field]
      ? "w-full rounded-lg border border-[#ba1a1a] bg-[#fffafa] px-3 py-2 text-sm text-[#191c1e] outline-none transition focus:border-[#ba1a1a] focus:ring-2 focus:ring-[#ba1a1a]/20"
      : inputClass;

  const FieldError = ({ field }) =>
    errors[field] ? (
      <p className="mt-1 text-xs font-medium text-[#ba1a1a]">{errors[field]}</p>
    ) : null;

  return (
    <div className="flex min-h-screen bg-[#fcf8ff] font-sans">
      <Sidebar role="admin" />
      
    <div className="flex-1 md:ml-[280px] flex flex-col min-h-screen w-full relative">
        <Header />

        {/* UBAH BARIS INI: Tambahkan mt-20 agar tidak tertutup Header */}
        <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8 mt-20"> 
          
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-[#191c1e]">Management Client</h1>
              <p className="mt-1 text-sm text-[#777587]">
                Kelola data client dan status operasional.
              </p>
            </div>

            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg bg-[#3525cd] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a1db0]"
            >
              <Plus className="h-4 w-4" />
              Tambah Client
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
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat) => (
              <div
                key={stat.title}
                className="rounded-xl border border-[#e0e3e5] bg-white p-5 shadow-sm"
              >
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
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari nama atau email client..."
                  className="w-full rounded-lg border border-[#c7c4d8] bg-white py-2 pl-9 pr-3 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-[#c7c4d8] bg-white px-3 py-2 text-sm text-[#464555] outline-none transition focus:border-[#3525cd]"
              >
                <option>All Status</option>
                <option>Active</option>
                <option>Inactive</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              {loading && clients.length === 0 ? (
                <div className="px-4 py-12 text-center text-[#9a97a9]">Memuat data...</div>
              ) : (
                <table className="w-full min-w-[940px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-[#e0e3e5] bg-[#faf9fc] text-xs uppercase tracking-wide text-[#9a97a9]">
                      <th className="px-4 py-3 font-semibold">Client</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">PIC</th>
                      <th className="px-4 py-3 font-semibold">No. Telepon</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Terdaftar</th>
                      <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-[#9a97a9]">
                          Tidak ada client yang ditemukan.
                        </td>
                      </tr>
                    ) : (
                      clients.map((client) => (
                        <tr
                          key={client.id}
                          className="border-b border-[#e0e3e5] transition last:border-b-0 hover:bg-[#faf9fc]"
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e2dfff] text-sm font-bold text-[#3525cd]">
                                {(client.company_name || "")
                                  .split(" ")
                                  .map((word) => word[0])
                                  .slice(0, 2)
                                  .join("") || "?"}
                              </div>
                              <div>
                                <p className="font-semibold text-[#191c1e]">{client.company_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[#464555]">{client.email}</td>
                          <td className="px-4 py-3 text-[#464555]">{client.pic_name || "-"}</td>
                          <td className="px-4 py-3 text-[#464555]">{client.phone || "-"}</td>
                          <td className="px-4 py-3">
                            <StatusBadge status={client.status} />
                          </td>
                          <td className="px-4 py-3 text-[#464555]">
                            {client.created_at
                              ? new Date(client.created_at).toLocaleDateString("id-ID")
                              : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setDetailTarget(client)}
                                title="Detail"
                                className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3525cd]/10 text-[#3525cd] transition hover:bg-[#3525cd]/20"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openEdit(client)}
                                title="Edit"
                                className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f59e0b]/10 text-[#b45309] transition hover:bg-[#f59e0b]/20"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setStatusTarget(client)}
                                title="Ubah Status"
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
              )}
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="flex items-center justify-between border-t border-[#e0e3e5] bg-white px-4 py-3 sm:px-6">
                <p className="text-sm text-[#777587]">
                  Halaman <span className="font-medium text-[#191c1e]">{page}</span> dari <span className="font-medium text-[#191c1e]">{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="rounded-lg border border-[#c7c4d8] px-3 py-1.5 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sebelumnya
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="rounded-lg border border-[#c7c4d8] px-3 py-1.5 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modal Tambah/Edit */}
          {modalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-[#e0e3e5] bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#e0e3e5] px-5 py-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#191c1e]">
                      {editingId ? "Edit Client" : "Tambah Client"}
                    </h2>
                    <p className="text-xs text-[#777587]">
                      {editingId
                        ? "Perbarui data client di bawah ini."
                        : "Isi data client baru untuk ditambahkan."}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#464555] transition hover:bg-[#eceef0]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-4 px-5 py-5 max-h-[60vh] overflow-y-auto">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#464555]">
                      Nama Perusahaan / Client
                    </label>
                    <input
                      type="text"
                      value={form.company_name}
                      onChange={(event) => {
                        setForm({ ...form, company_name: event.target.value });
                        setErrors((prev) => ({ ...prev, company_name: undefined }));
                      }}
                      placeholder="cth: PT Nusantara Jaya"
                      className={fieldClass("company_name")}
                    />
                    <FieldError field="company_name" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#464555]">
                      Nama PIC
                    </label>
                    <input
                      type="text"
                      value={form.pic_name}
                      onChange={(event) => {
                        setForm({ ...form, pic_name: event.target.value });
                        setErrors((prev) => ({ ...prev, pic_name: undefined }));
                      }}
                      placeholder="cth: Budi Santoso"
                      className={fieldClass("pic_name")}
                    />
                    <FieldError field="pic_name" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#464555]">
                      Email
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) => {
                        setForm({ ...form, email: event.target.value });
                        setErrors((prev) => ({ ...prev, email: undefined }));
                      }}
                      placeholder="contact@perusahaan.com"
                      className={fieldClass("email")}
                    />
                    <FieldError field="email" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#464555]">
                      No. Telepon
                    </label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(event) => {
                        setForm({
                          ...form,
                          phone: event.target.value.replace(/\D/g, ""),
                        });
                        setErrors((prev) => ({ ...prev, phone: undefined }));
                      }}
                      placeholder="cth: 081234567890"
                      className={fieldClass("phone")}
                    />
                    <FieldError field="phone" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#464555]">
                      Alamat
                    </label>
                    <textarea
                      value={form.address}
                      onChange={(event) => {
                        setForm({ ...form, address: event.target.value });
                        setErrors((prev) => ({ ...prev, address: undefined }));
                      }}
                      placeholder="cth: Jl. Sudirman No. 123, Jakarta"
                      rows={3}
                      className={fieldClass("address")}
                    />
                    <FieldError field="address" />
                  </div>

                  {editingId && (
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-[#464555]">
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm({ ...form, status: event.target.value })
                        }
                        className={inputClass}
                      >
                        <option>Active</option>
                        <option>Inactive</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 border-t border-[#e0e3e5] px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="rounded-lg border border-[#c7c4d8] px-4 py-2 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="rounded-lg bg-[#3525cd] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a1db0]"
                  >
                    {editingId ? "Simpan Perubahan" : "Tambah Client"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Modal Konfirmasi Ubah Status (Menggantikan Delete) */}
          {statusTarget && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-xl border border-[#e0e3e5] bg-white p-5 shadow-xl">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#f0ecf9] text-[#3525cd]">
                    <RefreshCcw className="h-7 w-7" />
                  </div>

                  <h2 className="text-lg font-bold text-[#191c1e]">Ubah Status?</h2>

                  <p className="mt-2 text-sm text-[#777587]">
                    Ubah status <span className="font-semibold text-[#191c1e]">"{statusTarget.company_name}"</span> dari {statusTarget.status} menjadi {statusTarget.status === "Active" ? "Inactive" : "Active"}?
                  </p>

                  <div className="mt-6 flex w-full gap-2">
                    <button
                      type="button"
                      onClick={() => setStatusTarget(null)}
                      className="flex-1 rounded-lg border border-[#c7c4d8] px-4 py-2.5 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0]"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={confirmToggleStatus}
                      className="flex-1 rounded-lg bg-[#3525cd] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2a1db0]"
                    >
                      Ya, Ubah
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal Detail */}
          {detailTarget && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-[#e0e3e5] bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-[#e0e3e5] px-5 py-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#191c1e]">Detail Client</h2>
                    <p className="text-xs text-[#777587]">
                      Informasi lengkap client pada sistem HostFlow.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetailTarget(null)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-[#464555] transition hover:bg-[#eceef0]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-5 py-5">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e2dfff] text-base font-bold text-[#3525cd]">
                      {(detailTarget.company_name || "")
                        .split(" ")
                        .map((word) => word[0])
                        .slice(0, 2)
                        .join("") || "?"}
                    </div>
                    <div>
                      <p className="font-semibold text-[#191c1e]">
                        {detailTarget.company_name}
                      </p>
                      <div className="mt-0.5">
                        <StatusBadge status={detailTarget.status} />
                      </div>
                    </div>
                  </div>

                  <dl className="space-y-3">
                    {[
                      ["Email", detailTarget.email],
                      ["Nama PIC", detailTarget.pic_name || "-"],
                      ["No. Telepon", detailTarget.phone || "-"],
                      ["Alamat", detailTarget.address || "-"],
                      [
                        "Terdaftar",
                        detailTarget.created_at
                          ? new Date(detailTarget.created_at).toLocaleDateString("id-ID")
                          : "-",
                      ],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-start justify-between gap-4">
                        <dt className="text-sm text-[#777587]">{label}</dt>
                        <dd className="text-right text-sm font-medium text-[#191c1e]">
                          {value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>

                <div className="flex justify-end border-t border-[#e0e3e5] px-5 py-4">
                  <button
                    type="button"
                    onClick={() => setDetailTarget(null)}
                    className="rounded-lg bg-[#3525cd] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2a1db0]"
                  >
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