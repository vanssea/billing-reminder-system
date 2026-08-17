import { Clock, Mail, MapPin, Phone } from "lucide-react";
import StaticLayout from "./StaticLayout";

const contacts = [
  {
    icon: Mail,
    label: "Email",
    value: "halo@hostflow.id",
    href: "mailto:halo@hostflow.id",
  },
  {
    icon: Phone,
    label: "Telepon / WhatsApp",
    value: "+62 812 3456 7890",
    href: "tel:+6281234567890",
  },
  {
    icon: MapPin,
    label: "Alamat",
    value: "Jl. Teknologi No. 123, Jakarta Selatan, DKI Jakarta",
  },
  {
    icon: Clock,
    label: "Jam Operasional",
    value: "24/7 — layanan dukungan selalu siap",
  },
];

export default function Kontak() {
  return (
    <StaticLayout
      title="Hubungi Kami"
      subtitle="Tim kami siap membantu Anda — dukungan teknis, pertanyaan penjualan, atau kebutuhan lainnya."
    >
      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
        {contacts.map((c) => (
          <div
            key={c.label}
            className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <c.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-sm font-extrabold uppercase tracking-wider text-slate-400">
              {c.label}
            </h3>
            {c.href ? (
              <a
                href={c.href}
                className="mt-1 block text-lg font-bold text-slate-900 transition hover:text-brand-600"
              >
                {c.value}
              </a>
            ) : (
              <p className="mt-1 text-lg font-bold text-slate-900">{c.value}</p>
            )}
          </div>
        ))}
      </div>
    </StaticLayout>
  );
}
