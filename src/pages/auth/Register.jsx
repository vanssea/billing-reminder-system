import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { plans } from "../../data/plans";

const formatIDR = (value) => "Rp" + value.toLocaleString("id-ID");

export default function Register() {
  const [params] = useSearchParams();
  const initialPlan = plans.find(
    (p) => p.name.toLowerCase() === (params.get("plan") || "").toLowerCase()
  );
  const [selectedPlan, setSelectedPlan] = useState(initialPlan || null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ name, email, password, confirmPassword, agreed, plan: selectedPlan?.name || null });
  };

  return (
    <div className="flex min-h-screen bg-[#fcf8ff]">
      {/* Panel Kiri - Branding */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-[#3525cd] p-12 lg:flex">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-white/10" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-lg font-bold text-[#3525cd]">
            HF
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">
              HostFlow
            </h1>

            <p className="text-sm font-medium text-[#c9c4ff]">
              Web Hosting Billing
            </p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Bergabung Bersama
            <br />
            HostFlow Sekarang.
          </h2>

          <p className="mt-6 max-w-md text-[#c9c4ff]">
            Buat akun untuk mulai mengelola tagihan hosting Anda
            dengan mudah dan efisien.
          </p>
        </div>

        {/* Poin Keunggulan */}
        <div className="relative space-y-4">
          {[
            { icon: "verified_user", label: "Keamanan akun terjamin" },
            { icon: "bolt", label: "Proses registrasi cepat" },
            { icon: "support_agent", label: "Dukungan pelanggan 24/7" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#c9c4ff]">
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
      <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#3525cd] text-lg font-bold text-white">
              HF
            </div>

            <div>
              <h1 className="text-xl font-bold text-[#3525cd]">
                HostFlow
              </h1>

              <p className="text-xs font-medium text-[#464555]">
                Web Hosting Billing
              </p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-[#1b1b24]">
            Buat Akun Baru
          </h2>

          <p className="mt-2 text-[#464555]">
            Daftar untuk mulai mengelola billing hosting Anda.
          </p>

          {selectedPlan && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#3525cd]/30 bg-[#eef0ff] p-4">
              <span className="material-symbols-outlined mt-0.5 text-[20px] text-[#3525cd]">
                verified
              </span>

              <div className="flex-1">
                <p className="text-sm font-bold text-[#1b1b24]">
                  Anda memilih paket {selectedPlan.name}
                </p>
                <p className="mt-0.5 text-xs text-[#464555]">
                  {selectedPlan.tagline} · {formatIDR(selectedPlan.monthly)}/bulan
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPlan(null)}
                className="text-xs font-semibold text-[#3525cd] transition hover:underline"
              >
                Hapus
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {/* Nama Lengkap */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1b1b24]">
                Nama Lengkap
              </label>

              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#777587]">
                  person
                </span>

                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama lengkap Anda"
                  className="w-full rounded-lg border border-[#c7c4d8] bg-white py-3 pl-11 pr-4 text-sm text-[#1b1b24] outline-none transition placeholder:text-[#a5a3b8] focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1b1b24]">
                Email
              </label>

              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#777587]">
                  mail
                </span>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="w-full rounded-lg border border-[#c7c4d8] bg-white py-3 pl-11 pr-4 text-sm text-[#1b1b24] outline-none transition placeholder:text-[#a5a3b8] focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1b1b24]">
                Password
              </label>

              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#777587]">
                  lock
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  className="w-full rounded-lg border border-[#c7c4d8] bg-white py-3 pl-11 pr-11 text-sm text-[#1b1b24] outline-none transition placeholder:text-[#a5a3b8] focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777587] transition hover:text-[#3525cd]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>

              {password.length > 0 && password.length < 8 && (
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-[#ba1a1a]">
                  <span className="material-symbols-outlined text-[16px]">
                    error
                  </span>

                  Password minimal 8 karakter.
                </p>
              )}
            </div>

            {/* Konfirmasi Password */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[#1b1b24]">
                Konfirmasi Password
              </label>

              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[20px] text-[#777587]">
                  lock_reset
                </span>

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi password"
                  className="w-full rounded-lg border border-[#c7c4d8] bg-white py-3 pl-11 pr-11 text-sm text-[#1b1b24] outline-none transition placeholder:text-[#a5a3b8] focus:border-[#3525cd] focus:ring-2 focus:ring-[#3525cd]/20"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777587] transition hover:text-[#3525cd]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showConfirmPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>

            {/* Syarat & Ketentuan */}
            <label className="flex cursor-pointer items-start gap-2 text-sm text-[#464555]">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#c7c4d8] accent-[#3525cd]"
              />

              <span>
                Saya menyetujui{" "}
                <button type="button" className="font-medium text-[#3525cd] hover:underline">
                  Syarat & Ketentuan
                </button>{" "}
                dan{" "}
                <button type="button" className="font-medium text-[#3525cd] hover:underline">
                  Kebijakan Privasi
                </button>
              </span>
            </label>

            {/* Submit */}
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#3525cd] py-3 text-sm font-bold text-white transition hover:bg-[#2a1aa8] focus:ring-2 focus:ring-[#3525cd]/30"
            >
              <span className="material-symbols-outlined text-[20px]">
                how_to_reg
              </span>

              Daftar
            </button>
          </form>

          {/* Login */}
          <p className="mt-6 text-center text-sm text-[#464555]">
            Sudah punya akun?{" "}
            <Link to="/login" className="font-medium text-[#3525cd] hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
