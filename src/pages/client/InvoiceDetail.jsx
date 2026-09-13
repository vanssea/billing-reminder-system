import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Download,
  FileText,
  Landmark,
  Loader2,
  QrCode,
  ReceiptText,
  Upload,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getClientInvoiceById } from "../../services/invoiceApi";
import { formatDate, formatRupiah } from "../../utils/format";
import InvoiceTemplate from "../../components/invoice/InvoiceTemplate";

const invoiceStatusConfig = {
  DRAFT: { label: "Draft", badge: "bg-slate-100 text-slate-600" },
  SENT: { label: "Belum Lunas", badge: "bg-amber-50 text-amber-700" },
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

function getInvoiceTotal(invoice) {
  if (invoice.total != null) return invoice.total;
  return (invoice.subtotal || 0) + (invoice.tax || 0);
}

function InfoRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <p className="text-sm text-slate-500">{label}</p>

      <p
        className={`text-right text-sm ${
          highlight ? "font-bold text-slate-900" : "font-semibold text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { client, accessToken, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const invoiceRef = useRef(null);

  useEffect(() => {
    if (authLoading || !accessToken || !id || !client) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getClientInvoiceById(id, accessToken);
        setData(result);
      } catch (err) {
        setError("Gagal memuat detail invoice");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client, accessToken, authLoading, id]);

  useEffect(() => {
    if (location.state?.print && data?.invoice) {
      const timer = setTimeout(() => window.print(), 300);
      return () => clearTimeout(timer);
    }
  }, [location.state, data]);

  const handleDownloadPDF = useCallback(async () => {
    if (!invoiceRef.current) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas-pro")).default;
      const jsPDF = (await import("jspdf")).default;
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const pdf = new jsPDF("p", "mm", "a4");
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      pdf.save(`${invoice?.invoice_number || "invoice"}.pdf`);
    } catch (err) {
      setError("Gagal mengunduh PDF: " + err.message);
    } finally {
      setDownloading(false);
    }
  }, [data]);

  // Dukungan tombol "Download PDF" dari halaman daftar (MyInvoices): saat
  // diarahkan ke sini dengan state.pdf, unduh PDF begitu data tersedia.
  useEffect(() => {
    if (location.state?.pdf && data?.invoice && !downloading) {
      handleDownloadPDF();
    }
  }, [location.state, data, downloading, handleDownloadPDF]);

  // Akun baru belum punya baris clients: jangan spinner selamanya,
  // tampilkan arahan lengkapi profil.
  const needsProfile = !authLoading && !!accessToken && !!id && !client;

  if (loading && !needsProfile) {
    return (
      <div>
        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <p className="py-20 text-center text-sm font-medium text-slate-500">Memuat detail invoice...</p>
        </main>
      </div>
    );
  }

  if (error || !data?.invoice) {
    return (
      <div className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-16 text-center shadow-sm">
          <p className="text-sm font-medium text-slate-500">
            Invoice tidak ditemukan.
          </p>

          <button
            type="button"
            onClick={() => navigate("/client/invoices")}
            className="mt-3 text-sm font-semibold text-brand-600 transition hover:text-brand-700"
          >
            Kembali ke daftar invoice
          </button>
        </div>
      </div>
    );
  }

  const invoice = data.invoice;
  const timeline = data.timeline || [];
  const config = invoiceStatusConfig[invoice.status];
  const total = getInvoiceTotal(invoice);
  const activeIndex = timeline.findIndex((step) => !step.done);
  const payment = invoice.payment || null;
  const paymentConfig = payment
    ? paymentStatusConfig[payment.verification_status]
    : null;
  const isPayable =
    invoice.status === "UNPAID" || invoice.status === "OVERDUE";
  const showInstructions = isPayable && !payment;

  return (
    <div>
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            type="button"
            onClick={() => navigate("/client/invoices")}
            className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-brand-600"
          >
            <ArrowLeft size={16} />
            Kembali ke daftar
          </button>

          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110 disabled:opacity-50"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            Download PDF
          </button>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-slate-900">{invoice.invoice_number}</h1>

          <span
            className={`inline-flex rounded-md px-2.5 py-1 text-xs font-bold ${config.badge}`}
          >
            {config.label}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="inline-flex rounded-xl bg-brand-600/10 p-2.5 text-brand-600">
                <ReceiptText size={20} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900">
                  Informasi Invoice
                </h2>

                <p className="text-xs text-slate-500">
                  Detail tagihan untuk {invoice.client?.company_name || invoice.client_id}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <InfoRow label="Nomor Invoice" value={invoice.invoice_number} />

              <InfoRow label="Tanggal Invoice" value={formatDate(invoice.invoice_date)} />

              <InfoRow label="Jatuh Tempo" value={formatDate(invoice.due_date)} />

              <InfoRow label="Client" value={invoice.client?.company_name || invoice.client_id} />

              <InfoRow label="Produk / Layanan" value={invoice.items?.length > 0 ? invoice.items.map((i) => `${i.product_name}${i.billing_cycle === "yearly" ? " (12 Bulan)" : i.billing_cycle === "monthly" ? " (1 Bulan)" : ""}`).join(", ") : "—"} />

              <div className="my-3 border-t border-slate-100" />

              <InfoRow label="Subtotal" value={formatRupiah(invoice.subtotal)} />

              <InfoRow label="Pajak (PPN 10%)" value={formatRupiah(invoice.tax)} />

              <InfoRow
                label="Diskon"
                value={invoice.discount ? `- ${formatRupiah(invoice.discount)}` : "—"}
              />

              <div className="my-3 border-t border-slate-100" />

              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-bold text-slate-900">Total</p>

                <p className="text-lg font-bold text-brand-600">
                  {formatRupiah(total)}
                </p>
              </div>
            </div>
            </div>

            {showInstructions && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                  <div className="inline-flex rounded-xl bg-brand-600/10 p-2.5 text-brand-600">
                    <Landmark size={20} />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">
                      Instruksi Pembayaran
                    </h2>

                    <p className="text-xs text-slate-500">
                      Transfer sesuai total tagihan, lalu unggah bukti
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-brand-50 px-4 py-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-600">
                      Total yang harus dibayar
                    </p>

                    <p className="text-base font-bold text-brand-700">
                      {formatRupiah(total)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  {paymentInstructions.banks.map((bank) => (
                    <div
                      key={bank.name}
                      className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-2.5"
                    >
                      <p className="text-sm font-semibold text-slate-900">
                        {bank.name} · {bank.holderName}
                      </p>

                      <p className="text-sm font-bold text-slate-900">
                        {bank.accountNumber}
                      </p>
                    </div>
                  ))}

                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {paymentInstructions.virtualAccount.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {paymentInstructions.virtualAccount.holderName} (per invoice)
                      </p>
                    </div>

                    <p className="text-sm font-bold text-slate-900">
                      {getVirtualAccountNumber(invoice.id)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-4 py-2.5">
                    <QrCode size={16} className="shrink-0 text-brand-600" />

                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {paymentInstructions.qris.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {paymentInstructions.qris.note}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    navigate(`/client/payments?invoice=${invoice.invoice_number}`)
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
                >
                  <Upload size={16} />
                  Upload Bukti Pembayaran
                </button>

                <p className="mt-3 text-center text-xs text-slate-400">
                  Butuh bantuan? Hubungi support@hostflow.id atau 0812-3456-7890.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
              <div className="inline-flex rounded-xl bg-brand-600/10 p-2.5 text-brand-600">
                <Landmark size={20} />
              </div>

              <div>
                <h2 className="text-sm font-semibold text-slate-900">Pembayaran</h2>

                <p className="text-xs text-slate-500">Status pembayaran invoice</p>
              </div>
            </div>

            {paymentConfig && payment ? (
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">Status Pembayaran</p>

                  <span
                    className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${paymentConfig.badge}`}
                  >
                    {paymentConfig.label}
                  </span>
                </div>

                <InfoRow
                  label="Nominal Pembayaran"
                  value={formatRupiah(payment.amount)}
                />

                <InfoRow
                  label="Tanggal Pembayaran"
                  value={formatDate(payment.payment_date)}
                />

                <InfoRow label="Metode Pembayaran" value={payment.payment_method} />

                <div className="flex items-center justify-between gap-4 py-2.5">
                  <p className="text-sm text-slate-500">Bukti Pembayaran</p>

                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                    <FileText size={14} className="text-brand-600" />
                    {payment.proof_url}
                  </span>
                </div>

                {payment.verification_status === "APPROVED" && (
                  <>
                    <InfoRow
                      label="Diverifikasi oleh"
                      value={payment.verified_by ?? "—"}
                    />

                    <InfoRow
                      label="Diverifikasi pada"
                      value={formatDate(payment.verified_at)}
                    />
                  </>
                )}

                {payment.verification_status === "REJECTED" && (
                  <div className="mt-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs font-bold text-red-700">
                      Alasan Penolakan
                    </p>

                    <p className="mt-1 text-xs font-medium text-red-600">
                      {payment.rejection_reason}
                    </p>

                    <p className="mt-2 text-[11px] text-red-500">
                      Silakan unggah ulang bukti melalui halaman Pembayaran.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">
                <p className="text-sm font-semibold text-slate-500">
                  Belum ada pembayaran
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Unggah bukti transfer sebelum jatuh tempo.
                </p>
              </div>
            )}

            {isPayable && !payment && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/client/payments?invoice=${invoice.id}`)
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py_2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
              >
                <CreditCard size={16} />
                Bayar Sekarang
              </button>
            )}

            {payment?.verification_status === "REJECTED" && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/client/payments?invoice=${invoice.id}`)
                }
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-500 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-600/30 transition hover:brightness-110"
              >
                <Upload size={16} />
                Re-upload Bukti
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Timeline</h2>

          <p className="mt-0.5 text-xs text-slate-500">
            Riwayat proses invoice ini
          </p>

          <div className="mt-5">
            {timeline.map((step, index) => {
              const isDone = step.done;
              const isActive = index === activeIndex;

              return (
                <div key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
                  {index < timeline.length - 1 && (
                    <span
                      className={`absolute left-[13px] top-7 h-full w-px ${
                        isDone ? "bg-green-300" : "bg-slate-200"
                      }`}
                    />
                  )}

                  <span
                    className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      isDone
                        ? "bg-green-100 text-green-600"
                        : isActive
                          ? "bg-brand-100 text-brand-600"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isDone ? (
                      <Check size={14} strokeWidth={3} />
                    ) : (
                      <span className="h-2 w-2 rounded-full bg-current" />
                    )}
                  </span>

                  <div className="flex flex-1 items-center justify-between gap-3">
                    <div>
                      <p
                        className={`text-sm font-semibold ${
                          isDone
                            ? "text-slate-900"
                            : isActive
                              ? "text-brand-700"
                              : "text-slate-400"
                        }`}
                      >
                        {step.label}
                      </p>

                      <p className="text-xs text-slate-400">
                        {formatDate(step.date)}
                      </p>
                    </div>

                    <span
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${
                        isDone
                          ? "bg-green-50 text-green-600"
                          : isActive
                            ? "bg-brand-50 text-brand-600"
                            : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {isDone ? "Selesai" : isActive ? "Berjalan" : "Menunggu"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Hidden InvoiceTemplate for PDF capture */}
      <div
        ref={invoiceRef}
        style={{
          position: "fixed",
          left: "-9999px",
          top: 0,
          width: "794px",
          zIndex: -1,
          pointerEvents: "none",
        }}
      >
        <InvoiceTemplate invoice={invoice} />
      </div>
    </div>
  );
}