import { Code2, KeyRound } from "lucide-react";
import StaticLayout from "./StaticLayout";

const endpoints = [
  { method: "GET", path: "/api/products", desc: "Mengambil daftar semua paket produk." },
  { method: "GET", path: "/api/products/{id}", desc: "Mengambil satu produk berdasarkan ID." },
  { method: "POST", path: "/api/products", desc: "Membuat produk baru." },
  { method: "PUT", path: "/api/products/{id}", desc: "Memperbarui produk." },
  { method: "DELETE", path: "/api/products/{id}", desc: "Menghapus produk." },
  { method: "GET", path: "/api/testimonials", desc: "Mengambil daftar testimoni." },
];

const methodColor = {
  GET: "bg-sky-100 text-sky-700",
  POST: "bg-emerald-100 text-emerald-700",
  PUT: "bg-amber-100 text-amber-700",
  DELETE: "bg-rose-100 text-rose-700",
};

export default function PanduanAPI() {
  return (
    <StaticLayout
      title="Panduan API"
      subtitle="Kelola sumber daya HostFlow secara terprogram menggunakan REST API."
    >
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-7">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <KeyRound className="h-5 w-5 text-brand-600" /> Autentikasi
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Tambahkan token pada header setiap permintaan. Ganti{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold text-brand-600">
              {"{TOKEN}"}
            </code>{" "}
            dengan kunci API Anda.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-900 p-5 text-xs leading-relaxed text-slate-100">
            {`Authorization: Bearer {TOKEN}
Content-Type: application/json`}
          </pre>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          {endpoints.map((e) => (
            <div
              key={e.path + e.method}
              className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-7 py-4 last:border-0"
            >
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold ${methodColor[e.method]}`}>
                {e.method}
              </span>
              <code className="font-mono text-sm font-bold text-slate-800">{e.path}</code>
              <span className="ml-auto w-full text-sm text-slate-500 sm:w-auto sm:flex-1 sm:text-right">
                {e.desc}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">
          <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
            <Code2 className="h-5 w-5 text-brand-600" /> Contoh Respons
          </h3>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-900 p-5 text-xs leading-relaxed text-slate-100">
            {`[
  {
    "id": "1",
    "name": "Starter",
    "price": 25000,
    "price_yearly": 20000,
    "billing_type": "bulanan",
    "features": ["1 website", "10 GB NVMe"],
    "popular": false,
    "status": "ACTIVE",
    "display_order": 1
  }
]`}
          </pre>
        </div>
      </div>
    </StaticLayout>
  );
}
