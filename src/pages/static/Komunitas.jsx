import { MessagesSquare, Send, Users } from "lucide-react";
import StaticLayout from "./StaticLayout";

const communities = [
  {
    icon: MessagesSquare,
    name: "Forum Komunitas",
    desc: "Diskusikan solusi teknis dan berbagi pengalaman dengan sesama pengguna.",
  },
  {
    icon: Send,
    name: "Grup Telegram",
    desc: "Kabar terbaru, pengumuman pemeliharaan, dan obrolan hangat komunitas.",
  },
  {
    icon: Users,
    name: "Meetup Lokal",
    desc: "Bertemu langsung dengan pengguna dan tim HostFlow di berbagai kota.",
  },
];

export default function Komunitas() {
  return (
    <StaticLayout
      title="Komunitas"
      subtitle="Bergabung dengan ribuan pembuat website di Indonesia yang menggunakan HostFlow."
    >
      <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
        {communities.map((c) => (
          <div
            key={c.name}
            className="rounded-3xl border border-slate-200 bg-white p-7 text-center transition hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/5"
          >
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-100 text-brand-600">
              <c.icon className="h-6 w-6" />
            </span>
            <h3 className="mt-4 text-lg font-extrabold text-slate-900">{c.name}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-500">{c.desc}</p>
          </div>
        ))}
      </div>
    </StaticLayout>
  );
}
