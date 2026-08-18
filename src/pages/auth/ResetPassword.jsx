import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap } from "lucide-react";
import { supabase } from "../../lib/supabaseClient";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setHasSession(Boolean(data.session));
        setChecking(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasSession(Boolean(session));
        setChecking(false);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const passwordActive = passwordFocused || password.length > 0;
  const confirmActive = confirmFocused || confirmPassword.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        setError("Gagal mengubah password. Silakan coba lagi.");
        return;
      }

      await supabase.auth.signOut();
      setDone(true);
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  const renderBody = () => {
    if (checking) {
      return (
        <div className="mt-8 rounded-3xl bg-white p-8 text-center ring-1 ring-slate-100 shadow-xl shadow-brand-900/5">
          <span className="material-symbols-outlined animate-spin text-[32px] text-brand-600">
            progress_activity
          </span>
          <p className="mt-4 text-sm text-[#464555]">Memverifikasi tautan...</p>
        </div>
      );
    }

    if (done) {
      return (
        <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-100 shadow-xl shadow-brand-900/5 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <span className="material-symbols-outlined text-[28px]">check_circle</span>
            </span>

            <h3 className="mt-4 text-lg font-bold text-[#1b1b24]">
              Password Berhasil Diubah
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-[#464555]">
              Password Anda telah diperbarui. Silakan masuk kembali dengan
              password yang baru.
            </p>

            <Link
              to="/login"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110 hover:shadow-xl hover:shadow-brand-600/40"
            >
              <span className="material-symbols-outlined text-[20px]">login</span>
              Masuk Sekarang
            </Link>
          </div>
        </div>
      );
    }

    if (!hasSession) {
      return (
        <div className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-100 shadow-xl shadow-brand-900/5 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#fff4e5] text-[#b45309]">
              <span className="material-symbols-outlined text-[28px]">link_off</span>
            </span>

            <h3 className="mt-4 text-lg font-bold text-[#1b1b24]">
              Tautan Tidak Valid
            </h3>

            <p className="mt-2 text-sm leading-relaxed text-[#464555]">
              Tautan reset password tidak valid atau telah kedaluwarsa.
              Mohon minta tautan baru untuk melanjutkan.
            </p>

            <Link
              to="/lupa-password"
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110 hover:shadow-xl hover:shadow-brand-600/40"
            >
              <span className="material-symbols-outlined text-[20px]">lock_reset</span>
              Minta Tautan Baru
            </Link>
          </div>
        </div>
      );
    }

    return (
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
          {/* Password Baru */}
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
                autoComplete="new-password"
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
                Password Baru
              </label>

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777587] transition hover:text-brand-600"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>

            {password.length > 0 && password.length < 8 && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#ba1a1a]">
                <span className="material-symbols-outlined text-[16px]">error</span>
                Password minimal 8 karakter.
              </p>
            )}
          </div>

          {/* Konfirmasi Password */}
          <div>
            <div className="relative">
              <span
                className={`pointer-events-none absolute left-3.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg transition ${confirmActive ? "bg-brand-600 text-white" : "bg-white text-brand-600 ring-1 ring-slate-100"}`}
              >
                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
              </span>

              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                placeholder=" "
                className="w-full rounded-xl bg-[#f6f5fb] px-4 pb-2.5 pt-6 pl-14 pr-12 text-sm text-[#1b1b24] outline-none transition placeholder:text-transparent focus:bg-white focus:ring-2 focus:ring-brand-600/25"
              />

              <label
                htmlFor="confirm-password"
                className={`pointer-events-none absolute transition-all duration-200 ${confirmActive ? "left-14 top-2 translate-y-0 text-[11px] font-semibold text-brand-600" : "left-14 top-1/2 -translate-y-1/2 text-sm text-slate-500"}`}
              >
                Konfirmasi Password
              </label>

              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "Sembunyikan password" : "Tampilkan password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777587] transition hover:text-brand-600"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showConfirmPassword ? "visibility_off" : "visibility"}
                </span>
              </button>
            </div>
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
              {submitting ? "progress_activity" : "save"}
            </span>

            {submitting ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </div>
    );
  };

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
            Web Hosting Cepat,
            <br />
            Aman &amp; Handal
          </h2>

          <p className="mt-6 max-w-md text-brand-100">
            Server NVMe &amp; LiteSpeed, uptime 99,9%, SSL gratis, backup
            harian, dan dukungan 24/7 — kelola tagihan Anda dalam satu
            dashboard.
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
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 transition hover:text-brand-700 hover:underline"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Kembali ke Login
            </Link>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 ring-1 ring-brand-100">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              Pemulihan Akun
            </span>
          </div>

          <h2 className="mt-2 text-3xl font-bold text-[#1b1b24]">
            Buat{" "}
            <span className="bg-gradient-to-r from-brand-600 to-brand-500 bg-clip-text text-transparent">
              Password Baru
            </span>
          </h2>

          <p className="mt-2 text-[#464555]">
            Tentukan password baru untuk akun Anda.
          </p>

          {renderBody()}

          {/* Trust line */}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <span className="material-symbols-outlined text-[14px]">lock</span>
            Data Anda diamankan SSL · © 2026 HostFlow
          </p>
        </div>
      </div>
    </div>
  );
}