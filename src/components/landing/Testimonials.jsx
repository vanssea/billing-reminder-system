import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Raka Pratama",
    role: "Founder, NusantaraWeb",
    initials: "RP",
    tone: "bg-brand-100 text-brand-700",
    quote:
      "Setelah pindah ke HostFlow, load time website kami turun dari 4 detik jadi 0,8 detik. Penjualan online pun naik signifikan.",
  },
  {
    name: "Dinda Ayu",
    role: "CEO, KopiKita Studio",
    initials: "DA",
    tone: "bg-sky-100 text-sky-700",
    quote:
      "Tim support-nya luar biasa. Website client sempat down jam 2 pagi dan langsung ditangani tanpa kami minta. Beneran 24/7.",
  },
  {
    name: "Bagus Firmansyah",
    role: "IT Manager, MedikaRaya",
    initials: "BF",
    tone: "bg-emerald-100 text-emerald-700",
    quote:
      "Migrasi dari penyedia lama ternyata gratis dan tanpa downtime sama sekali. Semua 12 website kami pindah dalam sehari.",
  },
  {
    name: "Salsabila Zahra",
    role: "Owner, Sekolahku",
    initials: "SZ",
    tone: "bg-amber-100 text-amber-700",
    quote:
      "Panel kontrolnya sangat mudah dipahami bahkan untuk tim non-teknis. Instalasi WordPress cuma butuh satu klik.",
  },
  {
    name: "Andre Wijaya",
    role: "Freelancer Web Developer",
    initials: "AW",
    tone: "bg-blue-100 text-blue-700",
    quote:
      "Uptime-nya stabil, SSL gratis otomatis terpasang, dan backup harian bikin tenang. Harga segini, kualitas sebagus ini.",
  },
  {
    name: "Maya Lestari",
    role: "COO, Aruna Digital",
    initials: "ML",
    tone: "bg-fuchsia-100 text-fuchsia-700",
    quote:
      "Kami mengelola puluhan website client dan HostFlow tidak pernah mengecewakan. Performa server konsisten sejak hari pertama.",
  },
];

export default function Testimonials() {
  return (
    <section id="testimoni" className="scroll-mt-24 bg-gradient-to-b from-brand-50/60 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-widest text-brand-600">
            Testimoni
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Dipercaya Ribuan Website di Indonesia
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Ribuan bisnis sudah merasakan website yang cepat, aman, dan selalu online bersama
            HostFlow.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.name}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
            >
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                ))}
              </div>

              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                “{t.quote}”
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold ${t.tone}`}
                >
                  {t.initials}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs font-medium text-slate-500">{t.role}</p>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
