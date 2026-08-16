import {
  CheckCircle2,
  CreditCard,
  Gauge,
  Globe,
  MousePointerClick,
  Rocket,
  ShieldCheck,
} from "lucide-react";

const steps = [
  {
    icon: MousePointerClick,
    number: "01",
    title: "Pilih Paket Hosting",
    description:
      "Pilih paket yang sesuai kebutuhan — dari shared hosting untuk pemula hingga cloud hosting untuk skala besar.",
  },
  {
    icon: Globe,
    number: "02",
    title: "Daftarkan Domain",
    description:
      "Gunakan domain baru secara gratis, atau transfer domain yang sudah Anda miliki tanpa downtime.",
  },
  {
    icon: Rocket,
    number: "03",
    title: "Deploy & Kelola Website",
    description:
      "Pasang website dengan instalasi 1-klik WordPress, lalu kelola semuanya dari panel kontrol yang mudah.",
  },
];

const perks = [
  {
    icon: Gauge,
    label: "Instalasi 1-klik",
    description: "WordPress, Laravel, dan aplikasi populer lainnya",
    tone: "bg-brand-50 text-brand-600 ring-brand-100",
  },
  {
    icon: RefreshCw,
    label: "Migrasi gratis",
    description: "Kami pindahkan website Anda tanpa downtime",
    tone: "bg-sky-50 text-sky-600 ring-sky-100",
  },
  {
    icon: ShieldCheck,
    label: "SSL otomatis",
    description: "Terpasang otomatis untuk semua website",
    tone: "bg-emerald-50 text-emerald-600 ring-emerald-100",
  },
  {
    icon: CreditCard,
    label: "Garansi 30 hari",
    description: "Uang kembali jika tidak puas",
    tone: "bg-amber-50 text-amber-600 ring-amber-100",
  },
  {
    icon: CheckCircle2,
    label: "Siap pakai",
    description: "Aktif dalam hitungan menit setelah pembayaran",
    tone: "bg-blue-50 text-blue-600 ring-blue-100",
  },
];

function RefreshCw(props) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="scroll-mt-24 bg-gradient-to-b from-white to-brand-50/60 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-widest text-brand-600">
            Cara Mulai
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Website Online dalam Hitungan Menit
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Tiga langkah sederhana — tanpa keahlian teknis, tanpa ribet.
          </p>
        </div>

        {/* Steps */}
        <div className="relative mt-14 grid gap-6 lg:grid-cols-3">
          <div className="absolute left-0 right-0 top-10 hidden border-t-2 border-dashed border-brand-200 lg:block" />
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:shadow-lg hover:shadow-brand-900/10"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand-600 to-brand-400 text-white shadow-lg shadow-brand-600/30">
                  <step.icon className="h-6 w-6" />
                </span>
                <span className="text-4xl font-extrabold text-slate-100">{step.number}</span>
              </div>
              <h3 className="mt-5 text-lg font-extrabold text-slate-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.description}</p>
            </div>
          ))}
        </div>

        {/* Perks panel */}
        <div className="mt-16 overflow-hidden rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-brand-900/5 sm:p-10">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Semua sudah termasuk
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Tidak perlu mengurus teknis — semua sudah kami sediakan.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 ring-1 ring-emerald-200">
              Gratis migrasi
            </span>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {perks.map((perk, i) => (
              <div key={perk.label} className="relative">
                <div className="flex h-full flex-col rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center transition hover:border-brand-200 hover:bg-white hover:shadow-md">
                  <span
                    className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ring-8 ring-white ${perk.tone}`}
                  >
                    <perk.icon className="h-5 w-5" />
                  </span>
                  <p className="mt-3 text-sm font-bold text-slate-900">{perk.label}</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-400">{perk.description}</p>
                </div>
                {i < perks.length - 1 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 text-lg font-extrabold text-brand-300 lg:block">
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
