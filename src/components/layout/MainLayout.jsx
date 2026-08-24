import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

const STORAGE_KEY = "sidebar-collapsed";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "true"
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <Sidebar
        role="client"
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
      />

      <Header role="client" collapsed={collapsed} />

      <div
        className={`pt-16 transition-all duration-300 print:pt-0 print:pl-0 ${
          collapsed ? "md:pl-20" : "md:pl-[280px]"
        }`}
      >
        <Outlet />
      </div>
    </div>
  );
}