import { CheckCircle2, HeartHandshake, Lock, TrendingUp } from "lucide-react";
import StaticLayout from "./StaticLayout";

const values = [
  {
    icon: TrendingUp,
    title: "Performa Utama",
    desc: "Server NVMe dan LiteSpeed memastikan website Anda selalu cepat dimuat.",
  },
  {
    icon: Lock,
    title: "Keamanan Berlapis",
    desc: "SSL gratis, firewall, dan backup harian melindungi data Anda sepanjang waktu.",
  },
  {
    icon: HeartHandshake,
    title: "Dukungan Manusia",
    desc: "Tim dukungan 24/7 yang siap membantu Anda melalui chat dan email.",
  },
  {
    icon: CheckCircle2,
    title: "Harga Transparan",
    desc: "Tanpa biaya tersembunyi dan garansi uang kembali 30 hari.",
  },
];

export default function TentangKami() {
  return (
    <StaticLayout
      title="Tentang Kami"
      subtitle="Membangun fondasi digital bagi ribuan bisnis di Indonesia dengan hosting cepat, aman, dan terjangkau."
    >
      <div className="mx-auto max-w-3xl space-y-6 text-slate-600">
        <p className="leading-relaxed">
          HostFlow berdiri dengan satu misi sederhana: membuat website cepat dan selalu online
          terjangkau bagi setiap orang — dari pemilik usaha kecil hingga perusahaan berskala besar.
        </p>
        <p className="leading-relaxed">
          Kami mengelola infrastruktur berbasis server NVMe, LiteSpeed, dan jaringan ber-redundansi
          tinggi sehingga setiap website di platform kami menikmati uptime 99,9% dan waktu muat
          super cepat.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-5xl gap-6 sm:grid-cols-2">
        {values.map((v) => (
          <div
            key={v.title}
            className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <v.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-slate-900">{v.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{v.desc}</p>
          </div>
        ))}
      </div>
    </StaticLayout>
  );
}
