import {
  ArrowRight,
  Gauge,
  HardDrive,
  Play,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";

const stats = [
  { value: "99,9%", label: "Uptime guarantee" },
  { value: "0,05s", label: "Kecepatan load" },
  { value: "2.500+", label: "Website aktif" },
  { value: "24/7", label: "Dukungan teknis" },
];

const websites = [
  { name: "nusantaraweb.id", plan: "Paket Bisnis", status: "Online", tone: "success" },
  { name: "kopikita.com", plan: "Paket Pro", status: "Online", tone: "success" },
  { name: "medikaraya.id", plan: "Paket Bisnis", status: "SSL Aktif", tone: "neutral" },
];

const toneStyles = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-amber-200",
  neutral: "bg-slate-100 text-slate-600 ring-slate-200",
};

function ControlPanelMockup() {
  return (
    <div className="relative">
      {/* Glow behind mockup */}
      <div className="absolute -inset-8 rounded-[2.5rem] bg-gradient-to-tr from-brand-600/30 via-brand-400/20 to-sky-400/30 blur-2xl" />

      {/* Floating card: SSL */}
      <div className="absolute -right-3 -top-6 z-20 hidden animate-float items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 sm:flex lg:-right-10">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <ShieldCheck className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-xs font-bold text-slate-900">SSL terpasang</p>
          <p className="text-[11px] text-slate-500">Proteksi penuh · 1 menit lalu</p>
        </div>
      </div>

      {/* Floating card: backup */}
      <div className="absolute -bottom-6 -left-3 z-20 hidden animate-float-delayed items-center gap-2.5 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-xl shadow-slate-900/10 sm:flex lg:-left-10">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-600">
          <HardDrive className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-xs font-bold text-slate-900">Backup harian selesai</p>
          <p className="text-[11px] text-slate-500">Otomatis setiap pukul 02.00 WIB</p>
        </div>
      </div>

      {/* Main mockup */}
      <div className="relative z-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-brand-900/20 lg:rounded-3xl">
        {/* Window bar */}
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-400" />
            <span className="h-3 w-3 rounded-full bg-amber-400" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <div className="mx-auto flex items-center gap-2 rounded-full bg-white px-4 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            panel.hostflow.id
          </div>
          <div className="w-14" />
        </div>

        <div className="flex">
          {/* Mini sidebar */}
          <div className="hidden w-44 shrink-0 flex-col gap-1 border-r border-slate-100 p-3 md:flex">
            {["Beranda", "File Manager", "Database", "Email", "Domain", "SSL", "Backup"].map(
              (item, i) => (
                <div
                  key={item}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold ${
                    i === 0 ? "bg-brand-600 text-white" : "text-slate-500"
                  }`}
                >
                  {item}
                </div>
              )
            )}
            <div className="mt-auto rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 p-3 text-white">
              <p className="text-[11px] font-bold">Server Sehat</p>
              <p className="text-[10px] opacity-80">Semua layanan beroperasi normal</p>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-extrabold text-slate-900">Panel Kontrol</p>
                <p className="text-[11px] text-slate-400">Selamat datang, Admin 👋</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                HF
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { label: "Disk Usage", value: "38%", delta: "120 GB NVMe" },
                { label: "Website", value: "12", delta: "Aktif" },
                { label: "Uptime", value: "99,9%", delta: "30 hari" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <p className="text-[10px] font-semibold text-slate-400">{s.label}</p>
                  <p className="mt-0.5 text-sm font-extrabold text-slate-900">{s.value}</p>
                  <p className="mt-1 flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    {s.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Website table */}
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
                <p className="text-xs font-bold text-slate-900">Website Anda</p>
                <p className="text-[10px] font-semibold text-brand-600">Kelola semua</p>
              </div>
              {websites.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center justify-between gap-2 border-b border-slate-50 px-3 py-2.5 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-800">{row.name}</p>
                    <p className="text-[10px] text-slate-400">{row.plan}</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <p className="hidden text-xs font-bold text-slate-800 sm:block">
                      <Gauge className="mr-1 inline h-3.5 w-3.5 text-brand-500" />
                      Normal
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${toneStyles[row.tone]}`}
                    >
                      {row.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section id="beranda" className="relative overflow-hidden">
      {/* Background decor */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/80 via-white to-white" />
        <div className="absolute left-1/2 top-[-10rem] h-[30rem] w-[50rem] -translate-x-1/2 rounded-full bg-brand-300/30 blur-3xl" />
        <div className="absolute right-[-8rem] top-40 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute left-[-6rem] top-72 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="bg-dot-grid absolute inset-0" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <a
            href="#fitur"
            className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white/80 px-4 py-1.5 text-xs font-bold text-brand-700 shadow-sm backdrop-blur transition hover:border-brand-300"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Penyedia web hosting terpercaya di Indonesia
            <span className="text-brand-400">→</span>
          </a>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Web Hosting{" "}
            <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-sky-500 bg-clip-text text-transparent">
              Cepat, Aman &amp; Handal
            </span>{" "}
            untuk Bisnis Anda
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
            Hosting dengan server NVMe dan LiteSpeed, uptime 99,9%, SSL gratis, backup harian, dan
            dukungan teknis 24/7 — agar website Anda selalu cepat dan selalu online.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-7 py-3.5 text-base font-bold text-white shadow-xl shadow-brand-600/30 transition hover:shadow-2xl hover:shadow-brand-600/40 hover:brightness-110 sm:w-auto"
            >
              Mulai Hosting Sekarang
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
            </Link>
            <a
              href="#harga"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-7 py-3.5 text-base font-bold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 sm:w-auto"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600">
                <Play className="h-3 w-3 text-white" fill="currentColor" strokeWidth={0} />
              </span>
              Lihat Paket
            </a>
          </div>

          <p className="mt-5 text-sm font-medium text-slate-500">
            Mulai dari Rp25.000/bulan · Domain gratis · Migrasi gratis dari penyedia lain
          </p>
        </div>

        {/* Mockup */}
        <div className="relative mx-auto mt-16 max-w-5xl sm:mt-20">
          <ControlPanelMockup />
        </div>

        {/* Stats */}
        <div className="mx-auto mt-16 grid max-w-4xl grid-cols-2 gap-6 sm:mt-20 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
