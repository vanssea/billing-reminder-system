import { CalendarDays, FileText } from "lucide-react";
import StaticLayout from "./StaticLayout";

const posts = [
  {
    title: "Tips Memilih Paket Hosting untuk Bisnis Baru",
    date: "Segera",
  },
  {
    title: "Mengapa Server NVMe Mengubah Kinerja Website",
    date: "Segera",
  },
  {
    title: "Panduan Migrasi Website ke HostFlow Tanpa Downtime",
    date: "Segera",
  },
  {
    title: "Cara Mengamankan Website dari Serangan DDoS",
    date: "Segera",
  },
];

export default function Blog() {
  return (
    <StaticLayout
      title="Blog"
      subtitle="Tutorial, tips, dan kabar terbaru seputar web hosting dan pengelolaan website."
    >
      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-2">
        {posts.map((post) => (
          <article
            key={post.title}
            className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <FileText className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold leading-snug text-slate-900">
              {post.title}
            </h3>
            <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-slate-400">
              <CalendarDays className="h-4 w-4" /> {post.date}
            </p>
          </article>
        ))}
      </div>
    </StaticLayout>
  );
}
