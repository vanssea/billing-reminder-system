import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles } from "lucide-react";
import { plans } from "../../data/plans";

const formatIDR = (value) => "Rp" + value.toLocaleString("id-ID");

export default function Pricing() {
  const [yearly, setYearly] = useState(true);

  return (
    <section id="harga" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-extrabold uppercase tracking-widest text-brand-600">
            Harga
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Paket Hosting Sesuai Kebutuhan Anda
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Harga transparan tanpa biaya tersembunyi. Upgrade paket kapan saja.
          </p>

          <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 p-1.5">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                !yearly ? "bg-white text-slate-900 shadow" : "text-slate-500"
              }`}
            >
              Bulanan
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition ${
                yearly ? "bg-white text-slate-900 shadow" : "text-slate-500"
              }`}
            >
              Tahunan
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700">
                Hemat 20% + Domain Gratis
              </span>
            </button>
          </div>
        </div>

        <div className="mt-14 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const price = yearly ? Math.round(plan.monthly * 0.8) : plan.monthly;

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-3xl p-8 transition ${
                  plan.popular
                    ? "border-2 border-brand-600 bg-gradient-to-b from-brand-50 to-white shadow-2xl shadow-brand-600/20 lg:-mt-4 lg:mb-[-1.5rem] lg:py-10"
                    : "border border-slate-200 bg-white hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-1.5 text-xs font-extrabold text-white shadow-lg shadow-brand-600/30">
                    <Sparkles className="h-3.5 w-3.5" />
                    Paling Populer
                  </span>
                )}

                <h3 className="text-lg font-extrabold text-slate-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.tagline}</p>

                <div className="mt-6 flex items-end gap-1.5">
                  <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                    {formatIDR(price)}
                  </span>
                  <span className="pb-1 text-sm font-medium text-slate-400">/bulan</span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-400">
                  {yearly ? "Dibayar per tahun (hemat 20%)" : "Dibayar bulanan, batalkan kapan saja"}
                </p>

                <ul className="mt-7 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                          plan.popular ? "bg-brand-600 text-white" : "bg-brand-100 text-brand-600"
                        }`}
                      >
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="text-sm text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/register?plan=${encodeURIComponent(plan.name)}`}
                  className={`mt-8 rounded-full px-6 py-3 text-center text-sm font-bold transition ${
                    plan.popular
                      ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30 hover:brightness-110"
                      : "border border-slate-300 text-slate-800 hover:border-brand-400 hover:text-brand-600"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-10 text-center text-sm font-medium text-slate-500">
          Semua paket menyertakan garansi uang kembali 30 hari · Migrasi gratis dari penyedia lain
        </p>
      </div>
    </section>
  );
}
