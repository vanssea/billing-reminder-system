import { FileCheck2 } from "lucide-react";
import StaticLayout from "./StaticLayout";

const sections = [
  {
    title: "1. Layanan",
    body: "HostFlow menyediakan layanan web hosting, domain, dan layanan terkait sesuai dengan paket yang Anda pilih. Dengan mendaftar, Anda menyetujui syarat dan ketentuan ini.",
  },
  {
    title: "2. Akun & Tanggung Jawab",
    body: "Anda bertanggung jawab menjaga kerahasiaan kredensial akun dan seluruh aktivitas yang terjadi pada akun Anda. Konten yang dihosting wajib sesuai dengan hukum yang berlaku di Indonesia.",
  },
  {
    title: "3. Pembayaran & Perpanjangan",
    body: "Layanan aktif setelah pembayaran diterima. Perpanjangan dapat dilakukan otomatis atau manual sesuai preferensi Anda. Paket yang diperpanjang dikenakan harga berlaku saat itu.",
  },
  {
    title: "4. Kebijakan Pembatalan & Refund",
    body: "Pelanggan baru berhak atas garansi uang kembali 30 hari. Setelah periode tersebut, sisa layanan dapat digunakan hingga akhir periode yang sudah dibayar.",
  },
  {
    title: "5. Penggunaan yang Diperbolehkan",
    body: "Dilarang menggunakan layanan untuk aktivitas ilegal, spam, phishing, atau konten yang melanggar hukum. Pelanggaran dapat mengakibatkan penangguhan akun.",
  },
  {
    title: "6. Batasan Tanggung Jawab",
    body: "Kami berupaya menjaga layanan tetap berjalan dengan uptime 99,9%, namun tidak bertanggung jawab atas kerugian tak langsung yang timbul akibat gangguan di luar kendali kami, termasuk force majeure.",
  },
  {
    title: "7. Perubahan Ketentuan",
    body: "Ketentuan ini dapat berubah sewaktu-waktu. Penggunaan layanan setelah perubahan dianggap sebagai persetujuan terhadap ketentuan terbaru.",
  },
];

export default function SyaratKetentuan() {
  return (
    <StaticLayout
      title="Syarat & Ketentuan"
      subtitle="Ketentuan penggunaan layanan HostFlow yang berlaku bagi seluruh pengguna."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center gap-3 rounded-3xl border border-brand-200 bg-brand-50 p-6">
          <FileCheck2 className="h-7 w-7 text-brand-600" />
          <p className="text-sm font-semibold text-brand-800">
            Berlaku efektif sejak 1 Januari 2026.
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
