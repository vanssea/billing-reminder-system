import { useState } from "react";
import {
  Users,
  ShieldCheck,
  Globe,
  Wallet,
  FileText,
  AlertCircle,
  Bell,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  CheckCircle2,
  CreditCard,
  Activity,
} from "lucide-react";

const stats = [
  {
    title: "Total Clients",
    value: "128",
    description: "+12% this month",
    trend: "up",
    icon: Users,
  },
  {
    title: "Total Admins",
    value: "8",
    description: "+1 this month",
    trend: "up",
    icon: ShieldCheck,
  },
  {
    title: "Active Hosting",
    value: "245",
    description: "+8.2% this month",
    trend: "up",
    icon: Globe,
  },
  {
    title: "Revenue",
    value: "Rp45.250.000",
    description: "+8.5% this month",
    trend: "up",
    icon: Wallet,
  },
  {
    title: "Unpaid Invoices",
    value: "42",
    description: "Rp8.500.000 outstanding",
    trend: "down",
    icon: FileText,
  },
  {
    title: "Overdue Invoices",
    value: "15",
    description: "Rp5.250.000 overdue",
    trend: "down",
    icon: AlertCircle,
  },
  {
    title: "Reminder Today",
    value: "12",
    description: "9 sent · 2 scheduled · 1 failed",
    trend: null,
    icon: Bell,
  },
  {
    title: "Pending Payments",
    value: "7",
    description: "Waiting for verification",
    trend: null,
    icon: Clock,
  },
];

const revenuePeriods = [
  {
    key: "7 Days",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [25, 28, 31, 27, 33, 35, 30],
  },
  {
    key: "30 Days",
    labels: Array.from({ length: 30 }, (_, index) => `D${index + 1}`),
    values: [
      22, 26, 29, 32, 28, 31, 35, 33, 30, 34,
      36, 38, 35, 32, 34, 37, 39, 41, 38, 36,
      39, 42, 40, 37, 40, 43, 45, 42, 44, 46,
    ],
  },
  {
    key: "3 Months",
    labels: Array.from({ length: 12 }, (_, index) => `W${index + 1}`),
    values: [24, 27, 30, 33, 31, 35, 38, 36, 39, 42, 41, 45],
  },
  {
    key: "6 Months",
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    values: [25, 28, 31, 29, 35, 38],
  },
  {
    key: "1 Year",
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    values: [25, 28, 31, 29, 35, 38, 41, 45, 42, 48, 51, 54],
  },
];

const invoiceStatusData = [
  { label: "Paid", count: 161, percent: 62, color: "#10b981" },
  { label: "Unpaid", count: 52, percent: 20, color: "#f59e0b" },
  { label: "Overdue", count: 34, percent: 13, color: "#ef4444" },
  { label: "Cancelled", count: 13, percent: 5, color: "#94a3b8" },
];

const upcomingInvoices = [
  {
    client: "PT ABC",
    invoice: "INV-2026-001",
    plan: "Business Hosting",
    dueDate: "20 Aug 2026",
    amount: "Rp500.000",
    status: "UNPAID",
    reminder: "H-7",
  },
  {
    client: "PT XYZ",
    invoice: "INV-2026-002",
    plan: "Premium Hosting",
    dueDate: "22 Aug 2026",
    amount: "Rp1.000.000",
    status: "UNPAID",
    reminder: "H-10",
  },
  {
    client: "PT Maju",
    invoice: "INV-2026-003",
    plan: "Basic Hosting",
    dueDate: "23 Aug 2026",
    amount: "Rp250.000",
    status: "UNPAID",
    reminder: "H-3",
  },
  {
    client: "PT Example",
    invoice: "INV-2026-004",
    plan: "Business Hosting",
    dueDate: "25 Aug 2026",
    amount: "Rp500.000",
    status: "UNPAID",
    reminder: "H-10",
  },
];

