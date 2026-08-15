import { useLocation, useNavigate } from "react-router-dom";

const superadminMenu = {
  subtitle: "Super Admin Panel",
  items: [
    { label: "Dashboard", icon: "dashboard", path: "/superadmin/dashboard" },
    { label: "Admin Management", icon: "admin_panel_settings", path: "/superadmin/admins" },
    { label: "Client Management", icon: "group", path: "/superadmin/clients" },
    { label: "Product Management", icon: "dns", path: "/superadmin/products" },
    { label: "Invoice Management", icon: "receipt_long", path: "/superadmin/invoices" },
    { label: "Reminder Management", icon: "notifications_active", path: "/superadmin/reminders" },
    { label: "Payment Management", icon: "payments", path: "/superadmin/payments" },
    { label: "Reports", icon: "assessment", path: "/superadmin/reports" },
  ],
  bottomItems: [{ label: "Settings", icon: "settings", path: "/superadmin/settings" }],
};

const adminMenu = {
  subtitle: "Admin Panel",
  items: [
    { label: "Dashboard", icon: "dashboard", path: "/admin/dashboard" },
    { label: "Clients", icon: "group", path: "/admin/clients" },
    { label: "Products", icon: "dns", path: "/admin/products" },
    { label: "Invoices", icon: "receipt_long", path: "/admin/invoices" },
    { label: "Payments", icon: "payments", path: "/admin/payments" },
    { label: "Reminders", icon: "notifications_active", path: "/admin/reminders" },
    { label: "Reports", icon: "assessment", path: "/admin/reports" },
  ],
  bottomItems: [],
};

const clientMenu = {
  subtitle: "Client Panel",
  items: [
    { label: "Dashboard", icon: "dashboard", path: "/client/dashboard" },
    { label: "My Invoices", icon: "receipt_long", path: "/client/invoices" },
    { label: "Payments", icon: "payments", path: "/client/payments" },
  ],
  bottomItems: [],
};

export default function Sidebar({ role = "superadmin" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const menu =
    role === "admin" ? adminMenu : role === "client" ? clientMenu : superadminMenu;

  const allItems = [...menu.items, ...menu.bottomItems];
  const activeLabel =
    allItems.find((item) => item.path === location.pathname)?.label ||
    menu.items[0].label;

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r border-[#c7c4d8] bg-white md:flex">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate(menu.items[0].path)}
          className="flex h-16 shrink-0 items-center border-b border-[#e0e3e5] px-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#3525cd] text-base font-bold text-white">
              HF
            </div>

            <div>
              <h1 className="truncate text-lg font-bold text-[#3525cd]">
                HostFlow
              </h1>

              <p className="text-[11px] font-medium text-[#777587]">
                {menu.subtitle}
              </p>
            </div>
          </div>
        </button>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col overflow-y-auto px-3 py-5">
          <div className="space-y-1">
            {menu.items.map((item) => {
              const isActive = activeLabel === item.label;

              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  aria-current={isActive ? "page" : undefined}
                  className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3525cd] ${
                    isActive
                      ? "bg-[#3525cd]/10 font-bold text-[#3525cd]"
                      : "text-[#464555] hover:bg-[#f0ecf9] hover:text-[#3525cd]"
                  }`}
                >
                  <span
                    className="material-symbols-outlined shrink-0 text-[22px]"
                    style={
                      isActive
                        ? { fontVariationSettings: "'FILL' 1" }
                        : undefined
                    }
                  >
                    {item.icon}
                  </span>

                  <span className="truncate font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Bottom section */}
          {menu.bottomItems.length > 0 && (
            <div className="mt-auto border-t border-[#e0e3e5] pt-3">
              <div className="space-y-1">
                {menu.bottomItems.map((item) => {
                  const isActive = activeLabel === item.label;

                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => navigate(item.path)}
                      aria-current={isActive ? "page" : undefined}
                      className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3525cd] ${
                        isActive
                          ? "bg-[#3525cd]/10 font-bold text-[#3525cd]"
                          : "text-[#464555] hover:bg-[#f0ecf9] hover:text-[#3525cd]"
                      }`}
                    >
                      <span
                        className="material-symbols-outlined shrink-0 text-[22px]"
                        style={
                          isActive
                            ? { fontVariationSettings: "'FILL' 1" }
                            : undefined
                        }
                      >
                        {item.icon}
                      </span>

                      <span className="truncate font-medium">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </nav>
      </div>
    </aside>
  );
}
