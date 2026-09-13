import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import Header from "../../components/layout/Header";
import { getSuperAdminDashboard } from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  ShieldCheck,
  Wallet,
  FileText,
  AlertCircle,
  Bell,
  Clock,
  MoreHorizontal,
  CheckCircle2,
  CreditCard,
  Activity,
} from "lucide-react";

const formatRupiah = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);

// Formatter singkat untuk sumbu Y chart: 1Rb / 1Jt / 1M.
// Tooltip tetap memakai formatRupiah penuh.
const formatAxisValue = (value) => {
  const absValue = Math.abs(value || 0);
  const trim = (num) => {
    const fixed = num.toFixed(1);
    return fixed.endsWith(".0") ? fixed.slice(0, -2) : fixed;
  };

  if (absValue >= 1_000_000_000) return `${trim(value / 1_000_000_000)}M`;
  if (absValue >= 1_000_000) return `${trim(value / 1_000_000)}Jt`;
  if (absValue >= 1_000) return `${trim(value / 1_000)}Rb`;
  return String(Math.round(value));
};

// Filter periode revenue: key internal harus sama dengan key yang
// dikirim backend (revenue_periods[].key), label hanya untuk UI.
const REVENUE_PERIODS = [
  { key: "7 Days", label: "7 Hari" },
  { key: "1 Month", label: "1 Bulan" },
  { key: "1 Year", label: "1 Tahun" },
];

const timeAgo = (iso) => {
  if (!iso) return "-";

  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Baru saja";
  if (minutes < 60) return `${minutes} menit lalu`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;

  const days = Math.floor(hours / 24);
  if (days === 1) return "Kemarin";
  if (days < 7) return `${days} hari lalu`;

  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Warna donut mengikuti aturan warna status yang sama dengan badge.
const STATUS_COLORS = {
  PAID: "#10b981",
  APPROVED: "#10b981",
  SENT: "#3b82f6",
  SCHEDULED: "#3b82f6",
  UNPAID: "#f59e0b",
  PENDING: "#f59e0b",
  READY: "#6366f1",
  OVERDUE: "#ef4444",
  FAILED: "#ef4444",
  REJECTED: "#ef4444",
  CANCELLED: "#94a3b8",
  SKIPPED: "#94a3b8",
};

// Label UI untuk status internal uppercase dari database/backend.
const STATUS_LABELS = {
  PAID: "Paid",
  UNPAID: "Unpaid",
  SENT: "Sent",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
  DRAFT: "Draft",
  APPROVED: "Approved",
  PENDING: "Pending",
  REJECTED: "Rejected",
  SCHEDULED: "Scheduled",
  READY: "Ready",
  FAILED: "Failed",
  SKIPPED: "Skipped",
};

function StatusBadge({ status }) {
  const normalized = String(status || "").toUpperCase();

  const styles = {
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
    SENT: "bg-blue-50 text-blue-700 border-blue-200",
    SCHEDULED: "bg-blue-50 text-blue-700 border-blue-200",
    UNPAID: "bg-amber-50 text-amber-700 border-amber-200",
    PENDING: "bg-amber-50 text-amber-700 border-amber-200",
    READY: "bg-indigo-50 text-indigo-700 border-indigo-200",
    OVERDUE: "bg-red-50 text-red-700 border-red-200",
    FAILED: "bg-red-50 text-red-700 border-red-200",
    REJECTED: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
    SKIPPED: "bg-slate-100 text-slate-600 border-slate-200",
    DRAFT: "bg-slate-100 text-slate-600 border-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[normalized] || "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {STATUS_LABELS[normalized] || normalized}
    </span>
  );
}

function SectionHeader({ title, description, action, onAction }) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>

        {description && (
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={onAction}
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          {action}
        </button>
      )}
    </div>
  );
}

