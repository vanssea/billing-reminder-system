import { useEffect, useMemo, useState } from "react";
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
  role: "ADMIN",
};

const toDate = (value) =>
  value ? new Date(value).toLocaleDateString("id-ID") : "-";

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
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");

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

      const data = await getAdmins();
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
      return matchSearch;
    });
  }, [admins, search]);

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
      role: admin.role || "ADMIN",
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
          role: form.role,
          phone: form.phone || null,
        });
        setSuccess("Data admin berhasil diperbarui.");
      } else {
        await createAdmin({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          phone: form.phone || null,
        });
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

      await deleteAdmin(deleteTarget.id);

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
    <div className="min-h-screen bg-[#fcf8ff] pt-16 md:pl-[280px]">
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#191c1e]">Admin Management</h1>
            <p className="mt-1 text-sm text-[#777587]">
              Kelola akun admin pada sistem HostFlow.
            </p>
          </div>

          <button
            type="button"
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-[#3525cd] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#2a1db0]"
          >
            <Plus className="h-4 w-4" />
            Tambah Admin
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
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, email, atau telepon admin..."
                className="w-full rounded-lg border border-[#c7c4d8] bg-white py-2 pl-9 pr-3 text-sm text-[#191c1e] outline-none transition focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-[#e0e3e5] bg-[#faf9fc] text-xs uppercase tracking-wide text-[#9a97a9]">
                  <th className="px-4 py-3 font-semibold">Admin</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">No. Telepon</th>
                  <th className="px-4 py-3 font-semibold">Bergabung</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading && admins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-[#9a97a9]">
                      Memuat data admin...
                    </td>
                  </tr>
                ) : filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-[#9a97a9]">
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-xl border border-[#e0e3e5] bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-[#e0e3e5] px-5 py-4">
                <div>
                  <h2 className="text-lg font-bold text-[#191c1e]">
                    {editingId ? "Edit Admin" : "Tambah Admin"}
                  </h2>
                  <p className="text-xs text-[#777587]">
                    {editingId
                      ? "Perbarui data admin di bawah ini."
                      : "Isi data admin baru untuk ditambahkan."}
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

              <div className="space-y-4 px-5 py-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#464555]">
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
                    placeholder="nama@hostflow.id"
                    className={fieldClass("email")}
                  />
                  <FieldError field="email" errors={errors} />
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
                  <FieldError field="phone" errors={errors} />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#464555]">
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
                  <div className="flex items-start gap-2 rounded-lg bg-[#f0ecf9] p-3 text-xs text-[#464555]">
                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#3525cd]" />
                    <p>
                      Simpan password ini dengan aman. Data admin akan disimpan
                      ke server.
                    </p>
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
                  {editingId ? "Simpan Perubahan" : "Tambah Admin"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Konfirmasi Hapus */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl border border-[#e0e3e5] bg-white p-5 shadow-xl">
              <div className="flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffdad6] text-[#ba1a1a]">
                  <AlertTriangle className="h-7 w-7" />
                </div>

                <h2 className="text-lg font-bold text-[#191c1e]">Hapus Admin?</h2>

                <p className="mt-2 text-sm text-[#777587]">
                  Yakin ingin menghapus admin{" "}
                  <span className="font-semibold text-[#191c1e]">
                    "{deleteTarget.full_name}"
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </p>

                <div className="mt-6 flex w-full gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(null)}
                    className="flex-1 rounded-lg border border-[#c7c4d8] px-4 py-2.5 text-sm font-semibold text-[#464555] transition hover:bg-[#eceef0]"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="flex-1 rounded-lg bg-[#ba1a1a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#9c1616]"
                  >
                    Hapus
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
                  <h2 className="text-lg font-bold text-[#191c1e]">Detail Admin</h2>
                  <p className="text-xs text-[#777587]">
                    Informasi lengkap admin pada sistem HostFlow.
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
                    {initials(detailTarget.full_name)}
                  </div>
                  <div>
                    <p className="font-semibold text-[#191c1e]">
                      {detailTarget.full_name}
                    </p>
                  </div>
                </div>

                <dl className="space-y-3">
                  {[
                    ["Email", detailTarget.email],
                    ["No. Telepon", detailTarget.phone || "-"],
                    ["Bergabung", toDate(detailTarget.created_at)],
                    ["Diperbarui", toDate(detailTarget.updated_at)],
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
  );
}
