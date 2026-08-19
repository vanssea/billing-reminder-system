import { Briefcase, Send } from "lucide-react";
import { Link } from "react-router-dom";
import StaticLayout from "./StaticLayout";

export default function Karir() {
  return (
    <StaticLayout
      title="Karir"
      subtitle="Bergabunglah dengan tim yang membangun infrastruktur digital untuk ribuan bisnis di Indonesia."
    >
      <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
          <Briefcase className="h-7 w-7" />
        </span>
        <h2 className="mt-5 text-xl font-extrabold text-slate-900">
          Saat ini belum ada lowongan terbuka
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          Kami selalu terbuka terhadap talenta hebat. Kirimkan CV Anda dan kami akan menghubungi
          Anda ketika ada posisi yang cocok.
        </p>
        <Link
          to="/kontak"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
        >
          <Send className="h-4 w-4" /> Kirim Lamaran Spontan
        </Link>
      </div>
    </StaticLayout>
  );
}
