import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LandingPage from "./pages/auth/LandingPage";

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
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
