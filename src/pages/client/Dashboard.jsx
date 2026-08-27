import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  ReceiptText,
  Server,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getClientInvoices } from "../../services/invoiceApi";
import { getClientPayments } from "../../services/paymentApi";
import { getProducts } from "../../services/productApi";
import { formatDate, formatRupiah } from "../../utils/format";

const daysLeftLabel = (days) => {
  if (days === 0) return "Hari ini";
  if (days === 1) return "Besok";
  return `${days} hari lagi`;
};

const invoiceStatusConfig = {
  DRAFT: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  SENT: { label: "Terkirim", badge: "bg-blue-50 text-blue-600" },
  UNPAID: { label: "Belum Dibayar", badge: "bg-amber-50 text-amber-700" },
  OVERDUE: { label: "Overdue", badge: "bg-red-50 text-red-600" },
  PAID: { label: "Lunas", badge: "bg-green-50 text-green-600" },
  CANCELLED: { label: "Dibatalkan", badge: "bg-rose-50 text-rose-600" },
};

function DonutChart({ segments }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  const chartSegments = segments.map((segment, index) => {
    const length = (segment.value / total) * circumference;
    const start = segments
      .slice(0, index)
      .reduce((sum, prev) => sum + (prev.value / total) * circumference, 0);

    return { ...segment, length, start };
  });

  return (
    <svg viewBox="0 0 100 100" className="h-40 w-40 -rotate-90">
      <circle
        cx="50"
        cy="50"
        r={radius}
        fill="none"
        stroke="#dbeafe"
        strokeWidth="12"
      />

      {chartSegments.map((segment) => (
        <circle
          key={segment.label}
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={segment.color}
          strokeWidth="12"
          strokeDasharray={`${Math.max(segment.length - 2, 0)} ${
            circumference - segment.length + 2
          }`}
          strokeDashoffset={-segment.start}
        />
      ))}
    </svg>
  );
}

function getInvoiceTotal(invoice) {
  if (invoice.total != null) return invoice.total;
  return (invoice.subtotal || 0) + (invoice.tax || 0);
}

