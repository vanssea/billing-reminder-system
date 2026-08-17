import { BookOpen, CheckCircle2 } from "lucide-react";
import StaticLayout from "./StaticLayout";

const guides = [
  { title: "Memulai Hosting Baru", steps: ["Pilih paket dan daftar akun.", "Pilih domain (baru atau pindahan).", "Verifikasi email dan lakukan pembayaran.", "Website siap diakses dalam hitungan menit."] },
  { title: "Kelola Domain & DNS", steps: ["Buka menu Domain di panel kontrol.", "Tambahkan subdomain atau alihkan DNS.", "Terapkan SSL gratis otomatis."] },
  { title: "Menyiapkan Email Hosting", steps: ["Buat akun email dari menu Email.", "Atur forwarder dan autoresponder.", "Konfigurasikan di perangkat email Anda."] },
  { title: "Backup & Pemulihan", steps: ["Backup harian berjalan otomatis.", "Pulihkan file/database kapan saja.", "Unduh arsip backup untuk pengamanan ekstra."] },
];

export default function Dokumentasi() {
  return (
    <StaticLayout
      title="Dokumentasi"
      subtitle="Panduan langkah demi langkah untuk memaksimalkan layanan HostFlow."
    >
      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
        {guides.map((g) => (
          <div key={g.title} className="rounded-3xl border border-slate-200 bg-white p-7">
            <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
              <BookOpen className="h-5 w-5 text-brand-600" /> {g.title}
            </h3>
            <ol className="mt-4 space-y-2.5">
              {g.steps.map((step) => (
                <li key={step} className="flex items-start gap-2.5 text-sm text-slate-600">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </StaticLayout>
  );
}