function RevenueChart({ data }) {
  const [hoverIndex, setHoverIndex] = useState(null);

  const width = 800;
  const height = 260;
  const padLeft = 44;
  const padRight = 12;
  const padTop = 24;
  const padBottom = 30;

  const values = data.values.length > 0 ? data.values : [0];
  const labels =
    data.labels.length === values.length
      ? data.labels
      : values.map((_, index) => index + 1);

  const maxValue = Math.max(...values);
  const niceMax = Math.max(10, Math.ceil((maxValue * 1.15) / 10) * 10);
  const n = values.length;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const points = values.map((value, index) => {
    const x = n === 1 ? padLeft + innerW / 2 : padLeft + (index * innerW) / (n - 1);
    const y = padTop + innerH - (value / niceMax) * innerH;

    return { x, y, value };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[n - 1].x.toFixed(1)} ${padTop + innerH} L ${points[0].x.toFixed(1)} ${padTop + innerH} Z`;

  const labelStep = Math.max(1, Math.ceil(n / 8));

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((fraction) => {
    const y = padTop + innerH - fraction * innerH;
    const value = Math.round(niceMax * fraction);

    return { y, value, fraction };
  });

  const handleMouseMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * width;

    let nearest = 0;
    let nearestDistance = Infinity;

    points.forEach((point, index) => {
      const distance = Math.abs(point.x - x);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = index;
      }
    });

    setHoverIndex(nearest);
  };

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  return (
    <div
      key={data.key}
      className="relative w-full"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverIndex(null)}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label={`Revenue chart for ${data.key}`}
      >
        <defs>
          <linearGradient id="revenueArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
          </linearGradient>
        </defs>

        {gridLines.map((line) => (
          <g key={line.fraction}>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={line.y}
              y2={line.y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            <text
              x={padLeft - 8}
              y={line.y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#94a3b8"
            >
              {formatAxisValue(line.value)}
            </text>
          </g>
        ))}

        <path d={areaPath} fill="url(#revenueArea)" />

        <path
          d={linePath}
          fill="none"
          stroke="#4f46e5"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {points.map((point, index) =>
          index % labelStep === 0 || index === n - 1 ? (
            <g key={`label-${index}`}>
              <line
                x1={point.x}
                x2={point.x}
                y1={padTop + innerH}
                y2={padTop + innerH + 5}
                stroke="#cbd5e1"
                strokeWidth="1"
              />

              <text
                x={point.x}
                y={height - 12}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
              >
                {labels[index]}
              </text>
            </g>
          ) : null
        )}

        {hoveredPoint && (
          <g>
            <line
              x1={hoveredPoint.x}
              x2={hoveredPoint.x}
              y1={padTop}
              y2={padTop + innerH}
              stroke="#c7d2fe"
              strokeWidth="1"
              strokeDasharray="4 4"
            />

            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="6"
              fill="#4f46e5"
              stroke="#ffffff"
              strokeWidth="2"
            />
          </g>
        )}

        {points.map((point, index) => (
          <circle
            key={`dot-${index}`}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="#ffffff"
            stroke="#4f46e5"
            strokeWidth="2.5"
          />
        ))}
      </svg>

      {hoveredPoint && (
        <div
          className="pointer-events-none absolute z-10 rounded-lg bg-slate-900 px-2.5 py-1.5 text-center shadow-md"
          style={{
            left: `${(hoveredPoint.x / width) * 100}%`,
            top: `${(hoveredPoint.y / height) * 100}%`,
            transform: "translate(-50%, calc(-100% - 10px))",
          }}
        >
          <p className="text-[10px] font-medium text-slate-400">
            {labels[hoverIndex]}
          </p>

          <p className="text-xs font-bold text-white">
            {formatRupiah(hoveredPoint.value)}
          </p>
        </div>
      )}
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
            strokeWidth={hoveredIndex === index ? 3 : 1}
            opacity={hoveredIndex === null || hoveredIndex === index ? 1 : 0.25}
            className="cursor-pointer transition-opacity duration-150"
            style={{
              transformOrigin: `${cx}px ${cy}px`,
              transform:
                hoveredIndex === index ? "scale(1.06)" : "scale(1)",
              transition: "transform 150ms ease, opacity 150ms ease",
            }}
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

function InvoiceStatusCard({ invoiceStatus }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = invoiceStatus.reduce((sum, item) => sum + item.count, 0);

  const donutData = invoiceStatus.map((item) => ({
    label: item.status,
    count: item.count,
    percent: total > 0 ? Math.round((item.count / total) * 100) : 0,
    color: STATUS_COLORS[item.status] || "#94a3b8",
  }));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <SectionHeader
        title="Invoice Status"
        description="Current invoice distribution"
      />

      {donutData.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-400">
          Belum ada data invoice.
        </p>
      ) : (
        <div className="flex flex-col items-center gap-6 sm:flex-row">
          <DonutChart
            data={donutData}
            hoveredIndex={hoveredIndex}
            onHover={setHoveredIndex}
            onLeave={() => setHoveredIndex(null)}
          />

          <div className="w-full space-y-2">
            {donutData.map((status, index) => (
              <div
                key={status.label}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className={`flex cursor-pointer items-center justify-between rounded-lg px-2 py-1.5 transition ${
                  hoveredIndex === index
                    ? "bg-slate-100 ring-1 ring-slate-200"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition-transform duration-150 ${
                      hoveredIndex === index ? "scale-150" : "scale-100"
                    }`}
                    style={{ backgroundColor: status.color }}
                  />

                  <span
                    className={`text-sm transition-colors ${
                      hoveredIndex === index
                        ? "font-semibold text-slate-900"
                        : "text-slate-600"
                    }`}
                  >
                    {status.label}
                  </span>
                </div>

                <span className="text-sm font-semibold text-slate-900">
                  {status.count}
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
  );
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [activePeriod, setActivePeriod] = useState("7 Days");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        const result = await getSuperAdminDashboard(accessToken);

        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Gagal memuat data dashboard");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // Tidak ada fallback diam-diam: jika backend tidak mengirim data untuk
  // periode yang dipilih, tampilkan empty state (bukan periode lain).
  const activeRevenue = useMemo(() => {
    if (!data?.revenue_periods?.length) {
      return null;
    }

    return (
      data.revenue_periods.find((period) => period.key === activePeriod) ||
      null
    );
  }, [data, activePeriod]);

  const scheduledRemindersList = useMemo(() => {
    if (!data?.upcoming_invoices) return [];

    return data.upcoming_invoices.filter(
      (invoice) => invoice.reminder && invoice.reminder !== "-"
    );
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 text-slate-900 app-content">
        <Sidebar />
        <Header role="superadmin" />

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />

              <p className="mt-4 text-sm font-medium text-slate-500">
                Memuat dashboard superadmin...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-50 pt-16 text-slate-900 app-content">
        <Sidebar />
        <Header role="superadmin" />

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="rounded-2xl border border-red-100 bg-red-50 p-8 text-center">
              <AlertCircle size={32} className="mx-auto text-red-500" />

              <p className="mt-3 font-semibold text-red-700">
                Gagal memuat dashboard
              </p>

              <p className="mt-1 text-sm text-red-600">{error}</p>

              <p className="mt-3 text-xs text-red-500">
                Pastikan backend berjalan di {import.meta.env.VITE_API_URL}
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const { stats, reminders_today } = data;

  const statCards = [
    {
      title: "Total Clients",
      value: String(stats.total_clients ?? 0),
      description: "Terdaftar keseluruhan",
      icon: Users,
    },
    {
      title: "Total Admins",
      value: String(stats.total_admins ?? 0),
      description: "Admin terdaftar",
      icon: ShieldCheck,
    },
    {
      // total_revenue = total nilai invoice aktif (PAID+UNPAID+OVERDUE+SENT),
      // bukan akumulasi payment APPROVED, jadi labelnya Total Invoiced.
      title: "Total Invoiced",
      value: formatRupiah(stats.total_revenue),
      description: `Terbayar ${formatRupiah(stats.paid_revenue)}`,
      icon: Wallet,
    },
    {
      title: "Paid Invoices",
      value: String(stats.paid_invoices ?? 0),
      description: `${stats.cancelled_invoices ?? 0} invoice dibatalkan`,
      icon: CheckCircle2,
    },
    {
      title: "Unpaid Invoices",
      value: String(stats.unpaid_invoices ?? 0),
      description: `${formatRupiah(stats.outstanding_amount)} outstanding`,
      icon: FileText,
    },
    {
      title: "Overdue Invoices",
      value: String(stats.overdue_invoices ?? 0),
      description: `${formatRupiah(stats.overdue_amount)} tertunggak`,
      icon: AlertCircle,
    },
    {
      // reminders_today = seluruh reminder dengan jadwal (scheduled_at) hari ini,
      // mencakup yang masih PENDING, sudah SENT, dan FAILED.
      title: "Reminder Activity",
      value: String(
        (reminders_today.scheduled ?? 0) +
          (reminders_today.sent ?? 0) +
          (reminders_today.failed ?? 0)
      ),
      description: `${reminders_today.sent ?? 0} sent · ${
        reminders_today.scheduled ?? 0
      } scheduled · ${reminders_today.failed ?? 0} failed today`,
      icon: Bell,
    },
    {
      title: "Pending Payments",
      value: String(stats.pending_payments ?? 0),
      description: "Waiting for verification",
      icon: Clock,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-16 text-slate-900 app-content">
      <Sidebar />
      <Header role="superadmin" />

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="relative mb-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#3525cd] to-[#5b44f3] p-6 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 right-20 h-28 w-28 rounded-full bg-white/10" />
          <div className="absolute right-40 -top-6 h-20 w-20 rounded-full bg-white/10" />

          <div className="relative">
            <p className="text-sm font-medium text-white/80">Super Admin Panel</p>
            <h1 className="mt-1 text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-white/80">
              Overview of your hosting business and billing activity.
            </p>
          </div>
        </div>

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
                  {stat.value}
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  {stat.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Revenue */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <SectionHeader
              title="Revenue Overview"
              description="Track your hosting revenue performance."
            />

            <div className="flex flex-wrap gap-2">
              {REVENUE_PERIODS.map((period) => (
                <button
                  key={period.key}
                  type="button"
                  onClick={() => setActivePeriod(period.key)}
                  className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
                    activePeriod === period.key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Total Invoiced</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {formatRupiah(stats.total_revenue)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Paid Revenue</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">
                {formatRupiah(stats.paid_revenue)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Outstanding</p>
              <p className="mt-1 text-lg font-bold text-amber-600">
                {formatRupiah(stats.outstanding_amount)}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Overdue</p>
              <p className="mt-1 text-lg font-bold text-red-600">
                {formatRupiah(stats.overdue_amount)}
              </p>
            </div>
          </div>

          {activeRevenue && activeRevenue.labels.length > 0 ? (
            <RevenueChart data={activeRevenue} />
          ) : (
            <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-200">
              <p className="text-sm text-slate-400">
                Data revenue untuk periode ini belum tersedia.
              </p>
            </div>
          )}
        </div>

        {/* Invoice Status */}
        <div className="mb-6 grid grid-cols-1 gap-6">
          <InvoiceStatusCard invoiceStatus={data.invoice_status} />
        </div>

        {/* Upcoming Due Dates */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6 pb-4">
            <SectionHeader
              title="Upcoming Due Dates"
              description="Invoices approaching their payment deadline."
              action="View All"
              onAction={() => navigate("/superadmin/invoices")}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-y border-slate-100 bg-slate-50">
                <tr>
                  {[
                    "Client",
                    "Invoice",
                    "Hosting Plan",
                    "Due Date",
                    "Amount",
                    "Status",
                    "Reminder",
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
                {data.upcoming_invoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-8 text-center text-sm text-slate-400"
                    >
                      Belum ada invoice mendatang jatuh tempo.
                    </td>
                  </tr>
                ) : (
                  data.upcoming_invoices.map((invoice) => (
                    <tr
                      key={invoice.invoice_number}
                      className="hover:bg-slate-50"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {invoice.client}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {invoice.invoice_number}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {invoice.plan}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {invoice.due_date}
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatRupiah(invoice.amount)}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={invoice.status} />
                      </td>

                      <td className="px-6 py-4">
                        <span className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          {invoice.reminder}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => navigate("/superadmin/invoices")}
                          className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Reminder + Payment */}
        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Reminder */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Reminder Status"
              description="Automatic reminder activity"
              action="View History"
              onAction={() => navigate("/superadmin/reminders")}
            />

            <div className="mb-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-blue-600">Scheduled</p>
                <p className="mt-1 text-xl font-bold text-blue-800">
                  {reminders_today.scheduled ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-600">Sent</p>
                <p className="mt-1 text-xl font-bold text-emerald-800">
                  {reminders_today.sent ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-xs text-red-600">Failed</p>
                <p className="mt-1 text-xl font-bold text-red-800">
                  {reminders_today.failed ?? 0}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {scheduledRemindersList.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Tidak ada reminder terjadwal berikutnya.
                </p>
              ) : (
                scheduledRemindersList.map((item) => (
                  <div
                    key={`${item.invoice_number}-${item.reminder}`}
                    className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.client}
                      </p>

                      <p className="text-xs text-slate-500">
                        {item.invoice_number} · {item.reminder}
                      </p>
                    </div>

                    {/* Status dari backend (PENDING = menunggu jadwal kirim) */}
                    <StatusBadge
                      status={item.reminder_status || "PENDING"}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment Verification */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Payment Verification"
              description="Payments waiting for verification"
              action="Review Payments"
              onAction={() => navigate("/superadmin/payments")}
            />

            <div className="mb-5 rounded-xl bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <CreditCard size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    {stats.pending_payments ?? 0} payments waiting for
                    verification
                  </p>

                  <p className="mt-0.5 text-xs text-amber-700">
                    Review payment proofs submitted by clients.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {data.pending_verifications.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Tidak ada pembayaran menunggu verifikasi.
                </p>
              ) : (
                data.pending_verifications.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {payment.client}
                      </p>

                      <p className="text-xs text-slate-500">
                        {payment.invoice_number} · {payment.date}
                      </p>
                    </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatRupiah(payment.amount)}
                        </p>

                        <StatusBadge status="PENDING" />
                      </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Overdue */}
        <div className="mb-6 rounded-2xl border border-red-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-red-100 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <AlertCircle size={19} className="text-red-500" />

                <h2 className="text-lg font-semibold text-slate-900">
                  Overdue Invoices
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                {stats.overdue_invoices ?? 0} overdue invoices ·{" "}
                {formatRupiah(stats.overdue_amount)} total outstanding
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/superadmin/invoices")}
              className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-red-50/50">
                <tr>
                  {[
                    "Client",
                    "Invoice",
                    "Due Date",
                    "Days Overdue",
                    "Amount",
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
                {data.overdue_invoices.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-8 text-center text-sm text-slate-400"
                    >
                      Tidak ada invoice overdue. Kerja bagus!
                    </td>
                  </tr>
                ) : (
                  data.overdue_invoices.map((invoice) => (
                    <tr
                      key={invoice.invoice_number}
                      className="hover:bg-red-50/30"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900">
                        {invoice.client}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {invoice.invoice_number}
                      </td>

                      <td className="px-6 py-4 text-slate-600">
                        {invoice.due_date}
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-red-600">
                          {invoice.days_overdue} days
                        </span>
                      </td>

                      <td className="px-6 py-4 font-medium text-slate-900">
                        {formatRupiah(invoice.amount)}
                      </td>

                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => navigate("/superadmin/invoices")}
                          className="font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Payments + Activity */}
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Recent Payments */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Recent Payments"
              description="Latest payment activity"
            />

            <div className="space-y-4">
              {data.recent_payments.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Belum ada pembayaran tercatat.
                </p>
              ) : (
                data.recent_payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600">
                        <CreditCard size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {payment.client}
                        </p>

                        <p className="text-xs text-slate-500">
                          {payment.invoice_number} · {payment.method}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">
                        {formatRupiah(payment.amount)}
                      </p>

                      <div className="mt-1 flex items-center justify-end gap-2">
                        <StatusBadge status={payment.status} />

                        <p className="text-xs text-slate-500">
                          {payment.date}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Recent Activity"
              description="Latest system activities"
              action="View All"
              onAction={() => navigate("/superadmin/reports")}
            />

            <div className="relative ml-2 space-y-6 border-l border-slate-200 pl-6">
              {data.recent_activities.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  Belum ada aktivitas tercatat.
                </p>
              ) : (
                data.recent_activities.map((activity) => {
                  const action = (activity.action || "").toLowerCase();
                  const Icon = action.includes("reminder")
                    ? Bell
                    : action.includes("payment") ||
                        action.includes("approve") ||
                        action.includes("verify")
                      ? CheckCircle2
                      : action.includes("invoice")
                        ? FileText
                        : action.includes("client")
                          ? Users
                          : Activity;

                  return (
                    <div key={activity.id} className="relative">
                      <div className="absolute -left-[39px] flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-indigo-50 text-indigo-600">
                        <Icon size={13} />
                      </div>

                      <p className="text-sm font-semibold text-slate-900">
                        {activity.action}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-500">
                        {activity.description}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {timeAgo(activity.created_at)}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Activity size={19} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-900">
                  System Status
                </p>

                <p className="text-xs text-slate-500">
                  Data dashboard berhasil dimuat dari backend.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              {/* Backend merespon dengan sukses saat halaman dimuat */}
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
                ● Backend Connected
              </span>

              <span className="rounded-full bg-red-50 px-3 py-1.5 font-medium text-red-700">
                {reminders_today.failed ?? 0} Failed Reminders Today
              </span>

              <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                {stats.pending_payments ?? 0} Pending Payments
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
