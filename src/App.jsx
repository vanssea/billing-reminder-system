import { Routes, Route, Outlet } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import AdminManagement from "./pages/superadmin/AdminManagement";
import ClientManagement from "./pages/superadmin/ClientManagement";
import ProductManagement from "./pages/superadmin/ProductManagement";
import InvoiceManagement from "./pages/superadmin/InvoiceManagement";
import ReminderManagement from "./pages/superadmin/ReminderManagement";
import PaymentManagement from "./pages/superadmin/PaymentManagement";
import Reports from "./pages/superadmin/Reports";
import Settings from "./pages/superadmin/Settings";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminClients from "./pages/admin/Clients";
import AdminProducts from "./pages/admin/Products";
import AdminInvoices from "./pages/admin/Invoices";
import AdminPayments from "./pages/admin/Payments";
import AdminReminders from "./pages/admin/Reminders";
import AdminReports from "./pages/admin/Reports";

import ClientDashboard from "./pages/client/Dashboard";
import ClientInvoices from "./pages/client/MyInvoices";
import ClientPayments from "./pages/client/Payments";
import ClientProfile from "./pages/client/Profile";

function SuperAdminLayout() {
  return (
    <div className="min-h-screen bg-[#fcf8ff]">
      <Sidebar role="superadmin" />
      <Header role="superadmin" />
      <Outlet />
    </div>
  );
}

function AdminLayout() {
  return (
    <div className="min-h-screen bg-[#fcf8ff]">
      <Sidebar role="admin" />
      <Header role="admin" />
      <Outlet />
    </div>
  );
}

function ClientLayout() {
  return (
    <div className="min-h-screen bg-[#fcf8ff]">
      <Sidebar role="client" />
      <Header role="client" />
      <Outlet />
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Super Admin */}
      <Route element={<SuperAdminLayout />}>
        <Route path="/" element={<SuperAdminDashboard />} />
        <Route path="/superadmin/dashboard" element={<SuperAdminDashboard />} />

        <Route path="/superadmin/clients" element={<ClientManagement />} />
        <Route path="/superadmin/products" element={<ProductManagement />} />
        <Route path="/superadmin/invoices" element={<InvoiceManagement />} />
        <Route path="/superadmin/payments" element={<PaymentManagement />} />
        <Route path="/superadmin/reminders" element={<ReminderManagement />} />
        <Route path="/superadmin/reports" element={<Reports />} />
        <Route path="/superadmin/admins" element={<AdminManagement />} />
        <Route path="/superadmin/settings" element={<Settings />} />
      </Route>

      {/* Admin */}
      <Route element={<AdminLayout />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/clients" element={<AdminClients />} />
        <Route path="/admin/products" element={<AdminProducts />} />
        <Route path="/admin/invoices" element={<AdminInvoices />} />
        <Route path="/admin/payments" element={<AdminPayments />} />
        <Route path="/admin/reminders" element={<AdminReminders />} />
        <Route path="/admin/reports" element={<AdminReports />} />
      </Route>

      {/* Client */}
      <Route element={<ClientLayout />}>
        <Route path="/client/dashboard" element={<ClientDashboard />} />
        <Route path="/client/invoices" element={<ClientInvoices />} />
        <Route path="/client/payments" element={<ClientPayments />} />
        <Route path="/client/profile" element={<ClientProfile />} />
      </Route>
    </Routes>
  );
}

export default App;
