import { HelpCircle } from "lucide-react";
import { Link } from "react-router-dom";
import StaticLayout from "./StaticLayout";

const faqs = [
  {
    q: "Bagaimana cara memindahkan website dari penyedia lain?",
    a: "Gratis. Cukup hubungi tim dukungan, kami akan memindahkan file, database, dan email Anda tanpa downtime.",
  },
  {
    q: "Apakah saya bisa upgrade paket di tengah periode berlangganan?",
    a: "Bisa. Upgrade kapan saja dan biaya dihitung proporsional tanpa biaya tambahan.",
  },
  {
    q: "Bagaimana cara membatalkan layanan?",
    a: "Anda dapat membatalkan kapan saja dari panel kontrol. Berlaku garansi uang kembali 30 hari untuk pelanggan baru.",
  },
  {
    q: "Apakah domain gratis benar-benar gratis?",
    a: "Ya, domain gratis tersedia pada semua paket untuk tahun pertama berlangganan tahunan.",
  },
];

export default function PusatBantuan() {
  return (
    <StaticLayout
      title="Pusat Bantuan"
      subtitle="Jawaban atas pertanyaan yang paling sering ditanyakan."
    >
      <div className="mx-auto max-w-3xl space-y-5">
        {faqs.map((f) => (
          <div key={f.q} className="rounded-3xl border border-slate-200 bg-white p-7">
            <h3 className="flex items-start gap-3 text-lg font-extrabold text-slate-900">
              <HelpCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" /> {f.q}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
          </div>
        ))}
        <p className="text-center text-sm font-medium text-slate-500">
          Butuh bantuan lebih lanjut?{" "}
          <Link to="/kontak" className="font-bold text-brand-600 hover:underline">
            Hubungi kami
          </Link>
          .
        </p>
      </div>
    </StaticLayout>
  );
}
