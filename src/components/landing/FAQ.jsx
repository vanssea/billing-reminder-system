import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { getFAQs } from "../../services/faqApi";

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    getFAQs()
      .then((data) =>
        setFaqs(
          data
            .filter((f) => f.status.toUpperCase() === "ACTIVE")
            .sort((a, b) => a.display_order - b.display_order)
        )
      )
      .catch(() => setError("Gagal memuat daftar pertanyaan."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="faq" className="scroll-mt-24 bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-extrabold uppercase tracking-widest text-brand-600">
            FAQ
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Tidak menemukan jawaban? Hubungi tim dukungan kami kapan saja.
          </p>
        </div>

        <div className="mt-12">
          {loading && (
            <p className="text-center text-sm font-medium text-slate-500">
              Memuat pertanyaan...
            </p>
          )}

          {error && (
            <p className="text-center text-sm font-medium text-rose-500">{error}</p>
          )}

          {!loading && !error && faqs.length === 0 && (
            <p className="text-center text-sm font-medium text-slate-500">
              Belum ada pertanyaan.
            </p>
          )}

          <div className="space-y-3">
            {faqs.map((faq, i) => {
              const isOpen = openIndex === i;

              return (
                <div
                  key={faq.id}
                  className={`overflow-hidden rounded-2xl border transition ${
                    isOpen
                      ? "border-brand-200 bg-brand-50/50 shadow-md shadow-brand-900/5"
                      : "border-slate-200 bg-white hover:border-brand-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? -1 : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-bold text-slate-900">{faq.question}</span>
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                        isOpen
                          ? "rotate-180 bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </span>
                  </button>

                  <div
                    className={`grid transition-all duration-300 ${
                      isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-6 text-sm leading-relaxed text-slate-600">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}