import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  BellRing,
  ChevronsLeft,
  ChevronsRight,
  CreditCard,
  LayoutDashboard,
  ReceiptText,
  Server,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import { Logo } from "../landing/Navbar";

const superadminMenu = {
  subtitle: "Super Admin Panel",
  items: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/superadmin/dashboard" },
    { label: "Admin Management", icon: ShieldCheck, path: "/superadmin/admins" },
    { label: "Client Management", icon: Users, path: "/superadmin/clients" },
    { label: "Product Management", icon: Server, path: "/superadmin/products" },
    { label: "Purchase Management", icon: ShoppingBag, path: "/superadmin/purchases" },
    { label: "Invoice Management", icon: ReceiptText, path: "/superadmin/invoices" },
    { label: "Payment Management", icon: CreditCard, path: "/superadmin/payments" },
    { label: "Reminder Management", icon: BellRing, path: "/superadmin/reminders" },
    { label: "Reports", icon: BarChart3, path: "/superadmin/reports" },
  ],
  bottomItems: [{ label: "Settings", icon: Settings, path: "/superadmin/settings" }],
};

const adminMenu = {
  subtitle: "Admin Panel",
  items: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { label: "Clients", icon: Users, path: "/admin/clients" },
    { label: "Products", icon: Server, path: "/admin/products" },
    { label: "Invoices", icon: ReceiptText, path: "/admin/invoices" },
    { label: "Payments", icon: CreditCard, path: "/admin/payments" },
    { label: "Purchases", icon: ShoppingBag, path: "/admin/purchases" },
    { label: "Reminders", icon: BellRing, path: "/admin/reminders" },
    { label: "Reports", icon: BarChart3, path: "/admin/reports" },
  ],
  bottomItems: [],
};

const clientMenu = {
  subtitle: "Client Panel",
  items: [
    { label: "Dashboard", icon: LayoutDashboard, path: "/client/dashboard" },
    { label: "My Invoices", icon: ReceiptText, path: "/client/invoices" },
    { label: "Payments", icon: CreditCard, path: "/client/payments" },
    { label: "Buy Package", icon: Server, path: "/client/products" },
    { label: "Testimonials", icon: Star, path: "/client/testimonials" },
  ],
  bottomItems: [],
};

function Tooltip({ label, collapsed }) {
  if (!collapsed) return null;

  return (
    <span className="pointer-events-none absolute left-full top-1/2 z-[60] ml-3 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
      {label}
    </span>
  );
}

const STORAGE_KEY = "sidebar-collapsed";

export default function Sidebar({ role = "superadmin" }) {
  // Sidebar adalah satu-satunya pengelola status collapse. Status dipublikasi
  // lewat data-sidebar di <body> sehingga Header dan konten halaman (class
  // app-header / app-content di index.css) mengikuti tanpa state tambahan.
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY) === "true";
    document.body.dataset.sidebar = stored ? "collapsed" : "open";
    return stored;
  });

  useEffect(() => {
    document.body.dataset.sidebar = collapsed ? "collapsed" : "open";
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const navigate = useNavigate();
  const location = useLocation();
  const menu =
    role === "admin" ? adminMenu : role === "client" ? clientMenu : superadminMenu;

  const allItems = [...menu.items, ...menu.bottomItems];
const activeLabel =
  allItems.find((item) => location.pathname.startsWith(item.path))?.label ||
  menu.items[0].label;

  const itemClassName = (isActive) =>
    `group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${collapsed ? "justify-center px-0" : ""
    } ${isActive
      ? collapsed
        ? "bg-brand-600/10 text-brand-600"
        : "bg-gradient-to-r from-brand-600 to-brand-500 font-bold text-white shadow-lg shadow-brand-600/30"
      : "text-slate-600 hover:bg-brand-50 hover:text-brand-600"
    }`;

  return (
    <aside
      className={`fixed left-0 top-0 z-50 hidden h-screen flex-col border-r border-slate-200/70 bg-white/85 backdrop-blur-xl transition-all duration-300 print:hidden md:flex ${collapsed ? "w-20" : "w-[280px]"
        }`}
    >
      <div className="flex h-full flex-col">
        <div
          className={`relative flex h-16 shrink-0 items-center border-b border-slate-200/70 px-4 ${collapsed ? "justify-center" : ""
            }`}
        >
          <button
            type="button"
            onClick={() => navigate(menu.items[0].path)}
            aria-label="HostFlow"
            className="group relative text-left"
          >
            <Logo compact={collapsed} />

            <Tooltip label="HostFlow" collapsed={collapsed} />
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? "Perluas sidebar" : "Minimalkan sidebar"}
            title={collapsed ? "Perluas sidebar" : "Minimalkan sidebar"}
            className="absolute right-[-12px] top-5 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-md transition hover:border-brand-300 hover:text-brand-600"
          >
            {collapsed ? (
              <ChevronsRight size={14} />
            ) : (
              <ChevronsLeft size={14} />
            )}
          </button>
        </div>

        <nav
          className={`flex flex-1 flex-col px-3 py-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${collapsed ? "overflow-visible" : "overflow-y-auto"
            }`}
        >
          {!collapsed && (
            <p className="px-3 pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-400">
              {menu.subtitle}
            </p>
          )}

          <div className="space-y-1">
            {menu.items.map((item) => {
              const isActive = activeLabel === item.label;
              const Icon = item.icon;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  aria-label={item.label}
                  aria-current={isActive ? "page" : undefined}
                  className={itemClassName(isActive)}
                >
                  {collapsed && isActive && (
                    <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-600" />
                  )}

                  <Icon
                    size={20}
                    strokeWidth={isActive ? 2.4 : 2}
                    className="shrink-0"
                  />

                  {!collapsed && (
                    <span className="truncate font-medium">{item.label}</span>
                  )}

                  <Tooltip label={item.label} collapsed={collapsed} />
                </button>
              );
            })}
          </div>

          <div className="mt-auto">
            {menu.bottomItems.length > 0 && (
              <div className="border-t border-slate-200/70 pt-3">
                <div className="space-y-1">
                  {menu.bottomItems.map((item) => {
                    const isActive = activeLabel === item.label;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => navigate(item.path)}
                        aria-label={item.label}
                        aria-current={isActive ? "page" : undefined}
                        className={itemClassName(isActive)}
                      >
                        {collapsed && isActive && (
                          <span className="absolute -left-3 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-full bg-brand-600" />
                        )}

                        <Icon
                          size={20}
                          strokeWidth={isActive ? 2.4 : 2}
                          className="shrink-0"
                        />

                        {!collapsed && (
                          <span className="truncate font-medium">{item.label}</span>
                        )}

                        <Tooltip label={item.label} collapsed={collapsed} />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </aside>
  );
}