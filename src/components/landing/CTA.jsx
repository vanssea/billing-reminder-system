import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLowestProductPrice } from "../../hooks/useLowestProductPrice";
import { formatIDR } from "../../utils/format";

export default function CTA() {
  const lowestPrice = useLowestProductPrice();

  return (
    <section className="bg-white pb-20 sm:pb-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-brand-700 via-brand-600 to-brand-400 px-6 py-16 text-center shadow-2xl shadow-brand-700/40 sm:px-16 sm:py-20">
          {/* Decor */}
          <div className="bg-dot-grid absolute inset-0 opacity-20" />
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-sky-300/20 blur-2xl" />

          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Siap Membuat Website Cepat &amp; Selalu Online?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-white/85">
              {lowestPrice != null
                ? `Website cepat, aman, dan uptime 99,9% dimulai dari ${formatIDR(lowestPrice)}/bulan — lengkap dengan SSL gratis dan dukungan 24/7.`
                : "Website cepat, aman, dan uptime 99,9% — lengkap dengan SSL gratis dan dukungan 24/7."}
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-extrabold text-brand-700 shadow-xl transition hover:bg-brand-50"
              >
                Mulai Hosting Sekarang
                <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
              </Link>
              <a
                href="#fitur"
                className="inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-3.5 text-base font-bold text-white transition hover:bg-white/10"
              >
                Pelajari Fitur
              </a>
            </div>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-white/90">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Domain gratis
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Migrasi gratis
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Garansi uang kembali 30 hari
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