const overdueInvoices = [
  {
    client: "PT ABC",
    invoice: "INV-2026-010",
    dueDate: "10 Aug 2026",
    days: "4 days",
    amount: "Rp500.000",
  },
  {
    client: "PT XYZ",
    invoice: "INV-2026-011",
    dueDate: "8 Aug 2026",
    days: "6 days",
    amount: "Rp1.000.000",
  },
  {
    client: "PT Maju",
    invoice: "INV-2026-012",
    dueDate: "7 Aug 2026",
    days: "7 days",
    amount: "Rp750.000",
  },
];

const recentPayments = [
  {
    client: "PT ABC",
    invoice: "INV-001",
    amount: "Rp500.000",
    date: "Today",
    method: "Bank Transfer",
    status: "Approved",
  },
  {
    client: "PT XYZ",
    invoice: "INV-002",
    amount: "Rp1.000.000",
    date: "Today",
    method: "Bank Transfer",
    status: "Pending",
  },
  {
    client: "PT Maju",
    invoice: "INV-003",
    amount: "Rp250.000",
    date: "Yesterday",
    method: "Bank Transfer",
    status: "Approved",
  },
];

const activities = [
  {
    title: "Payment approved",
    description: "PT ABC — INV-001",
    time: "10 minutes ago",
    icon: CheckCircle2,
  },
  {
    title: "Reminder H-3 sent",
    description: "PT XYZ — INV-002",
    time: "25 minutes ago",
    icon: Bell,
  },
  {
    title: "New invoice created",
    description: "INV-003 — PT Maju",
    time: "1 hour ago",
    icon: FileText,
  },
  {
    title: "New client registered",
    description: "PT Example",
    time: "2 hours ago",
    icon: Users,
  },
  {
    title: "Hosting subscription created",
    description: "PT ABC",
    time: "3 hours ago",
    icon: Globe,
  },
  {
    title: "Admin created",
    description: "John Doe",
    time: "Yesterday",
    icon: ShieldCheck,
  },
];

const reminderData = [
  {
    client: "PT ABC",
    invoice: "INV-001",
    reminder: "H-7",
    status: "Sent",
  },
  {
    client: "PT XYZ",
    invoice: "INV-002",
    reminder: "H-3",
    status: "Scheduled",
  },
  {
    client: "PT Maju",
    invoice: "INV-003",
    reminder: "H-1",
    status: "Failed",
  },
];

const paymentVerification = [
  {
    client: "PT ABC",
    invoice: "INV-001",
    amount: "Rp500.000",
    date: "Today",
  },
  {
    client: "PT XYZ",
    invoice: "INV-002",
    amount: "Rp1.000.000",
    date: "Today",
  },
  {
    client: "PT Maju",
    invoice: "INV-003",
    amount: "Rp250.000",
    date: "Yesterday",
  },
];

