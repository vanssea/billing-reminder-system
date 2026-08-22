import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Clock,
  Bell,
  CreditCard,
  MoreHorizontal,
  AlertTriangle,
} from "lucide-react";

import Sidebar from "../../components/layout/Sidebar.jsx";
import Header from "../../components/layout/Header.jsx";
import { getDashboardSummary } from "../../services/dashboardService.js";

const formatPrice = (price) => new Intl.NumberFormat("id-ID").format(price || 0);

function StatusBadge({ status }) {
  const styles = {
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    UNPAID: "bg-amber-50 text-amber-700 border-amber-200",
    SENT: "bg-blue-50 text-blue-700 border-blue-200",
    OVERDUE: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] || "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {status}
    </span>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      {action}
    </div>
  );
}

function donutSegment(cx, cy, rOuter, rInner, start, end) {
  const toRad = (degrees) => (degrees * Math.PI) / 180;
  const largeArc = end - start > 180 ? 1 : 0;

  const outerStart = {
    x: cx + rOuter * Math.cos(toRad(start)),
    y: cy + rOuter * Math.sin(toRad(start)),
  };
  const outerEnd = {
    x: cx + rOuter * Math.cos(toRad(end)),
    y: cy + rOuter * Math.sin(toRad(end)),
  };
  const innerStart = {
    x: cx + rInner * Math.cos(toRad(end)),
    y: cy + rInner * Math.sin(toRad(end)),
  };
  const innerEnd = {
    x: cx + rInner * Math.cos(toRad(start)),
    y: cy + rInner * Math.sin(toRad(start)),
  };

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

function DonutChart({ data, hoveredIndex, onHover, onLeave }) {
  const size = 176;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 82;
  const rInner = 54;
  const gap = 2;

  const total = data.reduce((sum, segment) => sum + segment.count, 0);

  const segments = data.reduce((acc, segment) => {
    if (segment.percent <= 0) return acc;

    const start =
      acc.length === 0
        ? -90
        : acc[acc.length - 1].start + (acc[acc.length - 1].percent / 100) * 360;
    const angle = (segment.percent / 100) * 360;

    acc.push({ ...segment, start, end: start + angle - gap });

    return acc;
  }, []);

  const hovered = hoveredIndex !== null ? segments[hoveredIndex] : null;

  return (
    <div className="relative h-44 w-44 shrink-0">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full"
        onMouseLeave={onLeave}
        role="img"
        aria-label="Invoice status donut chart"
      >
        {segments.map((segment, index) => (
          <path
            key={segment.label}
            d={donutSegment(cx, cy, rOuter, rInner, segment.start, segment.end)}
            fill={segment.color}
            stroke="#ffffff"
            strokeWidth={hoveredIndex === index ? 2.5 : 1}
            opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.35}
            className="cursor-pointer transition-opacity duration-150"
            onMouseEnter={() => onHover(index)}
          />
        ))}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-center shadow-sm">
          <div>
            <p className="text-2xl font-bold text-slate-900">
              {hovered ? hovered.count : total}
            </p>

            <p className="text-xs text-slate-500">
              {hovered ? `${hovered.label} · ${hovered.percent}%` : "Invoices"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hoveredSegment, setHoveredSegment] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setError("");
        const summary = await getDashboardSummary();
        if (!ignore) setData(summary);
      } catch (err) {
        console.error(err);
        if (!ignore) setError("Gagal memuat data dashboard dari server.");
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const stats = data?.stats || {};

  const remindersToday =
    data?.reminders_today || { scheduled: 0, sent: 0, failed: 0 };

  const statCards = [
    {
      title: "Total Invoice",
      value: stats.total_invoices ?? 0,
      description: `Paid ${stats.paid_invoices ?? 0} · Unpaid ${
        stats.unpaid_invoices ?? 0
      } · Overdue ${stats.overdue_invoices ?? 0}`,
      icon: FileText,
    },
    {
      title: "Akan Jatuh Tempo",
      value: stats.unpaid_invoices ?? 0,
      description: "Invoice belum lunas mendekati jatuh tempo",
      icon: Clock,
    },
    {
      title: "Reminder Hari Ini",
      value:
        (remindersToday.scheduled ?? 0) +
        (remindersToday.sent ?? 0) +
        (remindersToday.failed ?? 0),
      description: `${remindersToday.sent ?? 0} terkirim · ${
        remindersToday.scheduled ?? 0
      } terjadwal · ${remindersToday.failed ?? 0} gagal`,
      icon: Bell,
    },
    {
      title: "Perlu Verifikasi",
      value: stats.pending_payments ?? 0,
      description: "Pembayaran menunggu verifikasi",
      icon: CreditCard,
    },
  ];

  const paidCount = stats.paid_invoices ?? 0;
  const unpaidCount = stats.unpaid_invoices ?? 0;
  const overdueCount = stats.overdue_invoices ?? 0;

  const invoiceStatusData = useMemo(() => {
    const total = paidCount + unpaidCount + overdueCount;

    const percent = (count) => (total > 0 ? Math.round((count / total) * 100) : 0);

    return [
      { label: "Paid", count: paidCount, percent: percent(paidCount), color: "#10b981" },
      { label: "Unpaid", count: unpaidCount, percent: percent(unpaidCount), color: "#f59e0b" },
      { label: "Overdue", count: overdueCount, percent: percent(overdueCount), color: "#ef4444" },
    ];
  }, [paidCount, unpaidCount, overdueCount]);

  const donutTotal = invoiceStatusData.reduce((sum, item) => sum + item.count, 0);

  const upcomingInvoices = data?.upcoming_invoices || [];
  const pendingVerifications = data?.pending_verifications || [];

  return (
    <div className="min-h-screen bg-slate-50 pt-16 text-slate-900 md:pl-[280px]">
      <Sidebar role="admin" />
      <Header role="admin" />

      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Banner */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-40 -top-6 h-20 w-20 rounded-full bg-white/10" />

          <div className="relative">
            <p className="text-sm font-medium text-white/80">Admin Panel</p>
            <h1 className="mt-1 text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-white/80">
              Pantau invoice, reminder, dan verifikasi pembayaran dalam satu tempat.
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-red-200 bg-gradient-to-r from-red-50 to-red-100 px-4 py-3.5 shadow-sm">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-500">
              <AlertTriangle size={16} />
            </div>
            <span className="text-sm font-medium text-red-700">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-400 shadow-sm">
            Memuat data dashboard...
          </div>
        ) : (
          <>
            {/* Statistics */}
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {statCards.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.title}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                        <Icon size={20} />
                      </div>

                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreHorizontal size={18} />
                      </button>
                    </div>

                    <p className="mt-5 text-sm font-medium text-slate-500">
                      {stat.title}
                    </p>

                    <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
                      {stat.value.toLocaleString("id-ID")}
                    </p>

                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <span className="text-slate-500">{stat.description}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Invoice Status + Payment Verification */}
            <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* Invoice Status */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader
                  title="Invoice Status"
                  description="Distribusi status invoice saat ini"
                />

                {donutTotal === 0 ? (
                  <div className="flex h-44 items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
                    Belum ada data invoice.
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 sm:flex-row">
                    <DonutChart
                      data={invoiceStatusData}
                      hoveredIndex={hoveredSegment}
                      onHover={setHoveredSegment}
                      onLeave={() => setHoveredSegment(null)}
                    />

                    <div className="w-full space-y-2">
                      {invoiceStatusData.map((status, index) => (
                        <div
                          key={status.label}
                          onMouseEnter={() => setHoveredSegment(index)}
                          onMouseLeave={() => setHoveredSegment(null)}
                          className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition ${
                            hoveredSegment === index ? "bg-slate-50" : ""
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: status.color }}
                            />

                            <span className="text-sm text-slate-600">
                              {status.label}
                            </span>
                          </div>

                          <span className="text-sm font-semibold text-slate-900">
                            {status.count.toLocaleString("id-ID")}
                            <span className="ml-1 text-xs font-medium text-slate-500">
                              ({status.percent}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Verification */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <SectionHeader
                  title="Payment Verification"
                  description="Pembayaran yang menunggu verifikasi"
                  action={
                    <Link
                      to="/admin/payments"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Review Payments
                    </Link>
                  }
                />

                <div className="mb-5 rounded-xl bg-amber-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                      <CreditCard size={19} />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        {stats.pending_payments ?? pendingVerifications.length}{" "}
                        pembayaran menunggu verifikasi
                      </p>

                      <p className="mt-0.5 text-xs text-amber-700">
                        Tinjau bukti pembayaran yang dikirim client.
                      </p>
                    </div>
                  </div>
                </div>

                {pendingVerifications.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                    Tidak ada pembayaran yang menunggu verifikasi.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingVerifications.map((payment, index) => (
                      <div
                        key={`${payment.client}-${index}`}
                        className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {payment.client}
                          </p>

                          <p className="text-xs text-slate-500">Menunggu verifikasi</p>
                        </div>

                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">
                            Rp {formatPrice(payment.amount)}
                          </p>

                          <span className="text-xs text-amber-600">Pending</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Due Dates */}
            <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="p-6 pb-4">
                <SectionHeader
                  title="Invoice Yang Akan Jatuh Tempo"
                  description="Invoice yang mendekati tenggat pembayaran."
                  action={
                    <Link
                      to="/admin/invoices"
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Lihat Semua
                    </Link>
                  }
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px] text-left text-sm">
                  <thead className="border-y border-slate-100 bg-slate-50">
                    <tr>
                      {[
                        "Client",
                        "Invoice ID",
                        "Due Date",
                        "Amount",
                        "Status",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="px-6 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {upcomingInvoices.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-6 py-10 text-center text-slate-400"
                        >
                          Tidak ada invoice yang akan jatuh tempo.
                        </td>
                      </tr>
                    ) : (
                      upcomingInvoices.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="hover:bg-slate-50"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {invoice.client}
                          </td>

                          <td className="px-6 py-4 text-slate-600">{invoice.id}</td>

                          <td className="px-6 py-4 text-slate-600">
                            {invoice.due_date}
                          </td>

                          <td className="px-6 py-4 font-medium text-slate-900">
                            Rp {formatPrice(invoice.amount)}
                          </td>

                          <td className="px-6 py-4">
                            <StatusBadge status={invoice.status} />
                          </td>

                          <td className="px-6 py-4">
                            <Link
                              to="/admin/invoices"
                              className="font-medium text-indigo-600 hover:text-indigo-700"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Reminder Hari Ini */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <SectionHeader
                title="Reminder Hari Ini"
                description="Aktivitas pengingat otomatis hari ini"
              />

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-blue-600">Scheduled</p>
                  <p className="mt-1 text-xl font-bold text-blue-800">
                    {(remindersToday.scheduled ?? 0).toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs text-emerald-600">Sent</p>
                  <p className="mt-1 text-xl font-bold text-emerald-800">
                    {(remindersToday.sent ?? 0).toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="rounded-xl bg-red-50 p-4">
                  <p className="text-xs text-red-600">Failed</p>
                  <p className="mt-1 text-xl font-bold text-red-800">
                    {(remindersToday.failed ?? 0).toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
