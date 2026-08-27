import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Download, Search } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getClientInvoices } from "../../services/invoiceApi";
import { getClientPayments } from "../../services/paymentApi";
import { formatDate, formatRupiah } from "../../utils/format";

const statusFilters = ["ALL", "SENT", "UNPAID", "OVERDUE", "PAID", "CANCELLED"];

const invoiceStatusConfig = {
  DRAFT: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  SENT: { label: "Terkirim", badge: "bg-blue-50 text-blue-600" },
  UNPAID: { label: "Belum Dibayar", badge: "bg-amber-50 text-amber-700" },
  OVERDUE: { label: "Overdue", badge: "bg-red-50 text-red-600" },
  PAID: { label: "Lunas", badge: "bg-green-50 text-green-600" },
  CANCELLED: { label: "Dibatalkan", badge: "bg-rose-50 text-rose-600" },
};

const paymentStatusConfig = {
  PENDING: { label: "Menunggu Verifikasi", badge: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Disetujui", badge: "bg-green-50 text-green-600" },
  REJECTED: { label: "Ditolak", badge: "bg-red-50 text-red-600" },
};

function getInvoiceTotal(invoice) {
  if (invoice.total != null) return invoice.total;
  return (invoice.subtotal || 0) + (invoice.tax || 0);
}

export default function ClientInvoices() {
  const navigate = useNavigate();
  const { client, accessToken } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (!client || !accessToken) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [invData, payData] = await Promise.all([
          getClientInvoices(accessToken),
          getClientPayments(accessToken),
        ]);
        setInvoices(invData || []);
        setPayments(payData || []);
      } catch (err) {
        setError("Gagal memuat data invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client, accessToken]);

  const sortedInvoices = [...invoices].sort((a, b) =>
    a.invoice_date < b.invoice_date ? 1 : -1
  );

  const activeInvoices = sortedInvoices.filter(
    (invoice) => invoice.status === "UNPAID" || invoice.status === "OVERDUE"
  );
  const activeTotal = activeInvoices.reduce(
    (sum, invoice) => sum + getInvoiceTotal(invoice),
    0
  );

  const filtered = sortedInvoices.filter((invoice) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q ||
      invoice.invoice_number?.toLowerCase().includes(q) ||
      invoice.id.toLowerCase().includes(q);
    const matchesStatus = status === "ALL" || invoice.status === status;
    const matchesFrom = !fromDate || invoice.due_date >= fromDate;
    const matchesTo = !toDate || invoice.due_date <= toDate;

    return matchesQuery && matchesStatus && matchesFrom && matchesTo;
  });

  const countByStatus = (filter) =>
    filter === "ALL"
      ? sortedInvoices.length
      : sortedInvoices.filter((invoice) => invoice.status === filter).length;

  if (loading) {
    return (
      <div>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <p className="py-20 text-center text-sm font-medium text-slate-500">Memuat invoice...</p>
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Invoice Saya</h1>

          <p className="mt-1 text-sm text-slate-500">
            Daftar invoice dan status pembayaran Anda.
          </p>

          {activeInvoices.length > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              {activeInvoices.length} tagihan belum dibayar · total{" "}
              {formatRupiah(activeTotal)}
            </p>
          )}
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <div className="relative">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari nomor invoice, contoh: INV-2026-0012"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 sm:max-w-md"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatus(filter)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  status === filter
                    ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/30"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600"
                }`}
              >
                {filter === "ALL"
                  ? "Semua"
                  : invoiceStatusConfig[filter].label}
                <span
                  className={`ml-1.5 ${status === filter ? "text-white/80" : "text-slate-400"}`}
                >
                  {countByStatus(filter)}
                </span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              Dari
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none transition focus:border-brand-500"
              />
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              Sampai
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none transition focus:border-brand-500"
              />
            </label>

            <p className="text-xs text-slate-400">Filter berdasarkan jatuh tempo</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">No. Invoice</th>
                  <th className="px-5 py-3 font-semibold">Deskripsi</th>
                  <th className="px-5 py-3 font-semibold">Tanggal</th>
                  <th className="px-5 py-3 font-semibold">Jatuh Tempo</th>
                  <th className="px-5 py-3 font-semibold">Jumlah</th>
                  <th className="px-5 py-3 font-semibold">Pembayaran</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>

              <tbody>
                {filtered.map((invoice) => {
                  const config = invoiceStatusConfig[invoice.status];
                  const payment = payments.find((p) => p.invoice_id === invoice.id);
                  const paymentConfig = payment
                    ? paymentStatusConfig[payment.verification_status]
                    : null;
                  const isPayable =
                    invoice.status === "UNPAID" || invoice.status === "OVERDUE" || invoice.status === "SENT";

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
                        {formatDate(invoice.invoice_date)}
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {formatDate(invoice.due_date)}
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {formatRupiah(getInvoiceTotal(invoice))}
                      </td>

                      <td className="px-5 py-3.5">
                        {paymentConfig ? (
                          <span
                            title={
                              payment?.verification_status === "REJECTED"
                                ? payment.rejection_reason
                                : undefined
                            }
                            className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${paymentConfig.badge}`}
                          >
                            {paymentConfig.label}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-semibold ${config.badge}`}
                        >
                          {config.label}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {isPayable && (
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                navigate(`/client/payments?invoice=${invoice.invoice_number}`);
                              }}
                              aria-label={`Bayar ${invoice.id}`}
                              title="Bayar"
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600/10 px-2.5 text-xs font-bold text-brand-700 transition hover:bg-brand-600 hover:text-white"
                            >
                              <CreditCard size={14} />
                              Bayar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              navigate(`/client/invoices/${invoice.invoice_number}`, {
                                state: { pdf: true },
                              });
                            }}
                            aria-label={`Download PDF ${invoice.invoice_number}`}
                            title="Download PDF"
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filtered.length === 0 && (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">
                Tidak ada invoice yang cocok dengan filter Anda.
              </p>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setStatus("ALL");
                  setFromDate("");
                  setToDate("");
                }}
                className="mt-3 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
              >
                Reset filter
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}