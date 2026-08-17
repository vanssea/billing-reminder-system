import { Activity, CheckCircle2 } from "lucide-react";
import StaticLayout from "./StaticLayout";

const services = [
  { name: "Web Hosting", status: "Operasional" },
  { name: "Domain & DNS", status: "Operasional" },
  { name: "Email Hosting", status: "Operasional" },
  { name: "REST API", status: "Operasional" },
  { name: "Billing & Pembayaran", status: "Operasional" },
];

export default function StatusSistem() {
  return (
    <StaticLayout
      title="Status Sistem"
      subtitle="Pantau ketersediaan layanan HostFlow secara real-time."
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        <h2 className="mt-3 text-xl font-extrabold text-slate-900">Semua sistem beroperasi normal</h2>
        <p className="mt-1 text-sm font-medium text-emerald-700">Uptime 99,9% dalam 30 hari terakhir</p>
      </div>

      <div className="mx-auto mt-8 max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white">
        {services.map((s, i) => (
          <div
            key={s.name}
            className={`flex items-center justify-between px-7 py-5 ${i !== services.length - 1 ? "border-b border-slate-100" : ""}`}
          >
            <p className="font-bold text-slate-900">{s.name}</p>
            <span className="flex items-center gap-2 text-sm font-bold text-emerald-600">
              <Activity className="h-4 w-4" /> {s.status}
            </span>
          </div>
        ))}
      </div>
    </StaticLayout>
  );
}
