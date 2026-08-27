import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Check, CheckCircle2, ShoppingCart, Sparkles, X, AlertCircle, Loader2, UserPlus, AlertCircle as AlertCircleIcon } from "lucide-react";
import { getProducts, purchaseProduct } from "../../services/productApi";
import { getClientInvoices } from "../../services/invoiceApi";
import { formatIDR } from "../../utils/format";
import { supabase } from "../../lib/supabaseClient";

const isMonthly = (product) =>
  !product.billing_type ||
  ["bulan", "month"].some((key) =>
    product.billing_type.toLowerCase().includes(key)
  );

const discountPct = (product) =>
  product.price_yearly != null
    ? Math.round((1 - Number(product.price_yearly) / Number(product.price)) * 100)
    : 20;

const getMissingProfileFields = (client) => {
  const required = {
    company_name: "Nama Perusahaan",
    pic_name: "PIC/Nama Kontak",
    email: "Email",
    phone: "Telepon",
    address: "Alamat"
  };
  return Object.entries(required)
    .filter(([key]) => !client?.[key])
    .map(([, label]) => label);
};

export default function ClientProducts() {
  const navigate = useNavigate();
  const { user, client, isProfileComplete, accessToken } = useAuth();
  const [yearly, setYearly] = useState(true);
  const [products, setProducts] = useState([]);
  const [activeProductIds, setActiveProductIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 3000);
  };

  const handlePurchase = async () => {
    if (!selected) return;

    if (!isProfileComplete) {
      const missing = getMissingProfileFields(client);
      showToast(`Lengkapi data profil: ${missing.join(", ")}`);
      return;
    }

    setPurchasing(true);
    setPurchaseError("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setPurchaseError("Sesi tidak valid. Silakan login ulang.");
        return;
      }

      await purchaseProduct(selected.id, yearly ? "yearly" : "monthly", session.access_token);
      setSelected(null);
      showToast("Permintaan pembelian berhasil dikirim! Admin akan memproses dan menghubungi Anda.");
    } catch (err) {
      setPurchaseError(err.message);
    } finally {
      setPurchasing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [prodData, invData] = await Promise.all([
          getProducts(),
          client && accessToken ? getClientInvoices(accessToken) : Promise.resolve([]),
        ]);

        const active = (prodData || [])
          .filter((p) => p.status && p.status.toUpperCase() === "ACTIVE")
          .sort((a, b) => a.display_order - b.display_order);

        setProducts(active);

        const ids = new Set();
        (invData || [])
          .filter((inv) => inv.status === "PAID")
          .forEach((inv) => {
            (inv.items || []).forEach((item) => {
              if (item?.product_id != null) ids.add(String(item.product_id));
            });
          });
        setActiveProductIds(ids);
      } catch {
        setError("Gagal memuat daftar paket.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [client, accessToken]);

return (
    <div>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Beli Paket</h1>

          <p className="mt-1 text-sm text-slate-500">
            Pilih paket hosting yang sesuai dengan kebutuhan Anda.
          </p>

          <div className="mt-6 inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`rounded-full px-5 py-2 text-sm font-bold transition ${
                !yearly
                  ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Bulanan
            </button>

            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition ${
                yearly
                  ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              Tahunan
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-extrabold text-emerald-700">
                Hemat 20%
              </span>
            </button>
          </div>
        </div>

        {!isProfileComplete && (
          <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="mt-0.5 shrink-0 text-amber-600" size={20} />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800">
                  Profil belum lengkap
                </p>
                <p className="mt-1 text-sm text-amber-700">
                  Lengkapi field berikut untuk membeli paket:
                </p>
                <ul className="mt-2 space-y-1 text-xs text-amber-700">
                  {getMissingProfileFields(client).map((field, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <CheckCircle2 size={12} className="text-amber-600" />
                      {field}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => navigate("/client/profile")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-700"
                >
                  <UserPlus size={12} />
                  Lengkapi Profil Sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <p className="py-20 text-center text-sm font-medium text-slate-500">
            Memuat paket...
          </p>
        )}

        {error && (
          <p className="py-20 text-center text-sm font-medium text-rose-600">
            {error}
          </p>
        )}

        {!loading && !error && products.length === 0 && (
          <p className="py-20 text-center text-sm font-medium text-slate-500">
            Belum ada paket tersedia.
          </p>
        )}

        {!loading && !error && products.length > 0 && (
          <div className="grid items-stretch gap-6 lg:grid-cols-3">
            {products.map((product) => {
              const isActive = activeProductIds.has(String(product.id));
              const price = yearly
                ? product.price_yearly ?? Math.round(product.price * 0.8)
                : product.price;

              return (
                <div
                  key={product.id}
                  className={`relative flex flex-col rounded-3xl border p-8 transition ${
                    product.popular
                      ? "border-2 border-brand-600 bg-gradient-to-b from-brand-50 to-white shadow-2xl shadow-brand-600/20 lg:-mt-4 lg:mb-[-1.5rem] lg:py-10"
                      : "border-slate-200 bg-white hover:border-brand-200 hover:shadow-xl hover:shadow-brand-900/10"
                  }`}
                >
                  {product.popular && (
                    <span className="absolute -top-3.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-1.5 text-xs font-extrabold text-white shadow-lg shadow-brand-600/30">
                      <Sparkles className="h-3.5 w-3.5" />
                      Paling Populer
                    </span>
                  )}

                  {isActive && (
                    <span className="absolute -top-3.5 right-4 flex items-center gap-1 rounded-full bg-green-600 px-3 py-1 text-xs font-extrabold text-white shadow">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Paket Aktif Anda
                    </span>
                  )}

                  <h3 className="text-lg font-extrabold text-slate-900">
                    {product.name}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {product.description || "—"}
                  </p>

                  <div className="mt-6 flex items-end gap-1.5">
                    <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                      {formatIDR(price)}
                    </span>

                    <span className="pb-1 text-sm font-medium text-slate-400">
                      /{isMonthly(product) ? "bulan" : "tahun"}
                    </span>
                  </div>

                  <p className="mt-1 text-xs font-medium text-slate-400">
                    {yearly
                      ? `Hemat ${discountPct(product)}% dengan komitmen tahunan`
                      : "Dibayar bulanan, batalkan kapan saja"}
                  </p>

                  <ul className="mt-7 flex-1 space-y-3">
                    {(product.features || []).map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5">
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                            product.popular
                              ? "bg-brand-600 text-white"
                              : "bg-brand-100 text-brand-600"
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>

                        <span className="text-sm text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    disabled={isActive}
                    onClick={() => setSelected(product)}
                    className={`mt-8 rounded-full px-6 py-3 text-center text-sm font-bold transition ${
                      isActive
                        ? "cursor-not-allowed border border-slate-200 text-slate-400"
                        : product.popular
                          ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-600/30 hover:brightness-110"
                          : "border border-brand-600/40 text-brand-600 hover:bg-brand-600 hover:text-white"
                    }`}
                  >
                    {isActive ? "Paket Aktif" : "Beli Paket Ini"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Konfirmasi Pembelian
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Pastikan paket yang Anda pilih sudah benar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-5 rounded-xl border border-slate-200 bg-brand-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{selected.name}</p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {isMonthly(selected) ? "Bulanan" : "Tahunan"} ·{" "}
                      {yearly ? "Komitmen tahunan" : "Tanpa kontrak"}
                    </p>
                  </div>

                  <p className="text-lg font-bold text-brand-600">
                    {formatIDR(
                      yearly
                        ? selected.price_yearly ?? Math.round(selected.price * 0.8)
                        : selected.price
                    )}
                    <span className="block text-[11px] font-medium text-slate-500">
                      /{isMonthly(selected) ? "bulan" : "tahun"}
                    </span>
                  </p>
                </div>

                <div className="mt-3 border-t border-slate-200 pt-3">
                  <p className="text-xs font-semibold text-slate-600">Fitur:</p>

                  <ul className="mt-1.5 space-y-1">
                    {(selected.features || []).slice(0, 3).map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-1.5 text-xs text-slate-500"
                      >
                        <Check size={12} className="text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {purchaseError && (
                <p className="mt-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                  <AlertCircle size={14} />
                  {purchaseError}
                </p>
              )}

              <button
                type="button"
                onClick={handlePurchase}
                disabled={purchasing}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {purchasing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <ShoppingCart size={16} />
                    Kirim Pesanan
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-slate-500">
                Permintaan akan dikirim ke admin untuk diproses.
              </p>
            </div>
          </div>
        )}
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