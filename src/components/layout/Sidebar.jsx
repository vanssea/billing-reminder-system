import { useState } from "react";

const menuItems = [
  { label: "Dashboard", icon: "dashboard" },
  { label: "Clients", icon: "group" },
  { label: "Web Hosting Plans", icon: "dns" },
  { label: "Invoices", icon: "receipt_long" },
  { label: "Payments", icon: "payments" },
  { label: "Reminders", icon: "notifications_active" },
  { label: "Reports", icon: "assessment" },
  { label: "Activity History", icon: "history" },
];

export default function Sidebar() {
  const [activeMenu, setActiveMenu] = useState("Dashboard");

  return (
    <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r border-[#c7c4d8] bg-white md:flex">
      <div className="flex h-full flex-col py-6">

        {/* Logo */}
        <div className="mb-8 flex items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#3525cd] text-lg font-bold text-white">
            HF
          </div>

          <div>
            <h1 className="text-xl font-bold text-[#3525cd]">
              HostFlow
            </h1>

            <p className="text-xs font-medium text-[#464555]">
              Web Hosting Billing
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4">
          {menuItems.map((item) => {
            const isActive = activeMenu === item.label;

            return (
              <button
                key={item.label}
                onClick={() => setActiveMenu(item.label)}
                className={`group flex w-full items-center gap-3 rounded-r-lg border-l-4 px-4 py-3 text-left transition-all duration-150 ${
                  isActive
                    ? "border-[#3525cd] bg-[#3525cd]/10 font-bold text-[#3525cd]"
                    : "border-transparent text-[#464555] hover:bg-[#f0ecf9] hover:text-[#1b1b24]"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={
                    isActive
                      ? { fontVariationSettings: "'FILL' 1" }
                      : undefined
                  }
                >
                  {item.icon}
                </span>

                <span className="text-sm font-medium">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}