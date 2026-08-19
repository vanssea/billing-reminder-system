import { GitCommitHorizontal } from "lucide-react";
import StaticLayout from "./StaticLayout";

const releases = [
  {
    version: "v1.3.0",
    date: "Agustus 2026",
    notes: ["Harga tahunan kini berbasis data per paket.", "Tampilan landing diperbarui.", "Halaman dokumentasi publik diluncurkan."],
  },
  {
    version: "v1.2.0",
    date: "Juli 2026",
    notes: ["Data testimoni diambil dari database.", "Register memilih paket dari database."],
  },
  {
    version: "v1.1.0",
    date: "Juni 2026",
    notes: ["Kelola produk lewat API CRUD.", "Struktur tabel testimoni diperbarui."],
  },
  {
    version: "v1.0.0",
    date: "Mei 2026",
    notes: ["Rilis awal platform HostFlow.", "Landing page dan halaman auth."],
  },
];

export default function Changelog() {
  return (
    <StaticLayout
      title="Changelog"
      subtitle="Catatan perubahan terbaru di platform HostFlow."
    >
      <div className="mx-auto max-w-3xl space-y-6">
        {releases.map((r) => (
          <div
            key={r.version}
            className="rounded-3xl border border-slate-200 bg-white p-7 transition hover:border-brand-200"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                <GitCommitHorizontal className="h-5 w-5 text-brand-600" /> {r.version}
              </h3>
              <span className="text-sm font-semibold text-slate-400">{r.date}</span>
            </div>
            <ul className="mt-4 list-inside space-y-1.5 text-sm text-slate-600">
              {r.notes.map((note) => (
                <li key={note} className="list-disc">
                  {note}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </StaticLayout>
  );
}
