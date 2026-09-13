import { useEffect, useState } from "react";
import {
  CheckCircle2,
  MessageSquare,
  Star,
  Users,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  createClientTestimonial,
  getClientEligibility,
  getTestimonials,
} from "../../services/testimonialApi";
import { formatRupiah } from "../../utils/format";

export default function ClientTestimonials() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasApprovedPurchase, setHasApprovedPurchase] = useState(false);
  const [hasTestimonial, setHasTestimonial] = useState(false);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [quote, setQuote] = useState("");
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  useEffect(() => {
    if (!accessToken) return;

    const controller = new AbortController();
    let mounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError("");
        const [eligibility, list] = await Promise.all([
          getClientEligibility(accessToken, { signal: controller.signal }),
          getTestimonials(6, { signal: controller.signal }),
        ]);

        if (!mounted) return;
        setHasApprovedPurchase(eligibility.has_approved_purchase);
        setHasTestimonial(eligibility.has_testimonial);
        setPurchaseHistory(eligibility.approved_purchases || []);
        setTestimonials(
          (list || [])
            .filter((t) => t.status === "ACTIVE")
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
        );
      } catch (err) {
        if (!mounted || err?.name === "AbortError") return;
        setError("Gagal memuat data.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, [accessToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quote.trim()) {
      setError("Testimoni wajib diisi.");
      return;
    }
    if (rating < 1) {
      setError("Pilih rating terlebih dahulu.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      await createClientTestimonial({ quote, rating }, accessToken);
      setQuote("");
      setRating(5);
      setHasTestimonial(true);
      showToast("Terima kasih! Testimoni Anda sudah dikirim.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <p className="py-20 text-center text-sm font-medium text-slate-500">Memuat data testimoni...</p>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <p className="py-20 text-center text-sm font-medium text-rose-600">{error}</p>
        </main>
      </div>
    );
  }

  return (
    <div>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Testimoni Saya
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Berikan testimonial setelah Anda membeli paket kami
          </p>
        </div>

        {!hasApprovedPurchase && !hasTestimonial && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={24} />
              <div>
                <h2 className="text-lg font-bold text-amber-800">
                  Belum Memenuhi Syarat
                </h2>
                <p className="mt-1 text-sm text-amber-700">
                  Anda perlu memiliki pembelian yang disetujui terlebih dahulu
                  sebelum dapat memberikan testimonial.
                </p>
                {purchaseHistory.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-amber-800">
                      Riwayat pembelian Anda:
                    </p>
                    {purchaseHistory.map((p) => (
                      <div
                        key={p.id}
                        className="mt-2 rounded-lg bg-amber-100/50 p-3"
                      >
                        <p className="text-sm font-medium text-amber-900">
                          {p.product_name}
                        </p>
                        <p className="text-xs text-amber-700">
                          {p.billing_cycle === "yearly" ? "Tahunan" : "Bulanan"} ·{" "}
                          {formatRupiah(p.amount)} · Status: {p.status}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {hasTestimonial && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="text-green-600" size={24} />
              <h2 className="text-lg font-bold text-green-800">
                Terima Kasih!
              </h2>
            </div>
            <p className="mt-1 text-sm text-green-700">
              Anda sudah memberikan testimonial. Terima kasih atas masukan
              Anda!
            </p>
          </div>
        )}

        {hasApprovedPurchase && !hasTestimonial && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/10 text-brand-600">
                <MessageSquare size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Buat Testimoni
                </h2>
                <p className="text-sm text-slate-500">
                  Bagikan pengalaman Anda dengan produk kami
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Testimoni Anda
                </label>
                <textarea
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  rows={5}
                  placeholder="Tulis testimoni Anda di sini..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-600">
                  Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className={`transition ${star <= (hoveredRating || rating) ? "text-amber-400" : "text-slate-300"}`}
                    >
                      <Star size={32} fill="currentColor" strokeWidth={0} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-slate-500">
                    {rating} / 5
                  </span>
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Kirim Testimoni
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-600/10 text-brand-600">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Testimoni dari Client Lain
              </h2>
              <p className="text-sm text-slate-500">
                Lihat pengalaman client yang sudah membeli
              </p>
            </div>
          </div>
          <TestimonialList testimonials={testimonials} />
        </div>
      </main>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-green-200 bg-white px-5 py-3.5 shadow-xl shadow-slate-900/10">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
            <CheckCircle2 size={18} />
          </span>
          <p className="text-sm font-semibold text-slate-900">{toast}</p>
        </div>
      )}
    </div>
  );
}

function TestimonialList({ testimonials = [] }) {
  if (testimonials.length === 0) {
    return (
      <div className="mt-8 py-8 text-center text-sm text-slate-500">
        Belum ada testimoni.
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      {testimonials.map((t) => (
        <div
          key={t.id}
          className="rounded-xl border border-slate-100 bg-slate-50 p-4"
        >
          <div className="flex gap-1 text-amber-400">
            {Array.from({ length: t.rating || 5 }).map((_, i) => (
              <Star key={i} size={14} fill="currentColor" strokeWidth={0} />
            ))}
          </div>
          <blockquote className="mt-2 text-sm text-slate-600">
            &ldquo;{t.quote}&rdquo;
          </blockquote>
          <div className="mt-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600/10 text-xs font-extrabold text-brand-700">
              {t.initials || t.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="text-sm font-bold text-slate-900">{t.name}</p>
              {t.role && (
                <p className="text-xs font-medium text-slate-500">{t.role}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
