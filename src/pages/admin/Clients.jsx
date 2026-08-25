import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  X,
  Users,
  UserCheck,
  UserX,
  Globe,
  AlertTriangle,
  Eye,
  Phone,
  CalendarDays,
  CheckCircle2,
  Mail,
  MapPin,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import {
  getClients,
  createClient,
  updateClient,
  updateClientStatus,
} from "../../services/clientApi";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  company_name: "",
  pic_name: "",
  email: "",
  phone: "",
  address: "",
  status: "Active",
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

function FieldError({ errors, field }) {
  return errors?.[field] ? (
    <p className="mt-1 text-xs font-medium text-[#ba1a1a]">{errors[field]}</p>
  ) : null;
}

const fetchClients = async (token) => {
  const res = await getClients(1, 1000, undefined, undefined, token);
  const data = (res && res.data) || res || [];
  return data.map((client) => ({ ...client, status: toUiStatus(client.status) }));
};

export default function AdminClients() {
  const { accessToken } = useAuth();
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [statusTarget, setStatusTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);

  const loadClients = async () => {
    try {
      const data = await fetchClients(accessToken);
      setClients(data);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data client dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setError("");
      const data = await fetchClients(accessToken);
        if (!ignore) setClients(data);
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Gagal mengambil data client dari server.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    document.body.style.overflow = modalOpen || statusTarget || detailTarget ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen, statusTarget, detailTarget]);

  const stats = useMemo(
    () => [
      {
        title: "Total Clients",
        value: clients.length,
        description: "Semua client terdaftar",
        icon: Users,
        className: "bg-gradient-to-r from-[#2563eb] to-[#3b82f6]",
      },
      {
        title: "Active",
        value: clients.filter((client) => client.status === "Active").length,
        description: "Client dengan status aktif",
        icon: UserCheck,
        className: "bg-gradient-to-r from-[#0d9488] to-[#14b8a6]",
      },
      {
        title: "Inactive",
        value: clients.filter((client) => client.status === "Inactive").length,
        description: "Client dengan status inaktif",
        icon: UserX,
        className: "bg-gradient-to-r from-[#dc2626] to-[#ef4444]",
      },
    ],
    [clients]
  );

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchSearch =
        client.company_name?.toLowerCase().includes(search.toLowerCase()) ||
        client.pic_name?.toLowerCase().includes(search.toLowerCase()) ||
        client.email?.toLowerCase().includes(search.toLowerCase());

      const matchStatus = statusFilter === "ALL" || client.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [clients, search, statusFilter]);

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
    else if (!form.email.includes("@")) newErrors.email = "Email harus mengandung @";
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
        await updateClient(editingId, payload, accessToken);
        setSuccess("Data client berhasil diperbarui.");
      } else {
        await createClient(payload, accessToken);
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
      await updateClientStatus(statusTarget.id, newDbStatus, accessToken);

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
              <h1 className="mt-1 text-2xl font-bold">Client Management</h1>
              <p className="mt-1 text-sm text-white/80">
                Kelola data client dan langganan hosting pada sistem HostFlow.
              </p>
            </div>

            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#3525cd] shadow-sm transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Tambah Client
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

        {/* Table Card */}
        <div className="overflow-hidden rounded-xl border border-[#e0e3e5] bg-white shadow-sm">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-[#e0e3e5] p-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a97a9]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama atau email client..."
                className="w-full rounded-lg border border-[#c7c4d8] bg-white py-2 pl-9 pr-3 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
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

          {/* Table */}
          <div className="overflow-x-auto">
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
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-[#9a97a9]">
                      {loading ? "Memuat data client..." : "Tidak ada client yang cocok dengan filter."}
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
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
                            title="Nonaktifkan / Aktifkan"
                            className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
                              client.status === "Active"
                                ? "bg-[#dc2626]/10 text-[#dc2626] hover:bg-[#dc2626]/20"
                                : "bg-[#10b981]/10 text-[#059669] hover:bg-[#10b981]/20"
                            }`}
                          >
                            {client.status === "Active" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
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

        {/* Modal Tambah/Edit */}
        {modalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[#e0e3e5] bg-white shadow-2xl">
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
                      {editingId ? "Edit Client" : "Tambah Client"}
                    </h2>
                    <p className="text-xs text-white/80">
                      {editingId
                        ? "Perbarui data client di bawah ini."
                        : "Isi data client baru untuk ditambahkan."}
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

              <div className="max-h-[65vh] space-y-4 overflow-y-auto px-6 py-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">
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
                  <FieldError errors={errors} field="company_name" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">
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
                  <FieldError errors={errors} field="pic_name" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">
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
                  <FieldError errors={errors} field="email" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">
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
                  <FieldError errors={errors} field="phone" />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">
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
                    className={inputClass}
                  />
                </div>

                {editingId && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-[#464555]">
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

              <div className="flex justify-end gap-3 border-t border-[#e0e3e5] px-6 py-4">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-[#c7c4d8] px-5 py-2.5 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Tambah Client"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Ubah Status */}
        {statusTarget && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#e0e3e5] bg-white shadow-2xl">
              <div className="relative bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] px-6 py-5 text-white">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                <div className="absolute -bottom-3 right-10 h-12 w-12 rounded-full bg-white/10" />

                <div className="relative flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Users size={18} />
                  </div>
                  <h2 className="text-lg font-bold">Ubah Status Client?</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-6">
                <div className="flex items-center gap-3 rounded-xl bg-[#eff6ff] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#dbeafe] text-[#2563eb]">
                    <AlertTriangle size={20} />
                  </div>
                  <p className="text-sm text-[#1e40af]">
                    Ubah status{" "}
                    <span className="font-bold">"{statusTarget.company_name}"</span> dari{" "}
                    <span className="font-bold">{statusTarget.status}</span> menjadi{" "}
                    <span className="font-bold">
                      {statusTarget.status === "Active" ? "Inactive" : "Active"}
                    </span>
                    ?
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#e0e3e5] px-6 py-4">
                <button
                  type="button"
                  onClick={() => setStatusTarget(null)}
                  className="rounded-xl border border-[#c7c4d8] px-5 py-2.5 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0]"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={confirmToggleStatus}
                  disabled={loading}
                  className="rounded-xl bg-gradient-to-r from-[#3b82f6] to-[#60a5fa] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
                >
                  {loading ? "Menyimpan..." : "Ya, Ubah"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail Client */}
        {detailTarget && (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[1px]"
            onClick={() => setDetailTarget(null)}
          >
            <div
              className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-[#e0e3e5] bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header Detail */}
              <div className="relative overflow-hidden bg-gradient-to-r from-[#3525cd] via-[#4a3ae0] to-[#6d5cff] px-6 py-5 text-white">
                <div className="absolute -right-8 -top-10 h-36 w-36 rounded-full bg-white/10" />
                <div className="absolute right-16 bottom-[-34px] h-28 w-28 rounded-full bg-white/10" />
                <div className="absolute -left-10 bottom-[-45px] h-28 w-28 rounded-full bg-white/[0.06]" />

                <div className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                      <Globe size={21} />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{detailTarget.company_name}</p>
                      <p className="text-sm text-white/75">Detail Client</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailTarget(null)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white transition hover:bg-white/25"
                    title="Tutup"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="relative mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">
                      STATUS CLIENT
                    </p>
                    <div className="mt-1">
                      <StatusBadge status={detailTarget.status} />
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-white/70">
                      TERDAFTAR
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {detailTarget.created_at
                        ? new Date(detailTarget.created_at).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="max-h-[55vh] overflow-y-auto px-6 py-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#e7e5f4] bg-[#faf9ff] p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#3525cd]/10 text-[#3525cd]">
                      <Users size={16} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a97a9]">
                      PIC
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#191c1e]">
                      {detailTarget.pic_name || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#ccfbf1] bg-[#f0fdfa] p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#0d9488]/10 text-[#0d9488]">
                      <Phone size={16} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                      No. Telepon
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#191c1e]">
                      {detailTarget.phone || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#fecdd3] bg-[#fff1f2] p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#ef4444]/10 text-[#ef4444]">
                      <Mail size={16} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#64748b]">
                      Email
                    </p>
                    <p
                      className="mt-1 truncate text-sm font-bold text-[#191c1e]"
                      title={detailTarget.email}
                    >
                      {detailTarget.email || "-"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#fde68a] bg-[#fffbeb] p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b]/10 text-[#f59e0b]">
                      <CalendarDays size={16} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#92400e]">
                      Tanggal Terdaftar
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#191c1e]">
                      {detailTarget.created_at
                        ? new Date(detailTarget.created_at).toLocaleDateString("id-ID")
                        : "-"}
                    </p>
                  </div>
                </div>

                {/* Alamat */}
                <div className="mt-3 rounded-xl border border-[#e7e5f4] bg-[#faf9ff] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3525cd]/10 text-[#3525cd]">
                      <MapPin size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a97a9]">
                        Alamat
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-snug text-[#191c1e]">
                        {detailTarget.address || "-"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ringkasan status */}
                <div className="mt-3 overflow-hidden rounded-xl border border-[#e0e3e5]">
                  <div
                    className={`flex items-center gap-3 px-4 py-3 ${
                      detailTarget.status === "Active"
                        ? "bg-[#ecfdf5]"
                        : "bg-[#f1f5f9]"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        detailTarget.status === "Active"
                          ? "bg-[#10b981]/15 text-[#10b981]"
                          : "bg-[#94a3b8]/15 text-[#94a3b8]"
                      }`}
                    >
                      {detailTarget.status === "Active" ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <UserX size={16} />
                      )}
                    </div>
                    <div>
                      <p
                        className={`text-sm font-bold ${
                          detailTarget.status === "Active"
                            ? "text-[#065f46]"
                            : "text-[#475569]"
                        }`}
                      >
                        {detailTarget.status === "Active"
                          ? "Client Aktif"
                          : "Client Tidak Aktif"}
                      </p>
                      <p
                        className={`text-[11px] ${
                          detailTarget.status === "Active"
                            ? "text-[#059669]"
                            : "text-[#94a3b8]"
                        }`}
                      >
                        {detailTarget.status === "Active"
                          ? "Langganan hosting aktif dan berjalan"
                          : "Akun client tidak aktif"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
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
      </main>
    </div>
  );
}
