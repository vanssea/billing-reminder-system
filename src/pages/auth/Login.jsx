import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const roleMap = {
  SUPERADMIN: "/superadmin/dashboard",
  ADMIN: "/admin/dashboard",
  CLIENT: "/client/dashboard",
};

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      navigate(roleMap[user.role] || "/", { replace: true });
    }
  }, [loading, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Format email tidak valid.");
      return;
    }

    setSubmitting(true);
    try {
      const authUser = await signIn(email, password, remember);
      navigate(roleMap[authUser.role] || "/", { replace: true });
    } catch {
      setError("Email atau password salah. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const emailActive = emailFocused || email.length > 0;
  const passwordActive = passwordFocused || password.length > 0;

  return (
    <div className="flex min-h-screen bg-[#fcf8ff]">
      {/* Panel Kiri - Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-500 p-12 lg:flex">
        <div className="bg-dot-grid absolute inset-0 opacity-20" />
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />
        <div className="absolute left-1/3 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full bg-brand-400/30 blur-3xl" />

        {/* Logo */}
        <Link to="/" className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-400 shadow-lg shadow-brand-900/30">
            <Zap className="h-5 w-5 text-white" fill="currentColor" strokeWidth={0} />
          </span>

          <div>
            <h1 className="text-2xl font-bold text-white">
              HostFlow
            </h1>

            <p className="text-sm font-medium text-brand-100">
              Web Hosting Billing
            </p>
          </div>
        </Link>

        {/* Tagline */}
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Hosting Cepat,
            <br />
            Bisnis Tenang
          </h2>

          <p className="mt-6 max-w-md text-brand-100">
            Server NVMe &amp; LiteSpeed, uptime 99,9%, SSL gratis, dan
            dukungan 24/7.
          </p>
        </div>

        {/* Poin Keunggulan */}
        <div className="relative space-y-4">
          {[
            { icon: "verified_user", label: "SSL gratis & backup harian" },
            { icon: "notifications_active", label: "Pengingat pembayaran tepat waktu" },
            { icon: "payments", label: "Invoice & pembayaran terintegrasi" },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-xl bg-white/10 px-4 py-3 ring-1 ring-white/15"
            >
              <span className="material-symbols-outlined text-brand-100">
                {item.icon}
              </span>

              <span className="text-sm text-white">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Panel Kanan - Form */}
      <div className="flex w-full items-center justify-center bg-gradient-to-b from-white to-brand-50/40 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Logo (mobile) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Link to="/" className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-500 shadow-lg shadow-brand-600/30">
                <Zap className="h-5 w-5 text-white" fill="currentColor" strokeWidth={0} />
              </span>

              <div>
                <h1 className="text-xl font-bold text-brand-600">
                  HostFlow
                </h1>

                <p className="text-xs font-medium text-[#464555]">
                  Web Hosting Billing
                </p>
              </div>
            </Link>
          </div>

          <div className="flex flex-col items-start gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700 hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Kembali ke beranda
            </Link>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              Akses Billing
            </span>
          </div>

          <h2 className="mt-2 text-3xl font-bold text-[#1b1b24]">
            Selamat Datang{" "}
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              Kembali
            </span>
          </h2>

          <p className="mt-2 text-[#464555]">
            Masuk untuk mengakses dashboard billing Anda.
          </p>

          <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-100 shadow-xl shadow-brand-900/5 sm:p-8">
            {error && (
              <p
                role="alert"
                className="mb-5 flex animate-shake items-center gap-1.5 rounded-lg border border-[#ba1a1a]/30 bg-[#fff0f0] px-4 py-3 text-sm font-medium text-[#ba1a1a]"
              >
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </p>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <div className="relative">
                  <span
                    className={`pointer-events-none absolute left-3.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition ${emailActive ? "bg-brand-600 text-white" : "bg-white text-brand-600 ring-1 ring-slate-100"}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">mail</span>
                  </span>

                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                    placeholder=" "
                    className="w-full rounded-xl bg-[#f6f5fb] px-4 pb-2.5 pt-6 pl-14 text-sm text-[#1b1b24] outline-none transition placeholder:text-transparent focus:bg-white focus:ring-2 focus:ring-brand-600/25"
                  />

                  <label
                    htmlFor="email"
                    className={`pointer-events-none absolute transition-all duration-200 ${emailActive ? "left-14 top-2 translate-y-0 text-[11px] font-semibold text-brand-600" : "left-14 top-1/2 -translate-y-1/2 text-sm text-slate-500"}`}
                  >
                    Email
                  </label>
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="relative">
                  <span
                    className={`pointer-events-none absolute left-3.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition ${passwordActive ? "bg-brand-600 text-white" : "bg-white text-brand-600 ring-1 ring-slate-100"}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </span>

                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                    placeholder=" "
                    className="w-full rounded-xl bg-[#f6f5fb] px-4 pb-2.5 pt-6 pl-14 pr-12 text-sm text-[#1b1b24] outline-none transition placeholder:text-transparent focus:bg-white focus:ring-2 focus:ring-brand-600/25"
                  />

                  <label
                    htmlFor="password"
                    className={`pointer-events-none absolute transition-all duration-200 ${passwordActive ? "left-14 top-2 translate-y-0 text-[11px] font-semibold text-brand-600" : "left-14 top-1/2 -translate-y-1/2 text-sm text-slate-500"}`}
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777587] transition hover:text-brand-600"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Remember & Lupa Password */}
              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-[#464555]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="h-4 w-4 rounded border-[#c7c4d8] accent-brand-600"
                  />

                  Ingat saya
                </label>

                <Link
                  to="/lupa-password"
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  Lupa password?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110 hover:shadow-xl hover:shadow-brand-600/40 focus:ring-2 focus:ring-brand-600/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <span
                  className={`material-symbols-outlined text-[20px] ${submitting ? "animate-spin" : ""}`}
                >
                  {submitting ? "progress_activity" : "login"}
                </span>

                {submitting ? "Memproses..." : "Masuk"}
              </button>
            </form>
          </div>

          {/* Daftar */}
          <p className="mt-6 text-center text-sm text-[#464555]">
            Belum punya akun?{" "}
            <Link to="/register" className="font-medium text-brand-600 hover:underline">
              Daftar sekarang
            </Link>
          </p>

          {/* Trust line */}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Data login Anda diamankan SSL · © 2026 HostFlow
          </p>
        </div>
      </div>
    </div>
  );
}