function StatusBadge({ status }) {
  const styles = {
    PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
    UNPAID: "bg-amber-50 text-amber-700 border-amber-200",
    OVERDUE: "bg-red-50 text-red-700 border-red-200",
    CANCELLED: "bg-slate-100 text-slate-600 border-slate-200",
    Approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Pending: "bg-amber-50 text-amber-700 border-amber-200",
    Sent: "bg-emerald-50 text-emerald-700 border-emerald-200",
    Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
    Failed: "bg-red-50 text-red-700 border-red-200",
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

      {action && (
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
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
  const padLeft = 36;
  const padRight = 12;
  const padTop = 24;
  const padBottom = 30;

  const maxValue = Math.max(...data.values);
  const niceMax = Math.max(10, Math.ceil((maxValue * 1.15) / 10) * 10);
  const n = data.values.length;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const points = data.values.map((value, index) => {
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
              {line.value}
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
                {data.labels[index]}
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
            {data.labels[hoverIndex]}
          </p>

          <p className="text-xs font-bold text-white">
            Rp {hoveredPoint.value} Jt
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

function DonutChart({ hoveredIndex, onHover, onLeave }) {
  const size = 176;
  const cx = size / 2;
  const cy = size / 2;
  const rOuter = 82;
  const rInner = 54;
  const gap = 2;

  const segments = invoiceStatusData.reduce((acc, segment) => {
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
              {hovered ? hovered.count : 260}
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

function InvoiceStatusCard() {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <SectionHeader
        title="Invoice Status"
        description="Current invoice distribution"
      />

      <div className="flex flex-col items-center gap-6 sm:flex-row">
        <DonutChart
          hoveredIndex={hoveredIndex}
          onHover={setHoveredIndex}
          onLeave={() => setHoveredIndex(null)}
        />

        <div className="w-full space-y-2">
          {invoiceStatusData.map((status, index) => (
            <div
              key={status.label}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition ${
                hoveredIndex === index ? "bg-slate-50" : ""
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: status.color }}
                />

                <span className="text-sm text-slate-600">{status.label}</span>
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
    </div>
  );
}

function HostingSubscriptionCard() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <SectionHeader
        title="Hosting Subscription"
        description="Current hosting subscription overview"
      />

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-50 p-4">
          <p className="text-xs font-medium text-emerald-700">Active</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">245</p>
        </div>

        <div className="rounded-xl bg-amber-50 p-4">
          <p className="text-xs font-medium text-amber-700">
            Expiring Soon
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-800">18</p>
        </div>

        <div className="rounded-xl bg-red-50 p-4">
          <p className="text-xs font-medium text-red-700">Expired</p>
          <p className="mt-1 text-2xl font-bold text-red-800">7</p>
        </div>

        <div className="rounded-xl bg-slate-100 p-4">
          <p className="text-xs font-medium text-slate-600">Suspended</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">3</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Hosting Plans
          </h3>
          <button className="text-xs font-medium text-indigo-600">
            View All
          </button>
        </div>

        <div className="space-y-4">
          {[
            ["Basic", 120, "49%"],
            ["Business", 85, "35%"],
            ["Premium", 40, "16%"],
          ].map(([name, count, percentage]) => (
            <div key={name}>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-slate-600">{name}</span>
                <span className="font-medium text-slate-900">
                  {count} ({percentage})
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: percentage }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [activePeriod, setActivePeriod] = useState("1 Year");
  const activeRevenue =
    revenuePeriods.find((period) => period.key === activePeriod) ||
    revenuePeriods[0];

  return (
    <div className="min-h-screen bg-slate-50 pt-16 text-slate-900 md:pl-[280px]">
      {/* Main Content */}
      <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">

          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Overview of your hosting business and billing activity.
          </p>
        </div>

        {/* Statistics */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
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

                <div className="mt-2 flex items-center gap-1.5 text-xs">
                  {stat.trend === "up" && (
                    <ArrowUpRight
                      size={14}
                      className="text-emerald-600"
                    />
                  )}

                  {stat.trend === "down" && (
                    <ArrowDownRight
                      size={14}
                      className="text-amber-600"
                    />
                  )}

                  <span className="text-slate-500">
                    {stat.description}
                  </span>
                </div>
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
              {revenuePeriods.map((period) => (
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
                  {period.key}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Total Revenue</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                Rp45.250.000
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Paid Revenue</p>
              <p className="mt-1 text-lg font-bold text-emerald-600">
                Rp39.000.000
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Outstanding</p>
              <p className="mt-1 text-lg font-bold text-amber-600">
                Rp8.500.000
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Overdue</p>
              <p className="mt-1 text-lg font-bold text-red-600">
                Rp5.250.000
              </p>
            </div>
          </div>

          <RevenueChart data={activeRevenue} />
        </div>

        {/* Invoice + Hosting */}
        <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <InvoiceStatusCard />
          <HostingSubscriptionCard />
        </div>

        {/* Upcoming Due Dates */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="p-6 pb-4">
            <SectionHeader
              title="Upcoming Due Dates"
              description="Invoices approaching their payment deadline."
              action="View All"
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
                {upcomingInvoices.map((invoice) => (
                  <tr
                    key={invoice.invoice}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {invoice.client}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {invoice.invoice}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {invoice.plan}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {invoice.dueDate}
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-900">
                      {invoice.amount}
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
                      <button className="font-medium text-indigo-600 hover:text-indigo-700">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
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
            />

            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-blue-50 p-4">
                <p className="text-xs text-blue-600">Scheduled</p>
                <p className="mt-1 text-xl font-bold text-blue-800">12</p>
              </div>

              <div className="rounded-xl bg-emerald-50 p-4">
                <p className="text-xs text-emerald-600">Sent</p>
                <p className="mt-1 text-xl font-bold text-emerald-800">35</p>
              </div>

              <div className="rounded-xl bg-red-50 p-4">
                <p className="text-xs text-red-600">Failed</p>
                <p className="mt-1 text-xl font-bold text-red-800">2</p>
              </div>

              <div className="rounded-xl bg-slate-100 p-4">
                <p className="text-xs text-slate-600">Cancelled</p>
                <p className="mt-1 text-xl font-bold text-slate-800">8</p>
              </div>
            </div>

            <div className="space-y-3">
              {reminderData.map((item) => (
                <div
                  key={`${item.invoice}-${item.reminder}`}
                  className="flex items-center justify-between rounded-xl border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.client}
                    </p>

                    <p className="text-xs text-slate-500">
                      {item.invoice} · {item.reminder}
                    </p>
                  </div>

                  <StatusBadge status={item.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Payment Verification */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Payment Verification"
              description="Payments waiting for verification"
              action="Review Payments"
            />

            <div className="mb-5 rounded-xl bg-amber-50 p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-amber-700">
                  <CreditCard size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    7 payments waiting for verification
                  </p>

                  <p className="mt-0.5 text-xs text-amber-700">
                    Review payment proofs submitted by clients.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {paymentVerification.map((payment) => (
                <div
                  key={payment.invoice}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {payment.client}
                    </p>

                    <p className="text-xs text-slate-500">
                      {payment.invoice} · {payment.date}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {payment.amount}
                    </p>

                    <span className="text-xs text-amber-600">
                      Pending
                    </span>
                  </div>
                </div>
              ))}
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
                15 overdue invoices · Rp5.250.000 total outstanding
              </p>
            </div>

            <button className="rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
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
                {overdueInvoices.map((invoice) => (
                  <tr
                    key={invoice.invoice}
                    className="hover:bg-red-50/30"
                  >
                    <td className="px-6 py-4 font-medium text-slate-900">
                      {invoice.client}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {invoice.invoice}
                    </td>

                    <td className="px-6 py-4 text-slate-600">
                      {invoice.dueDate}
                    </td>

                    <td className="px-6 py-4">
                      <span className="font-semibold text-red-600">
                        {invoice.days}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-medium text-slate-900">
                      {invoice.amount}
                    </td>

                    <td className="px-6 py-4">
                      <button className="font-medium text-indigo-600 hover:text-indigo-700">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
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
              {recentPayments.map((payment) => (
                <div
                  key={payment.invoice}
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
                        {payment.invoice} · {payment.method}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {payment.amount}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {payment.date}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              title="Recent Activity"
              description="Latest system activities"
              action="View All"
            />

            <div className="relative ml-2 space-y-6 border-l border-slate-200 pl-6">
              {activities.map((activity) => {
                const Icon = activity.icon;

                return (
                  <div key={activity.title} className="relative">
                    <div className="absolute -left-[39px] flex h-7 w-7 items-center justify-center rounded-full border-4 border-white bg-indigo-50 text-indigo-600">
                      <Icon size={13} />
                    </div>

                    <p className="text-sm font-semibold text-slate-900">
                      {activity.title}
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {activity.description}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {activity.time}
                    </p>
                  </div>
                );
              })}
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
                  Reminder system operating normally.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-700">
                ● Reminder System Online
              </span>

              <span className="rounded-full bg-red-50 px-3 py-1.5 font-medium text-red-700">
                2 Failed Reminders
              </span>

              <span className="rounded-full bg-amber-50 px-3 py-1.5 font-medium text-amber-700">
                7 Pending Payments
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}