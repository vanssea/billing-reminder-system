import { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Clock,
  FileText,
  Info,
  Plus,
  Search,
  Upload,
  Wallet,
  X,
  Loader2,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getClientInvoices } from "../../services/invoiceApi";
import {
  getClientPayments,
  createPayment,
  uploadPaymentProof,
  validatePaymentProofFile,
} from "../../services/paymentApi";
import { formatDate, formatRupiah } from "../../utils/format";

const paymentStatusConfig = {
  PENDING: { label: "Menunggu Verifikasi", badge: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Disetujui", badge: "bg-green-50 text-green-600" },
  REJECTED: { label: "Ditolak", badge: "bg-red-50 text-red-600" },
};

const paymentMethods = [
  { value: "BANK_TRANSFER", label: "Transfer Bank" },
  { value: "CASH", label: "Cash" },
  { value: "OTHER", label: "Lainnya" },
];

const paymentInstructions = {
  banks: [
    { name: "BCA", accountNumber: "1234567890", holderName: "PT HostFlow Nusantara" },
    { name: "BNI", accountNumber: "9876543210", holderName: "PT HostFlow Nusantara" },
    { name: "Mandiri", accountNumber: "1122334455", holderName: "PT HostFlow Nusantara" },
  ],
  virtualAccount: { name: "BCA Virtual Account", holderName: "PT HostFlow Nusantara" },
  qris: { name: "QRIS", note: "Scan kode QRIS yang dikirim melalui email." },
};

function getVirtualAccountNumber(invoiceId) {
  return `88008${invoiceId.replace(/\D/g, "")}`;
}

function getPaymentMethodLabel(value) {
  const method = paymentMethods.find((m) => m.value === value);
  return method?.label ?? value;
}

function getInvoiceTotal(invoice) {
  if (invoice.total != null) return invoice.total;
  return (invoice.subtotal || 0) + (invoice.tax || 0);
}

// Format angka nominal dengan pemisah ribuan titik (id-ID), mis. 500000 -> 500.000
const formatNominal = (digits) => {
  const clean = String(digits ?? "").replace(/\D/g, "");
  return clean ? Number(clean).toLocaleString("id-ID") : "";
};

const TODAY = new Date().toISOString().split("T")[0];

const emptyForm = {
  invoiceId: "",
  amount: "",
  paymentDate: TODAY,
  paymentMethod: "",
  proofFile: null,
  proofName: "",
};

export default function ClientPayments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { client, accessToken, loading: authLoading } = useAuth();

  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (authLoading || !accessToken || !client) return;

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
        setError("Gagal memuat data pembayaran");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client, accessToken, authLoading]);

  useEffect(() => {
    if (searchParams.get("invoice")) {
      const invoiceParam = searchParams.get("invoice");
      const invoice = invoices.find(
        (item) => item.invoice_number === invoiceParam || item.id === invoiceParam
      );
      const payment = invoice
        ? payments.find((p) => p.invoice_id === invoice.id)
        : null;
      const canPreselect =
        Boolean(invoice) &&
        (invoice.status === "UNPAID" || invoice.status === "OVERDUE" || invoice.status === "SENT") &&
        (!payment || payment.verification_status === "REJECTED");

      if (canPreselect) {
        setForm({
          invoiceId: invoice.id,
          amount: String(getInvoiceTotal(invoice)),
          paymentDate: TODAY,
          paymentMethod: payment?.payment_method ?? "",
          proofFile: null,
          proofName: "",
        });
        setOpen(true);
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, invoices, payments]);

  useEffect(() => {
    if (!form.proofFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(form.proofFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [form.proofFile]);

  const outstanding = invoices
    .filter((invoice) => invoice.status === "UNPAID" || invoice.status === "OVERDUE" || invoice.status === "SENT")
    .reduce((sum, invoice) => sum + getInvoiceTotal(invoice), 0);

  const pendingCount = payments.filter((payment) => payment.verification_status === "PENDING").length;

  const filteredPayments = useMemo(
    () =>
      payments.filter((payment) => {
        const matchesQuery =
          payment.payment_id
            .toLowerCase()
            .includes(query.trim().toLowerCase()) ||
          payment.invoice_id
            .toLowerCase()
            .includes(query.trim().toLowerCase());
        const matchesStatus =
          filterStatus === "ALL" ||
          payment.verification_status === filterStatus;

        return matchesQuery && matchesStatus;
      }),
    [payments, query, filterStatus]
  );

  const countByStatus = (filter) =>
    filter === "ALL"
      ? payments.length
      : payments.filter((payment) => payment.verification_status === filter).length;

  const eligibleInvoices = invoices.filter((invoice) => {
    if (invoice.status !== "UNPAID" && invoice.status !== "OVERDUE" && invoice.status !== "SENT") return false;

    const payment = payments.find((p) => p.invoice_id === invoice.id);

    return !payment || payment.verification_status === "REJECTED";
  });

  const selectedInvoice = invoices.find((invoice) => invoice.id === form.invoiceId);

  const openUpload = (invoiceId = "", prefill = null) => {
    setFormError("");
    setForm({
      invoiceId,
      amount: prefill ? String(prefill.amount) : "",
      paymentDate: TODAY,
      paymentMethod: prefill?.payment_method ?? "",
      proofFile: null,
      proofName: "",
    });
    setOpen(true);
  };

  const handleInvoiceChange = (invoiceId) => {
    const invoice = invoices.find((item) => item.id === invoiceId);
    const rejectedPayment = payments.find((p) => p.invoice_id === invoiceId);

    setForm((prev) => ({
      ...prev,
      invoiceId,
      amount: invoice ? String(getInvoiceTotal(invoice)) : "",
      paymentMethod: rejectedPayment?.payment_method ?? "",
    }));
  };

  const handleSubmit = async () => {
    if (!form.invoiceId) {
      setFormError("Pilih invoice yang akan dibayar.");
      return;
    }

    if (!form.amount || Number(form.amount) <= 0) {
      setFormError("Nominal pembayaran tidak valid.");
      return;
    }

    if (!form.paymentDate) {
      setFormError("Tanggal pembayaran wajib diisi.");
      return;
    }

    if (!form.paymentMethod) {
      setFormError("Pilih metode pembayaran.");
      return;
    }

    if (!form.proofFile) {
      setFormError("Upload bukti pembayaran terlebih dahulu.");
      return;
    }

    const fileError = validatePaymentProofFile(form.proofFile);
    if (fileError) {
      setFormError(fileError);
      return;
    }

    if (!client) {
      setFormError("Data client tidak ditemukan.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const { publicUrl } = await uploadPaymentProof(form.proofFile, client.id);

      await createPayment(
        {
          invoice_id: form.invoiceId,
          amount: Number(form.amount),
          payment_date: form.paymentDate,
          payment_method: form.paymentMethod,
          proof_url: publicUrl,
        },
        accessToken
      );
      setOpen(false);
      setForm(emptyForm);
      setBanner(
        `Bukti pembayaran untuk ${selectedInvoice?.invoice_number || form.invoiceId} berhasil diupload. Status: Menunggu verifikasi admin.`
      );
      const payData = await getClientPayments(accessToken);
      setPayments(payData || []);
    } catch (err) {
      setFormError("Gagal mengupload bukti: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Akun baru belum punya baris clients: jangan spinner selamanya,
  // tampilkan halaman + CTA lengkapi profil.
  const needsProfile = !authLoading && !!accessToken && !client;

  if (loading && !needsProfile) {
    return (
      <div>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <p className="py-20 text-center text-sm font-medium text-slate-500">Memuat data pembayaran...</p>
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
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Pembayaran</h1>

            <p className="mt-1 text-sm text-slate-500">
              Riwayat pembayaran dan unggah bukti transfer Anda.
            </p>
          </div>

          <button
            type="button"
            onClick={() => openUpload()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
          >
            <Plus size={16} />
            Upload Bukti Pembayaran
          </button>
        </div>

        {banner && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
            <Info size={18} className="mt-0.5 shrink-0 text-brand-600" />

            <div className="flex-1">
              <p className="text-sm font-semibold text-brand-700">{banner}</p>

              <p className="mt-0.5 text-xs text-brand-600/80">
                Admin akan memverifikasi bukti Anda. Invoice menjadi Lunas setelah disetujui.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setBanner("")}
              className="rounded-lg p-1 text-brand-600 transition hover:bg-brand-100"
              aria-label="Tutup notifikasi"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="inline-flex rounded-xl bg-amber-50 p-2.5 text-amber-600">
              <Wallet size={20} />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Total Outstanding
            </p>

            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {formatRupiah(outstanding)}
            </p>

            <p className="mt-1.5 text-xs text-slate-500">
              Tagihan UNPAID & OVERDUE
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="inline-flex rounded-xl bg-brand-600/10 p-2.5 text-brand-600">
              <Clock size={20} />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Menunggu Verifikasi
            </p>

            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              {pendingCount}
            </p>

            <p className="mt-1.5 text-xs text-slate-500">
              Bukti sedang diperiksa admin
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="inline-flex rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
              <Info size={20} />
            </div>

            <p className="mt-4 text-sm font-medium text-slate-500">
              Estimasi Verifikasi
            </p>

            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              ± 1×24 Jam
            </p>

            <p className="mt-1.5 text-xs text-slate-500">
              Hari kerja setelah upload bukti
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3">
          <div className="relative sm:max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari Payment ID atau Invoice ID"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {["ALL", "PENDING", "APPROVED", "REJECTED"].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setFilterStatus(filter)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                  filterStatus === filter
                    ? "bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-md shadow-brand-600/30"
                    : "border border-slate-200 bg-white text-slate-500 hover:border-brand-300 hover:text-brand-600"
                }`}
              >
                {filter === "ALL"
                  ? "Semua"
                  : paymentStatusConfig[filter].label}
                <span
                  className={`ml-1.5 ${
                    filterStatus === filter ? "text-white/80" : "text-slate-400"
                  }`}
                >
                  {countByStatus(filter)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-5 py-3 font-semibold">Payment ID</th>
                  <th className="px-5 py-3 font-semibold">Invoice</th>
                  <th className="px-5 py-3 font-semibold">Nominal</th>
                  <th className="px-5 py-3 font-semibold">Tanggal Bayar</th>
                  <th className="px-5 py-3 font-semibold">Metode</th>
                  <th className="px-5 py-3 font-semibold">Bukti</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredPayments.map((payment) => {
                  const config = paymentStatusConfig[payment.verification_status];
                  const invoice = invoices.find(
                    (item) => item.id === payment.invoice_id
                  );

                  return (
                    <tr
                      key={payment.payment_id}
                      className="border-b border-slate-200 last:border-0 hover:bg-brand-50"
                    >
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        PAY-{payment.payment_id.slice(0, 8).toUpperCase()}
                      </td>

                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => {
                            const inv = invoices.find((i) => i.id === payment.invoice_id);
                            navigate(`/client/invoices/${inv?.invoice_number || payment.invoice_id}`);
                          }}
                          className="font-semibold text-brand-600 transition hover:text-brand-700"
                        >
                          {(() => {
                            const inv = invoices.find((i) => i.id === payment.invoice_id);
                            return inv?.invoice_number || payment.invoice_id;
                          })()}
                        </button>

                        <p className="text-xs text-slate-400">{invoice?.items?.length > 0 ? invoice.items.map((i) => i.product_name).join(", ") : ""}</p>
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {formatRupiah(payment.amount)}
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {formatDate(payment.payment_date)}
                      </td>

                      <td className="px-5 py-3.5 text-slate-600">
                        {getPaymentMethodLabel(payment.payment_method)}
                      </td>

                      <td className="px-5 py-3.5">
                        {payment.proof_url ? (
                          <a
                            href={payment.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-100"
                          >
                            <FileText size={13} />
                            Lihat Bukti
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">-</span>
                        )}
                      </td>

                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${config.badge}`}
                        >
                          {config.label}
                        </span>

                        {payment.verification_status === "REJECTED" && (
                          <div className="mt-1.5 max-w-[220px]">
                            <p className="text-xs font-medium text-red-600">
                              {payment.rejection_reason}
                            </p>

                            <button
                              type="button"
                              onClick={() =>
                                openUpload(payment.invoice_id, payment)
                              }
                              className="mt-1.5 flex items-center gap-1 text-xs font-bold text-brand-600 transition hover:text-brand-700"
                            >
                              <Upload size={12} />
                              Re-upload Bukti
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredPayments.length === 0 && (
            <div className="px-5 py-16 text-center">
              <p className="text-sm font-medium text-slate-500">
                Tidak ada pembayaran yang cocok dengan filter Anda.
              </p>

              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setFilterStatus("ALL");
                }}
                className="mt-3 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
              >
                Reset filter
              </button>
            </div>
          )}
        </div>
      </main>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Upload Bukti Pembayaran
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Isi detail pembayaran lalu unggah bukti transfer.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition hover:bg-slate-100"
                aria-label="Tutup"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Pilih Invoice
                </label>

                <select
                  value={form.invoiceId}
                  onChange={(event) => handleInvoiceChange(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-500"
                >
                  <option value="">Pilih invoice...</option>

                  {eligibleInvoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoice_number} · {invoice.items?.length > 0 ? invoice.items.map((i) => i.product_name).join(", ") : ""}
                    </option>
                  ))}
                </select>
              </div>

              {selectedInvoice && (
                <div className="flex items-center justify-between rounded-xl bg-brand-50 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-600">
                    Total tagihan {selectedInvoice.invoice_number}
                  </p>

                  <p className="text-sm font-bold text-brand-700">
                    {formatRupiah(getInvoiceTotal(selectedInvoice))}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Nominal (Rp)
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    value={formatNominal(form.amount)}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        amount: event.target.value.replace(/\D/g, ""),
                      }))
                    }
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold text-slate-600">
                    Tanggal Pembayaran
                  </label>

                  <input
                    type="date"
                    value={form.paymentDate}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        paymentDate: event.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Metode Pembayaran
                </label>

                <select
                  value={form.paymentMethod}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      paymentMethod: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-brand-500"
                >
                  <option value="">Pilih metode...</option>

                  {paymentMethods.map((method) => (
                    <option key={method.value} value={method.value}>
                      {method.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-600">
                  Bukti Pembayaran
                </label>

                {form.proofFile && previewUrl ? (
                  <div className="relative rounded-xl border border-slate-200 bg-white p-3">
                    <img
                      src={previewUrl}
                      alt="Preview bukti"
                      className="mx-auto max-h-[180px] rounded-lg object-contain"
                    />
                    <p className="mt-2 truncate text-center text-xs font-medium text-slate-600">
                      {form.proofName}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          proofFile: null,
                          proofName: "",
                        }))
                      }
                      className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow transition hover:bg-red-600"
                      aria-label="Hapus file"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm font-semibold text-slate-500 transition hover:border-brand-400 hover:text-brand-600">
                    <Upload size={16} />
                    Upload bukti (png atau jpg)

                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setForm((prev) => ({
                          ...prev,
                          proofFile: file,
                          proofName: file?.name ?? "",
                        }));
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  Instruksi Pembayaran
                </p>

                <p className="mt-1.5 text-xs font-medium text-slate-700">
                  {paymentInstructions.banks
                    .map((bank) => `${bank.name} ${bank.accountNumber}`)
                    .join(" · ")}{" "}
                  a.n. {paymentInstructions.banks[0].holderName}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  VA per invoice:{" "}
                  <span className="font-semibold text-slate-700">
                    {selectedInvoice
                      ? getVirtualAccountNumber(selectedInvoice.id)
                      : "—"}
                  </span>{" "}
                  · {paymentInstructions.qris.name} via email
                </p>
              </div>

              {formError && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
                  {formError}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Upload size={16} />
                  Kirim Bukti Pembayaran
                </>
              )}
            </button>

              <p className="mt-3 text-center text-xs text-slate-500">
              Bukti akan diverifikasi oleh admin.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}