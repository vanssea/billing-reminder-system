import { Blocks, Cloud, Code2, Database, Shield, Workflow } from "lucide-react";
import StaticLayout from "./StaticLayout";

const integrations = [
  { icon: Code2, name: "WordPress", desc: "Instalasi satu klik dan caching LiteSpeed untuk WordPress." },
  { icon: Workflow, name: "Cloudflare", desc: "CDN dan proteksi DDoS terintegrasi langsung." },
  { icon: Database, name: "MySQL / MariaDB", desc: "Manajemen database dengan phpMyAdmin dan akses remote." },
  { icon: Cloud, name: "cPanel", desc: "Kontrol panel penuh untuk kelola domain, email, dan file." },
  { icon: Shield, name: "SSL Let's Encrypt", desc: "Sertifikat SSL gratis yang diperbarui otomatis." },
  { icon: Blocks, name: "Git / API", desc: "Deploy kode dari Git dan kelola sumber daya lewat API." },
];

export default function Integrasi() {
  return (
    <StaticLayout
      title="Integrasi"
      subtitle="HostFlow terhubung dengan alat favorit Anda agar pengelolaan website terasa mulus."
    >
      <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((i) => (
          <div
            key={i.name}
            className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <i.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-slate-900">{i.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{i.desc}</p>
          </div>
        ))}
      </div>
    </StaticLayout>
  );
}
