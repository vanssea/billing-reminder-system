import { ShieldCheck } from "lucide-react";
import StaticLayout from "./StaticLayout";

const sections = [
  {
    title: "1. Data yang Kami Kumpulkan",
    body: "Kami mengumpulkan data yang Anda berikan saat mendaftar (nama, email, nomor telepon), data pembayaran yang diproses oleh penyedia pembayaran kami, serta data penggunaan layanan seperti log akses dan statistik performa untuk menjaga kualitas layanan.",
  },
  {
    title: "2. Penggunaan Data",
    body: "Data digunakan untuk menyediakan dan meningkatkan layanan, memproses pembayaran, memberikan dukungan teknis, serta mengirimkan informasi penting terkait akun Anda. Kami tidak menjual data pribadi Anda kepada pihak ketiga.",
  },
  {
    title: "3. Penyimpanan & Keamanan",
    body: "Data disimpan pada infrastruktur yang terlindungi dengan enkripsi. Kami menerapkan langkah keamanan teknis dan organisasional untuk melindungi data dari akses tanpa izin.",
  },
  {
    title: "4. Cookie & Pelacakan",
    body: "Kami menggunakan cookie untuk menjaga sesi masuk dan memahami cara Anda menggunakan situs agar pengalaman Anda semakin baik.",
  },
  {
    title: "5. Hak Anda",
    body: "Anda dapat mengakses, memperbarui, atau menghapus data pribadi Anda kapan saja dengan menghubungi tim dukungan. Kami merespons permintaan tersebut dalam waktu yang wajar.",
  },
  {
    title: "6. Perubahan Kebijakan",
    body: "Kebijakan ini dapat diperbarui sewaktu-waktu. Perubahan signifikan akan kami umumkan melalui email atau pengumuman di situs.",
  },
];

export default function KebijakanPrivasi() {
  return (
    <StaticLayout
      title="Kebijakan Privasi"
      subtitle="Bagaimana HostFlow mengumpulkan, menggunakan, dan melindungi data Anda."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <ShieldCheck className="h-7 w-7 text-emerald-600" />
          <p className="text-sm font-semibold text-emerald-800">
            Privasi Anda adalah prioritas kami. Berlaku efektif sejak 1 Januari 2026.
          </p>
        </div>
        {sections.map((s) => (
          <div key={s.title} className="rounded-3xl border border-slate-200 bg-white p-7">
            <h3 className="text-lg font-extrabold text-slate-900">{s.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{s.body}</p>
          </div>
        ))}
      </div>
    </StaticLayout>
  );
}
