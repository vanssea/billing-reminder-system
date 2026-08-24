import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <Sidebar role="client" />

      <Header role="client" />

      <div className="app-content min-h-screen bg-slate-50 pt-16 print:pt-0">
        <Outlet />
      </div>
    </div>
  );
}
