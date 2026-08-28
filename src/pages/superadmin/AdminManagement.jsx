import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { useAuth } from "../../context/AuthContext";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  X,
  Users,
  UserCheck,
  KeyRound,
  AlertTriangle,
  Eye,
  CheckCircle2,
  Phone,
  Mail,
  CalendarDays,
} from "lucide-react";

import {
  getAdmins,
  createAdmin,
  updateAdmin,
  deleteAdmin,
} from "../../services/adminApi";

const emptyForm = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
};

const toDate = (value) =>
  value ? new Date(value).toLocaleDateString("id-ID") : "-";

const roleLabels = {
  ADMIN: "Admin",
};

const getRoleLabel = (role) =>
  roleLabels[(role || "").toUpperCase()] || role || "Admin";

const getAccountStatus = (admin) =>
  ((admin && admin.status) || "ACTIVE").toUpperCase() === "INACTIVE"
    ? "INACTIVE"
    : "ACTIVE";

const isThisMonth = (value) => {
  if (!value) return false;
  const date = new Date(value);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
};

function FieldError({ field, errors }) {
  return errors[field] ? (
    <p className="mt-1 text-xs font-medium text-[#ba1a1a]">{errors[field]}</p>
  ) : null;
}

export default function AdminManagement() {
  const { accessToken } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [detailTarget, setDetailTarget] = useState(null);

  const loadAdmins = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getAdmins(accessToken);
      setAdmins(data || []);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data admin dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(loadAdmins, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(""), 4000);
    return () => clearTimeout(timer);
  }, [success]);

  const stats = useMemo(
    () => [
      {
        title: "Total Admin",
        value: admins.length,
        description: "Seluruh akun dengan role admin",
        icon: Users,
      },
      {
        title: "Admin Ditambahkan Bulan Ini",
        value: admins.filter((admin) => isThisMonth(admin.created_at)).length,
        description: "Admin baru yang terdaftar pada bulan ini",
        icon: UserCheck,
      },
    ],
    [admins]
  );

  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchSearch =
        (admin.full_name || "")
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        (admin.email || "").toLowerCase().includes(search.toLowerCase()) ||
        (admin.phone || "").toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === "ALL" || getAccountStatus(admin) === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [admins, search, statusFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (admin) => {
    setEditingId(admin.id);
    setForm({
      full_name: admin.full_name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      password: "",
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async () => {
    const newErrors = {};

    if (!form.full_name.trim()) newErrors.full_name = "Nama wajib diisi";
    if (!form.email.trim()) newErrors.email = "Email wajib diisi";
    else if (!form.email.includes("@"))
      newErrors.email = "Email harus mengandung @";

    if (!form.phone.trim()) newErrors.phone = "Nomor telepon wajib diisi";
    else if (form.phone.length < 10)
      newErrors.phone = "Nomor telepon minimal 10 digit";

    if (!editingId) {
      if (!form.password) newErrors.password = "Password wajib diisi";
      else if (form.password.length < 8)
        newErrors.password = "Password minimal 8 karakter";
    } else if (form.password && form.password.length < 8) {
      newErrors.password = "Password minimal 8 karakter";
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      if (editingId) {
        await updateAdmin(editingId, {
          full_name: form.full_name,
          role: "ADMIN",
          phone: form.phone || null,
        }, accessToken);
        setSuccess("Data admin berhasil diperbarui.");
      } else {
        await createAdmin({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          phone: form.phone || null,
        }, accessToken);
        setSuccess("Admin baru berhasil ditambahkan.");
      }

      await loadAdmins();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan data admin.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await deleteAdmin(deleteTarget.id, accessToken);

      setAdmins((prev) =>
        prev.filter((item) => item.id !== deleteTarget.id)
      );

      setSuccess("Admin berhasil dihapus.");
      setDeleteTarget(null);
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus admin.");
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

  const initials = (fullName) =>
    (fullName || "")
      .split(" ")
      .map((word) => word[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?";

  return (
    <div className="min-h-screen bg-[#fcf8ff] pt-16 app-content">
      <Sidebar />
      <Header role="superadmin" />

      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Banner */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] p-6 text-white shadow-lg">
          {/* Decorative circles */}
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-40 -top-6 h-20 w-20 rounded-full bg-white/10" />
          <div className="absolute -left-6 -bottom-6 h-24 w-24 rounded-full bg-white/10" />

          <div className="relative flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-white/80">Super Admin Panel</p>
              <h1 className="mt-1 text-2xl font-bold">Admin Management</h1>
              <p className="mt-1 text-sm text-white/80">
                Kelola akun admin pada sistem HostFlow.
              </p>
            </div>

            <button
              type="button"
              onClick={openAdd}
              className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#3525cd] shadow-sm transition hover:bg-white/90"
            >
              <Plus className="h-4 w-4" />
              Tambah Admin
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Total Admin */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2563eb] to-[#3b82f6] p-5 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
            <div className="absolute -bottom-4 right-12 h-16 w-16 rounded-full bg-white/10" />
            <div className="absolute right-28 -top-4 h-12 w-12 rounded-full bg-white/10" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">
                  {stats[0].title}
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {stats[0].value}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {stats[0].description}
                </p>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5">
                <Users size={20} />
              </div>
            </div>
          </div>

          {/* Admin Ditambahkan Bulan Ini */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#f59e0b] to-[#fbbf24] p-5 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
            <div className="absolute -right-5 -top-5 h-20 w-20 rounded-full bg-white/10" />
            <div className="absolute -bottom-6 right-16 h-14 w-14 rounded-full bg-white/10" />
            <div className="absolute right-32 -top-3 h-10 w-10 rounded-full bg-white/10" />

            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">
                  {stats[1].title}
                </p>
                <p className="mt-1 text-3xl font-bold tracking-tight">
                  {stats[1].value}
                </p>
                <p className="mt-1 text-xs text-white/70">
                  {stats[1].description}
                </p>
              </div>
              <div className="rounded-xl bg-white/20 p-2.5">
                <UserCheck size={20} />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
              <AlertTriangle size={16} />
            </div>
            <span className="text-sm font-medium text-red-700">{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-500">
              <CheckCircle2 size={16} />
            </div>
            <span className="text-sm font-medium text-emerald-700">{success}</span>
          </div>
        )}

        {/* Toolbar */}
        <div className="mb-6 rounded-2xl border border-[#e5e2ea] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a97a9]" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, email, atau telepon admin..."
                className="w-full rounded-xl border border-[#e0e3e5] bg-white py-2.5 pl-9 pr-3 text-sm text-[#191c1e] shadow-sm outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>

            <div className="flex flex-1 items-center gap-1 rounded-xl bg-[#f3f1f7] p-1">
              {[{ key: "ALL", label: "Semua" }, { key: "ACTIVE", label: "ACTIVE" }, { key: "INACTIVE", label: "INACTIVE" }].map((s) => (
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

        {/* Table Card */}
        <div className="overflow-hidden rounded-xl border border-[#e0e3e5] bg-white shadow-sm">
          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e0e3e5] bg-[#faf9fc] text-xs uppercase tracking-wide text-[#9a97a9]">
                  <th className="px-4 py-3 font-semibold">Admin</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">No. Telepon</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Bergabung</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && admins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#9a97a9]">
                      Memuat data admin...
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-[#9a97a9]">
                      Tidak ada admin yang cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredAdmins.map((admin) => (
                    <tr
                      key={admin.id}
                      className="border-b border-[#e0e3e5] transition last:border-b-0 hover:bg-[#faf9fc]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e2dfff] text-sm font-bold text-[#3525cd]">
                            {initials(admin.full_name)}
                          </div>
                          <div>
                            <p className="font-semibold text-[#191c1e]">
                              {admin.full_name}
                            </p>
                            <p className="text-xs text-[#777587]">{admin.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#464555]">{admin.email}</td>
                      <td className="px-4 py-3 text-[#464555]">
                        {admin.phone || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                            getAccountStatus(admin) === "ACTIVE"
                              ? "bg-[#10b981]/10 text-[#0f9d6e]"
                              : "bg-[#e2e8f0] text-[#64748b]"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              getAccountStatus(admin) === "ACTIVE"
                                ? "bg-[#10b981]"
                                : "bg-[#94a3b8]"
                            }`}
                          />
                          {getAccountStatus(admin)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#464555]">
                        {toDate(admin.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailTarget(admin)}
                            title="Detail"
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3525cd]/10 text-[#3525cd] transition hover:bg-[#3525cd]/20"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(admin)}
                            title="Edit"
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#f59e0b]/10 text-[#b45309] transition hover:bg-[#f59e0b]/20"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(admin)}
                            title="Hapus"
                            className="flex h-8 w-8 items-center justify-center rounded-md bg-[#ba1a1a]/10 text-[#ba1a1a] transition hover:bg-[#ba1a1a]/20"
                          >
                            <Trash2 className="h-4 w-4" />
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
                      {editingId ? "Edit Admin" : "Tambah Admin"}
                    </h2>
                    <p className="text-xs text-white/80">
                      {editingId
                        ? "Perbarui data admin di bawah ini."
                        : "Isi data admin baru untuk ditambahkan."}
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

              {/* Form */}
              <div className="space-y-4 px-6 py-6">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">
                    Nama Lengkap
                  </label>
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(event) => {
                      setForm({ ...form, full_name: event.target.value });
                      setErrors((prev) => ({ ...prev, full_name: undefined }));
                    }}
                    placeholder="cth: Rizky Ramadhan"
                    className={fieldClass("full_name")}
                  />
                  <FieldError field="full_name" errors={errors} />
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
                    placeholder="nama@hostflow.id"
                    className={fieldClass("email")}
                  />
                  <FieldError field="email" errors={errors} />
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
                  <FieldError field="phone" errors={errors} />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-[#464555]">
                    Password
                  </label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) => {
                      setForm({ ...form, password: event.target.value });
                      setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    placeholder={
                      editingId
                        ? "Kosongkan jika tidak diubah"
                        : "Minimal 8 karakter"
                    }
                    className={fieldClass("password")}
                  />
                  <FieldError field="password" errors={errors} />
                </div>

                {!editingId && (
                  <div className="flex items-start gap-2 rounded-xl bg-gradient-to-r from-[#f0ecf9] to-[#e8e4fc] p-3 text-xs text-[#464555]">
                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#3525cd]" />
                    <p>
                      Simpan password ini dengan aman. Data admin akan disimpan
                      ke server.
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
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
                  className="rounded-xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                >
                  {editingId ? "Simpan Perubahan" : "Tambah Admin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#e0e3e5] bg-white shadow-2xl">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-[#dc2626] to-[#ef4444] px-6 py-5 text-white">
                <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
                <div className="absolute -bottom-3 right-10 h-12 w-12 rounded-full bg-white/10" />

                <div className="relative flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                    <Trash2 size={18} />
                  </div>
                  <h2 className="text-lg font-bold">Hapus Admin?</h2>
                </div>

                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-white/80 transition hover:bg-white/20 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 py-6">
                <div className="mb-5 flex items-center gap-3 rounded-xl bg-[#fef2f2] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fee2e2] text-[#dc2626]">
                    <AlertTriangle size={20} />
                  </div>
                  <p className="text-sm text-[#991b1b]">
                    Yakin ingin menghapus admin{" "}
                    <span className="font-bold">"{deleteTarget.full_name}"</span>
                    ? Tindakan ini tidak dapat dibatalkan.
                  </p>
                </div>
              </div>

              {/* Actions */}
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
                  onClick={confirmDelete}
                  className="rounded-xl bg-gradient-to-r from-[#dc2626] to-[#ef4444] px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:shadow-lg"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Detail Admin */}
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
                      <Users size={21} />
                    </div>
                    <div>
                      <p className="text-lg font-bold">{detailTarget.full_name}</p>
                      <p className="text-sm text-white/75">Detail Admin</p>
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
                      ROLE
                    </p>
                    <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                      <span className="text-xs font-semibold text-white">
                        {getRoleLabel(detailTarget.role)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-[11px] uppercase tracking-wider text-white/70">
                      BERGABUNG
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {toDate(detailTarget.created_at)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detail Content */}
              <div className="px-6 py-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-[#e7e5f4] bg-[#faf9ff] p-4">
                    <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#3525cd]/10 text-[#3525cd]">
                      <Users size={16} />
                    </div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a97a9]">
                      Nama Lengkap
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#191c1e]">
                      {detailTarget.full_name}
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
                      Tanggal Bergabung
                    </p>
                    <p className="mt-1 text-sm font-bold text-[#191c1e]">
                      {toDate(detailTarget.created_at)}
                    </p>
                  </div>
                </div>

                {/* Diperbarui */}
                <div className="mt-3 rounded-xl border border-[#e7e5f4] bg-[#faf9ff] p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3525cd]/10 text-[#3525cd]">
                      <Pencil size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-[#9a97a9]">
                        Terakhir Diperbarui
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-snug text-[#191c1e]">
                        {toDate(detailTarget.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ringkasan status */}
                <div className="mt-3 overflow-hidden rounded-xl border border-[#e0e3e5]">
                  <div className="flex items-center gap-3 bg-[#ecfdf5] px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#10b981]/15 text-[#10b981]">
                      <CheckCircle2 size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#065f46]">
                        Akun Aktif
                      </p>
                      <p className="text-[11px] text-[#059669]">
                        Akses penuh ke sistem Admin
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
