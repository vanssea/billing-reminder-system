import {
  Gauge,
  Globe,
  HardDrive,
  Headset,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Gauge,
    title: "Server NVMe & LiteSpeed",
    description:
      "Teknologi NVMe SSD dan LiteSpeed membuat website Anda hingga 5x lebih cepat dari hosting biasa.",
  },
  {
    icon: ShieldCheck,
    title: "SSL & Keamanan",
    description:
      "SSL gratis untuk semua website, proteksi DDoS, dan firewall terkelola agar data pelanggan Anda aman.",
    highlight: true,
  },
  {
    icon: RefreshCw,
    title: "Backup Harian",
    description:
      "Backup otomatis setiap hari dengan fitur restore sekali klik kapan pun Anda membutuhkannya.",
  },
  {
    icon: Globe,
    title: "Domain Gratis",
    description:
      "Nama domain gratis selama satu tahun untuk setiap pembelian paket tahunan.",
  },
  {
    icon: HardDrive,
    title: "Resource Mumpuni",
    description:
      "Alokasi bandwidth dan storage besar sehingga website tetap cepat meskipun trafik meningkat.",
  },
  {
    icon: Headset,
    title: "Dukungan 24/7",
    description:
      "Tim teknisi ahli siap membantu via live chat dan tiket kapan saja, siang maupun malam.",
  },
];

export default function Features() {
  return (
    <section id="fitur" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-widest text-brand-600">
            Fitur Unggulan
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Semua yang Anda Butuhkan untuk Website Cepat &amp; Aman
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            HostFlow menangani infrastruktur server, keamanan, dan backup — Anda cukup fokus
            mengembangkan bisnis.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative overflow-hidden rounded-2xl border p-7 transition-all duration-300 ${
                feature.highlight
                  ? "border-brand-200 bg-gradient-to-br from-brand-600 to-brand-500 text-white shadow-xl shadow-brand-600/25"
                  : "border-slate-200 bg-white hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                  feature.highlight
                    ? "bg-white/15 text-white"
                    : "bg-brand-50 text-brand-600 transition group-hover:scale-110"
                }`}
              >
                <feature.icon className="h-6 w-6" />
              </div>
              <h3
                className={`mt-5 text-lg font-extrabold ${
                  feature.highlight ? "text-white" : "text-slate-900"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`mt-2 text-sm leading-relaxed ${
                  feature.highlight ? "text-white/85" : "text-slate-600"
                }`}
              >
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
