import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { createOrUpdateClientProfile } from "../../services/clientApi";
import { supabase } from "../../lib/supabaseClient";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20";

const labelClass = "mb-1.5 block text-xs font-bold text-slate-600";

export default function ClientProfile() {
  const { user, client } = useAuth();

  const [profile, setProfile] = useState({
    company_name: "",
    pic_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [profileLoading, setProfileLoading] = useState(true);

  const [passwords, setPasswords] = useState({
    current: "",
    next: "",
    confirm: "",
  });

  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [toast, setToast] = useState("");
  const [saving, setSaving] = useState(false);

  const initials =
    user?.full_name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "C";

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const location = useLocation();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (client) {
        setProfile({
          company_name: client.company_name || "",
          pic_name: client.pic_name || user?.full_name || "",
          email: client.email || user?.email || "",
          phone: client.phone || "",
          address: client.address || "",
        });
      }
      setProfileLoading(false);

      if (location.state?.purchaseSuccess) {
        showToast("Permintaan pembelian berhasil dikirim! Admin akan memproses dan menghubungi Anda.");
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [client, user, location]);

  const handleProfileSubmit = async (event) => {
    event.preventDefault();

    if (!profile.company_name.trim() || !profile.pic_name.trim()) {
      setProfileError("Nama perusahaan dan PIC wajib diisi.");
      return;
    }

    if (!profile.email.includes("@")) {
      setProfileError("Format email tidak valid.");
      return;
    }

    if (!profile.phone.trim()) {
      setProfileError("Nomor telepon wajib diisi.");
      return;
    }

    if (!profile.address.trim()) {
      setProfileError("Alamat wajib diisi.");
      return;
    }

    setSaving(true);
    setProfileError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setProfileError("Sesi tidak valid. Silakan login ulang.");
        return;
      }

      const payload = {
        company_name: profile.company_name,
        pic_name: profile.pic_name,
        email: profile.email,
        phone: profile.phone || null,
        address: profile.address || null,
        status: "ACTIVE",
      };

      await createOrUpdateClientProfile(payload, session.access_token);
      showToast("Profil berhasil diperbarui.");
    } catch (err) {
      setProfileError("Gagal memperbarui profil: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();

    if (!passwords.current || !passwords.next || !passwords.confirm) {
      setPasswordError("Semua kolom password wajib diisi.");
      return;
    }

    if (passwords.next.length < 8) {
      setPasswordError("Password baru minimal 8 karakter.");
      return;
    }

    if (passwords.next !== passwords.confirm) {
      setPasswordError("Konfirmasi password tidak cocok.");
      return;
    }

    setPasswordError("");
    setSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPasswordError("Sesi tidak valid. Silakan login ulang.");
        return;
      }

      const { error } = await supabase.auth.updateUser(
        { password: passwords.next },
        { revokeOtherSessions: true }
      );

      if (error) {
        throw error;
      }

      setPasswords({ current: "", next: "", confirm: "" });
      showToast("Password berhasil diperbarui. Anda akan keluar dari sesi lain.");
    } catch (err) {
      setPasswordError("Gagal mengubah password: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (profileLoading) {
    return (
      <div>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <p className="py-20 text-center text-sm font-medium text-slate-500">Memuat profil...</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Profil</h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola informasi perusahaan dan keamanan akun Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col items-center text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-600 to-brand-400 text-2xl font-bold text-white shadow-lg shadow-brand-600/30">
                  {initials}
                </div>

                <h2 className="mt-4 text-lg font-bold text-slate-900">
                  {user?.full_name || "Client"}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">{user?.email}</p>

                <span className="mt-3 inline-flex rounded-md bg-brand-600/10 px-2.5 py-1 text-xs font-bold text-brand-700">
                  Client
                </span>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Info Akun
                </h3>

                <div className="mt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">PIC</p>

                    <p className="text-sm font-semibold text-slate-900">
                      {client?.pic_name || user?.full_name || "-"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Perusahaan</p>

                    <p className="text-sm font-semibold text-slate-900">
                      {client?.company_name || "-"}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">Status Akun</p>

                    <span className="flex items-center gap-1.5 text-sm font-semibold text-green-600">
                      <span className="h-2 w-2 rounded-full bg-green-500" />
                      Aktif
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <form
              onSubmit={handleProfileSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="inline-flex rounded-xl bg-brand-600/10 p-2.5 text-brand-600">
                  <Building2 size={20} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">
                    Info Perusahaan & Kontak
                  </h2>

                  <p className="text-xs text-slate-500">
                    Data yang digunakan pada invoice dan tagihan Anda
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="companyName" className={labelClass}>
                    Nama Perusahaan <span className="text-rose-500">*</span>
                  </label>

                  <input
                    id="companyName"
                    type="text"
                    value={profile.company_name}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        company_name: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="picName" className={labelClass}>
                    PIC / Nama Kontak <span className="text-rose-500">*</span>
                  </label>

                  <input
                    id="picName"
                    type="text"
                    value={profile.pic_name}
                    onChange={(event) =>
                      setProfile((prev) => ({
                        ...prev,
                        pic_name: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="email" className={labelClass}>
                    Email <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <Mail
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(event) =>
                        setProfile((prev) => ({
                          ...prev,
                          email: event.target.value,
                        }))
                      }
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className={labelClass}>
                    No. Telepon <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <Phone
                      size={16}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />

                    <input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(event) =>
                        setProfile((prev) => ({
                          ...prev,
                          phone: event.target.value,
                        }))
                      }
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClass}>
                    Alamat <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <MapPin
                      size={16}
                      className="pointer-events-none absolute left-3 top-3 text-slate-400"
                    />

                    <textarea
                      id="address"
                      rows={3}
                      value={profile.address}
                      onChange={(event) =>
                        setProfile((prev) => ({
                          ...prev,
                          address: event.target.value,
                        }))
                      }
                      className={`${inputClass} resize-none pl-9`}
                    />
                  </div>
                </div>
              </div>

              {profileError && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                  {profileError}
                </p>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={saving || profileLoading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Simpan Perubahan
                    </>
                  )}
                </button>
              </div>
            </form>

            <form
              onSubmit={handlePasswordSubmit}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="inline-flex rounded-xl bg-brand-600/10 p-2.5 text-brand-600">
                  <Lock size={20} />
                </div>

                <div>
                  <h2 className="text-sm font-semibold text-slate-900">Keamanan</h2>

                  <p className="text-xs text-slate-500">
                    Ubah password akun Anda secara berkala
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="currentPassword" className={labelClass}>
                    Password Lama
                  </label>

                  <input
                    id="currentPassword"
                    type="password"
                    value={passwords.current}
                    onChange={(event) =>
                      setPasswords((prev) => ({
                        ...prev,
                        current: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className={labelClass}>
                    Password Baru
                  </label>

                  <input
                    id="newPassword"
                    type="password"
                    value={passwords.next}
                    onChange={(event) =>
                      setPasswords((prev) => ({
                        ...prev,
                        next: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className={labelClass}>
                    Konfirmasi Password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    value={passwords.confirm}
                    onChange={(event) =>
                      setPasswords((prev) => ({
                        ...prev,
                        confirm: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
                <KeyRound size={14} />
                Minimal 8 karakter, kombinasi huruf dan angka.
              </p>

              {passwordError && (
                <p className="mt-4 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                  {passwordError}
                </p>
              )}

              <div className="mt-5 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Mengubah...
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={16} />
                      Ubah Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-green-200 bg-white px-5 py-3.5 shadow-xl shadow-slate-900/10">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 size={18} />
          </span>

          <p className="text-sm font-semibold text-slate-900">{toast}</p>
        </div>
      )}
    </div>
  );
}