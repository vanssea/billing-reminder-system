import { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { getTestimonials } from "../../services/testimonialApi";

const toneStyles = {
  brand: "bg-brand-100 text-brand-700",
  sky: "bg-sky-100 text-sky-700",
  emerald: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  blue: "bg-blue-100 text-blue-700",
  fuchsia: "bg-fuchsia-100 text-fuchsia-700",
};

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getTestimonials()
      .then((data) =>
        setTestimonials(
          data
            .filter((t) => t.status.toUpperCase() === "ACTIVE")
            .sort((a, b) => a.display_order - b.display_order)
        )
      )
      .catch(() => setError("Gagal memuat testimoni."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="testimoni" className="scroll-mt-24 bg-gradient-to-b from-brand-50/60 to-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-widest text-brand-600">
            Testimoni
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Dipercaya Ribuan Website di Indonesia
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Ribuan bisnis sudah merasakan website yang cepat, aman, dan selalu online bersama
            HostFlow.
          </p>
        </div>

        {loading && (
          <p className="mt-14 text-center text-sm font-medium text-slate-500">
            Memuat testimoni...
          </p>
        )}

        {error && (
          <p className="mt-14 text-center text-sm font-medium text-rose-500">{error}</p>
        )}

        {!loading && !error && testimonials.length === 0 && (
          <p className="mt-14 text-center text-sm font-medium text-slate-500">
            Belum ada testimoni.
          </p>
        )}

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.id}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
            >
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: t.rating || 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                ))}
              </div>

              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-slate-600">
                “{t.quote}”
              </blockquote>

              <figcaption className="mt-6 flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold ${toneStyles[t.tone] || toneStyles.brand}`}
                >
                  {t.initials || t.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  {t.role && (
                    <p className="text-xs font-medium text-slate-500">{t.role}</p>
                  )}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}