function daysUntil(dueDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return Math.round((due - today) / 86400000);
}

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { user, client, accessToken } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!client || !accessToken) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [invData, payData, prodData] = await Promise.all([
          getClientInvoices(accessToken),
          getClientPayments(accessToken),
          getProducts(),
        ]);
        setInvoices(invData || []);
        setPayments(payData || []);
        setProducts(prodData || []);
      } catch (err) {
        setError("Gagal memuat data dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client, accessToken]);

  const activeInvoices = invoices.filter(
    (inv) => inv.status === "UNPAID" || inv.status === "OVERDUE"
  );

  const stats = useMemo(() => {
    const approvedPayments = payments.filter((p) => p.verification_status === "APPROVED");
    return {
      total: invoices.length,
      unpaid: invoices.filter((inv) => inv.status === "UNPAID").length,
      overdue: invoices.filter((inv) => inv.status === "OVERDUE").length,
      upcoming: invoices.filter(
        (inv) =>
          (inv.status === "UNPAID" || inv.status === "SENT") &&
          daysUntil(inv.due_date) >= 0 &&
          daysUntil(inv.due_date) <= 7
      ).length,
      paid: invoices.filter((inv) => inv.status === "PAID").length,
      totalNominal: invoices
        .filter((inv) => inv.status !== "CANCELLED")
        .reduce((sum, inv) => sum + getInvoiceTotal(inv), 0),
      totalPaid: approvedPayments.reduce((sum, p) => sum + p.amount, 0),
    };
  }, [invoices, payments]);

  const upcomingDue = useMemo(() => {
    return invoices
      .filter(
        (inv) =>
          (inv.status === "UNPAID" || inv.status === "SENT") &&
          daysUntil(inv.due_date) >= 0 &&
          daysUntil(inv.due_date) <= 7
      )
      .map((invoice) => ({ invoice, daysLeft: daysUntil(invoice.due_date) }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [invoices]);

  const recentInvoices = useMemo(
    () => [...invoices].sort((a, b) => (a.invoice_date < b.invoice_date ? 1 : -1)).slice(0, 6),
    [invoices]
  );

  // Compute active product from latest PAID/APPROVED invoice, joined with the
  // real product catalog (name, features, price) by product_id.
  const activeProduct = useMemo(() => {
    const paidInvoices = invoices
      .filter((inv) => inv.status === "PAID")
      .sort((a, b) => new Date(b.invoice_date) - new Date(a.invoice_date));

    if (paidInvoices.length > 0) {
      const invoice = paidInvoices[0];
      const item = invoice.items?.[0];

      const matched = item?.product_id
        ? products.find((p) => String(p.id) === String(item.product_id))
        : null;

      const billingCycle = item?.billing_cycle || "monthly";
      const isMonthly = /bulan|month/i.test(billingCycle);

      return {
        name: matched?.name || item?.product_name || invoice.invoice_number || "Produk",
        billingType: isMonthly ? "Bulanan" : "Tahunan",
        price: matched?.price ?? item?.price ?? invoice.total ?? invoice.subtotal ?? 0,
        features: matched?.features || [],
        renewsOn: invoice.due_date ? new Date(invoice.due_date).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric"
        }) : "-"
      };
    }
    return null;
  }, [invoices, products]);

  if (loading) {
    return (
      <div>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <p className="py-20 text-center text-sm font-medium text-slate-500">Memuat dashboard...</p>
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

  const statCards = [
    {
      title: "Total Invoice",
      value: String(stats.total),
      description: "Semua invoice Anda",
      icon: FileText,
      color: "text-brand-600 bg-brand-600/10",
    },
    {
      title: "Belum Dibayar",
      value: String(stats.unpaid),
      description: "Status UNPAID",
      icon: ReceiptText,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Overdue",
      value: String(stats.overdue),
      description: "Melewati jatuh tempo",
      icon: AlertCircle,
      color: "text-red-600 bg-red-50",
    },
    {
      title: "Akan Jatuh Tempo",
      value: String(stats.upcoming),
      description: "Dalam 7 hari ke depan",
      icon: CalendarClock,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Lunas",
      value: String(stats.paid),
      description: "Invoice sudah dibayar",
      icon: CheckCircle2,
      color: "text-green-600 bg-green-50",
    },
    {
      title: "Total Nominal Invoice",
      value: formatRupiah(stats.totalNominal),
      description: "Total tagihan aktif",
      icon: Wallet,
      color: "text-indigo-600 bg-indigo-50",
      monetary: true,
    },
    {
      title: "Total Pembayaran",
      value: formatRupiah(stats.totalPaid),
      description: "Pembayaran terverifikasi",
      icon: Banknote,
      color: "text-emerald-600 bg-emerald-50",
      monetary: true,
    },
  ];

  const donutSegments = [
    { label: "Lunas", value: stats.paid, color: "#16a34a" },
    { label: "Belum Dibayar", value: stats.unpaid, color: "#d97706" },
    { label: "Overdue", value: stats.overdue, color: "#dc2626" },
  ];

  return (
    <div>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Halo, {user?.full_name || "Client"}!
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Ringkasan invoice, tagihan, dan layanan hosting Anda.
          </p>
        </div>

        {stats.overdue > 0 ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />

              <div>
                <p className="text-sm font-bold text-red-700">
                  Anda memiliki {stats.overdue} invoice overdue
                </p>

                <p className="text-xs text-red-600/80">
                  Segera lakukan pembayaran agar layanan tidak terganggu.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/client/payments")}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-red-600/30 transition hover:bg-red-700"
            >
              <CreditCard size={16} />
              Bayar Sekarang
            </button>
          </div>
        ) : stats.upcoming > 0 ? (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
            <div className="flex items-start gap-3">
              <CalendarClock
                size={20}
                className="mt-0.5 shrink-0 text-amber-600"
              />

              <div>
                <p className="text-sm font-bold text-amber-700">
                  {stats.upcoming} invoice akan jatuh tempo dalam 7 hari ke depan
                </p>

                <p className="text-xs text-amber-600/80">
                  Persiapkan pembayaran agar tidak terkena overdue.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate("/client/payments")}
              className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition hover:bg-amber-600"
            >
              <CreditCard size={16} />
              Bayar Sekarang
            </button>
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.title}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className={`inline-flex rounded-xl p-2.5 ${stat.color}`}>
                  <Icon size={20} />
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500">
                  {stat.title}
                </p>

                <p
                  className={`mt-1 font-bold tracking-tight text-slate-900 ${
                    stat.monetary ? "text-xl" : "text-2xl"
                  }`}
                >
                  {stat.value}
                </p>

                <p className="mt-2 text-xs text-slate-500">{stat.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="inline-flex rounded-xl bg-brand-600/10 p-2.5 text-brand-600">
                <Server size={20} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Produk Aktif
                </h2>

                <p className="text-xs text-slate-500">Layanan hosting Anda</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-brand-50 p-4">
              {activeProduct ? (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-slate-900">{activeProduct.name}</h3>

                      <span className="mt-1 inline-flex rounded-md bg-brand-600/10 px-2 py-0.5 text-xs font-semibold text-brand-700">
                        {activeProduct.billingType}
                      </span>
                    </div>

                    <p className="text-right text-lg font-bold text-brand-600">
                      {formatRupiah(activeProduct.price)}
                      <span className="block text-[11px] font-medium text-slate-500">
                        per {activeProduct.billingType === "Tahunan" ? "tahun" : "bulan"}
                      </span>
                    </p>
                  </div>

                  <ul className="mt-4 grid grid-cols-2 gap-2">
                    {activeProduct.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-1.5 text-xs text-slate-600"
                      >
                        <CheckCircle2 size={14} className="shrink-0 text-green-600" />

                        {feature}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-3">
                    <p className="text-xs text-slate-500">
                      Perpanjangan:{" "}
                      <span className="font-semibold text-slate-900">
                        {activeProduct.renewsOn}
                      </span>
                    </p>

                    <button
                      type="button"
                      onClick={() => navigate("/client/invoices")}
                      className="flex items-center gap-1 text-xs font-semibold text-brand-600 transition hover:text-brand-700"
                    >
                      Kelola
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <p className="text-sm font-medium">Belum ada produk aktif</p>
                  <p className="text-xs mt-1">Beli paket untuk memulai layanan hosting</p>
                  <button
                    type="button"
                    onClick={() => navigate("/client/products")}
                    className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                  >
                    <ShoppingCart size={12} />
                    Beli Paket
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Status Invoice
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Distribusi seluruh invoice
            </p>

            <div className="mt-4 flex items-center justify-center gap-6">
              <div className="relative">
                <DonutChart segments={donutSegments} />

                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-slate-900">
                    {donutSegments.reduce((sum, segment) => sum + segment.value, 0)}
                  </p>

                  <p className="text-xs text-slate-500">Invoice</p>
                </div>
              </div>

              <div className="space-y-3">
                {donutSegments.map((segment) => (
                  <div key={segment.label} className="flex items-center gap-2.5">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {segment.value}
                      </p>

                      <p className="text-xs text-slate-500">{segment.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900">
              Segera Jatuh Tempo
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              Tagihan dalam 7 hari ke depan
            </p>

            <div className="mt-4 space-y-3">
              {upcomingDue.length > 0 ? (
                upcomingDue.map(({ invoice, daysLeft }) => (
                  <div
                    key={invoice.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(`/client/invoices/${invoice.invoice_number}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        navigate(`/client/invoices/${invoice.invoice_number}`);
                      }
                    }}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 text-left transition hover:border-brand-300"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {invoice.items?.length > 0
                          ? invoice.items.map((i) => i.product_name).join(", ")
                          : invoice.invoice_number}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {invoice.invoice_number} · {formatRupiah(getInvoiceTotal(invoice))}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-1 text-xs font-semibold ${
                          daysLeft <= 1
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {daysLeftLabel(daysLeft)}
                      </span>

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/client/payments?invoice=${invoice.invoice_number}`);
                        }}
                        className="rounded-lg bg-brand-600/10 px-2.5 py-1 text-xs font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white"
                      >
                        Bayar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center">
                  <p className="text-sm font-semibold text-slate-500">
                    Tidak ada tagihan mendekati jatuh tempo
                  </p>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => navigate("/client/payments")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
            >
              <CreditCard size={16} />
              Bayar Sekarang
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Invoice Terbaru
              </h2>

              <p className="mt-0.5 text-xs text-slate-500">
                Aktivitas invoice terbaru untuk Anda
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/client/invoices")}
              className="flex items-center gap-1 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
            >
              Lihat Semua
              <ArrowRight size={16} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">No. Invoice</th>
                  <th className="px-5 py-3 font-semibold">Deskripsi</th>
                  <th className="px-5 py-3 font-semibold">Jatuh Tempo</th>
                  <th className="px-5 py-3 font-semibold">Jumlah</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {recentInvoices.map((invoice) => {
                  const config = invoiceStatusConfig[invoice.status];

                  return (
                    <tr
                      key={invoice.id}
                      onClick={() => navigate(`/client/invoices/${invoice.invoice_number}`)}
                      className="cursor-pointer border-b border-slate-200 last:border-0 hover:bg-brand-50"
                    >
                      <td className="px-5 py-3.5 font-semibold text-brand-600">
                        {invoice.invoice_number}
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {invoice.items?.length > 0
                          ? invoice.items.map((i) => i.product_name).join(", ")
                          : "—"}
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {formatDate(invoice.due_date)}
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {formatRupiah(getInvoiceTotal(invoice))}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${config.badge}`}
                        >
                          {config.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}