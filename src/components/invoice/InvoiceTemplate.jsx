import { Globe, Mail, Phone, Zap } from "lucide-react";
import { formatIDR } from "../../utils/format";

/* =========================================================
   HELPERS
========================================================= */

const calcSubtotal = (items) =>
  items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);

const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "-";

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function InvoiceTemplate({ invoice = {} }) {
  const {
    invoice_number,
    invoice_date,
    due_date,
    tax: taxData,
    discount: discountData,
    total: totalData,
    items: itemsData,
    company = {},
    client = {},
    payment = {},
  } = invoice;

  const items = Array.isArray(itemsData) ? itemsData : [];

  const subtotal = Number.isFinite(Number(invoice.subtotal))
    ? Number(invoice.subtotal)
    : calcSubtotal(items);
  const tax = Number(taxData) || 0;
  const discount = Number(discountData) || 0;
  const total = Number.isFinite(Number(totalData))
    ? Number(totalData)
    : subtotal - discount + tax;

  const invoiceNumber = invoice_number || "-";
  const invoiceDate = formatDate(invoice_date);
  const invoiceDueDate = formatDate(due_date);

  const cmp = {
    name: company.name || "HostFlow",
    tagline: company.tagline || "Web Hosting & Cloud Services",
    email: company.email || "billing@hostflow.com",
    phone: company.phone || "08123456789",
    website: company.website || "hostflow.com",
    address: company.address || "surabaya, Indonesia",
  };

  const cl = {
    name: client.pic_name || "",
    company: client.company_name || "",
    email: client.email || "",
    address: client.address || "",
  };

  const pm = {
    bankName: payment.bankName || "Bank Central Asia (BCA)",
    accountNumber: payment.accountNumber || "1234567890",
    accountHolder: payment.accountHolder || "PT HostFlow Indonesia",
  };

  return (
    <div className="min-h-screen bg-[#f0f0f5] print:bg-white">

      {/* Print styles: A4 paper, hide dashboard chrome, force colors */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          html, body { background: #ffffff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          aside.fixed, header.fixed { display: none !important; }
        }
      `}</style>

      <main className="mx-auto w-full max-w-[794px] px-4 py-8 print:max-w-none print:px-0 print:py-0">

        {/* ===================================================
            INVOICE — A4 PAPER
        =================================================== */}

        <div className="min-w-[680px] bg-white shadow-[0_2px_24px_rgba(25,28,30,0.10)] print:min-w-0 print:shadow-none">

          {/* ── Main Content ── */}
          <div className="min-w-0">

            {/* Header: company left / invoice info right */}
            <div className="flex flex-col gap-8 px-10 pb-8 pt-10 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-[#2563eb] to-[#60a5fa] text-white">
                  <Zap size={24} fill="currentColor" strokeWidth={0} />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold leading-tight text-[#222222]">{cmp.name}</p>
                  <p className="text-xs text-[#666666]">{cmp.tagline}</p>
                  <p className="mt-2 text-xs text-[#666666]">{cmp.address}</p>
                  <div className="mt-1.5 space-y-1 text-xs text-[#555555]">
                    <p className="flex items-center gap-1.5">
                      <Mail size={12} className="shrink-0 text-[#5b44f3]" />
                      {cmp.email}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Phone size={12} className="shrink-0 text-[#5b44f3]" />
                      {cmp.phone}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <Globe size={12} className="shrink-0 text-[#5b44f3]" />
                      {cmp.website}
                    </p>
                  </div>
                </div>
              </div>

              <div className="sm:text-right">
                <h1 className="text-[42px] font-extrabold uppercase leading-none tracking-[0.14em] text-[#3525cd]">
                  Invoice
                </h1>
                <p className="mt-2 text-sm font-semibold text-[#222222]">#{invoiceNumber}</p>

                <div className="mt-4 border-t border-[#D9D9D9] pt-3 text-xs">
                  <div className="flex items-center justify-end gap-4">
                    <span className="text-[#666666]">Date</span>
                    <span className="min-w-[130px] text-right font-semibold text-[#222222]">
                      {invoiceDate}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center justify-end gap-4">
                    <span className="text-[#666666]">Due</span>
                    <span className="min-w-[130px] text-right font-semibold text-[#222222]">
                      {invoiceDueDate}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="mx-10 border-t-2 border-[#3525cd]" />

            {/* Invoice To / Payment */}
            <div className="grid grid-cols-1 gap-10 px-10 py-8 sm:grid-cols-[1fr_200px]">
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#3525cd]">
                  Invoice To
                </p>

                <div className="text-sm">
                  <p className="text-base font-bold text-[#222222]">
                    {cl.company}
                  </p>

                  <p className="mt-1 text-xs text-[#555555]">
                    {cl.name}
                  </p>

                  <p className="mt-2 text-xs text-[#555555]">
                    {cl.email}
                  </p>

                  <p className="mt-1 max-w-[300px] text-xs leading-relaxed text-[#555555]">
                    {cl.address}
                  </p>
                </div>
              </div>

              <div className="translate-x-[15px]">
                <p className="mb-4 text-xs font-bold uppercase tracking-[0.18em] text-[#3525cd]">
                  Payment Details
                </p>

                <div className="text-sm">
                  <p className="text-base font-bold text-[#222222]">
                    {pm.bankName}
                  </p>

                  <div className="mt-2 space-y-1.5 text-xs text-[#555555]">
                    <p>
                      <span className="font-semibold text-[#444444]">
                        Account Name:
                      </span>{" "}
                      {pm.accountHolder}
                    </p>

                    <p>
                      <span className="font-semibold text-[#444444]">
                        Account Number:
                      </span>{" "}
                      {pm.accountNumber}
                    </p>

                    <p>
                      <span className="font-semibold text-[#444444]">
                        Payment Reference:
                      </span>{" "}
                      {pm.paymentReference || invoiceNumber}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Item Table */}
            <div className="px-10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#3525cd] text-white">
                    <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider">
                      Item Description
                    </th>
                    <th className="w-24 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider">
                      Price
                    </th>
                    <th className="w-16 px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider">
                      Qty
                    </th>
                    <th className="w-28 px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={item.id || i} className="border-b border-[#D9D9D9]">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[#222222]">{item.product_name || "-"}</p>
                        {item.description && (
                          <p className="mt-0.5 text-xs text-[#666666]">{item.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-[#222222]">{formatIDR(item.price)}</td>
                      <td className="px-4 py-4 text-center text-[#222222]">{item.quantity}</td>
                      <td className="px-4 py-4 text-right font-semibold text-[#222222]">
                        {formatIDR((Number(item.quantity) || 0) * (Number(item.price) || 0))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="flex justify-end px-10 pb-8 pt-6">
              <div className="w-full max-w-[280px] space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="uppercase text-xs font-semibold text-[#666666]">Subtotal</span>
                  <span className="font-medium text-[#222222]">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="uppercase text-xs font-semibold text-[#666666]">Tax</span>
                  <span className="font-medium text-[#222222]">{formatIDR(tax)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="uppercase text-xs font-semibold text-[#666666]">Discount</span>
                  <span className="font-medium text-[#222222]">
                    {discount > 0 ? `- ${formatIDR(discount)}` : formatIDR(0)}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-[#3525cd] px-4 py-3 text-white">
                  <span className="text-xs font-bold uppercase tracking-wider">Total</span>
                  <span className="text-lg font-extrabold">{formatIDR(total)}</span>
                </div>
              </div>
            </div>

            {/* Terms & Signature */}
            <div className="grid grid-cols-1 gap-10 px-10 py-8 sm:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#3525cd]">
                  Terms &amp; Conditions
                </p>
                <ol className="list-decimal space-y-1.5 pl-5 text-[13px] leading-relaxed text-[#555555]">
                  <li>Pembayaran dilakukan sebelum tanggal jatuh tempo.</li>
                  <li>Invoice ini berlaku sesuai jumlah yang tertera.</li>
                  <li>Keterlambatan pembayaran dapat dikenakan biaya tambahan.</li>
                </ol>
              </div>

              <div className="mt-12 sm:text-right">
                <p className="mb-4 text-[13px] tracking-[0.3em] text-[#999999]">Authorized Signature</p>
                <div className="w-[240px] border-t border-[#222222] pt-2 sm:ml-auto">
                  <p className="text-right text-sm font-semibold text-[#222222]">{cmp.name}</p>
                  <p className="text-right text-xs text-[#666666]">Billing Department</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-[#D9D9D9] px-10 py-5 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#3525cd]">
                {cmp.name}
              </p>
              <p className="mt-1 text-[11px] text-[#666666]">Thank you for your business.</p>
            </div>
          </div>
        </div>

        {/* Bottom spacer — hidden on print */}
        <div className="h-12 print:hidden" />
      </main>
    </div>
  );
}