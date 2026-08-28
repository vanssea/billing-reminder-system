import { Navigate, Route, Routes } from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import ClientInvoices from "./pages/client/MyInvoices";
import ClientPayments from "./pages/client/Payments";
import ClientProfile from "./pages/client/Profile";
import { AuthProvider } from "./context/AuthContext";

// Auth
import LandingPage from "./pages/auth/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import LupaPassword from "./pages/auth/LupaPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Client
import ClientDashboard from "./pages/client/Dashboard";
import ClientProducts from "./pages/client/Products";
import InvoiceDetail from "./pages/client/InvoiceDetail";

// Admin
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClients from "./pages/admin/Clients";
import AdminProducts from "./pages/admin/Products";
import AdminInvoices from "./pages/admin/Invoices";
import AdminPayments from "./pages/admin/Payments";
import AdminReminders from "./pages/admin/Reminders";
import AdminPurchases from "./pages/admin/Purchases";
import AdminReports from "./pages/admin/Reports";
import AdminProfile from "./pages/admin/Profile";

// Super Admin
import SuperAdminDashboard from "./pages/superadmin/Dashboard";
import AdminManagement from "./pages/superadmin/AdminManagement";
import ClientManagement from "./pages/superadmin/ClientManagement";
import ProductManagement from "./pages/superadmin/ProductManagement";
import PurchaseManagement from "./pages/superadmin/PurchaseManagement";
import InvoiceManagement from "./pages/superadmin/InvoiceManagement";
import ReminderManagement from "./pages/superadmin/ReminderManagement";
import PaymentManagement from "./pages/superadmin/PaymentManagement";
import Reports from "./pages/superadmin/Reports";
import Settings from "./pages/superadmin/Settings";

// Static Pages
import TentangKami from "./pages/static/TentangKami";
import Blog from "./pages/static/Blog";
import Karir from "./pages/static/Karir";
import Kontak from "./pages/static/Kontak";
import Integrasi from "./pages/static/Integrasi";
import Changelog from "./pages/static/Changelog";
import StatusSistem from "./pages/static/StatusSistem";
import PusatBantuan from "./pages/static/PusatBantuan";
import Dokumentasi from "./pages/static/Dokumentasi";
import PanduanAPI from "./pages/static/PanduanAPI";
import Komunitas from "./pages/static/Komunitas";
import KebijakanPrivasi from "./pages/static/KebijakanPrivasi";
import SyaratKetentuan from "./pages/static/SyaratKetentuan";

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />

      <Routes>
        {/* ==================== AUTH ==================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/lupa-password" element={<LupaPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ==================== LANDING ==================== */}
        <Route path="/" element={<LandingPage />} />

        {/* ==================== CLIENT ==================== */}
        <Route
          path="/client"
          element={
            <ProtectedRoute roles={["CLIENT"]}>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<ClientDashboard />} />
          <Route path="invoices" element={<ClientInvoices />} />
          <Route path="invoices/:id" element={<InvoiceDetail />} />
          <Route path="payments" element={<ClientPayments />} />
          <Route path="products" element={<ClientProducts />} />
          <Route path="profile" element={<ClientProfile />} />
        </Route>

        {/* ==================== ADMIN ==================== */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/clients"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminClients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/invoices"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminInvoices />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/payments"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminPayments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/purchases"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminPurchases />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reminders"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminReminders />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminReports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminProfile />
            </ProtectedRoute>
          }
        />

        {/* ==================== SUPER ADMIN ==================== */}
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/admins"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <AdminManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/clients"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <ClientManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/products"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <ProductManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/invoices"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <InvoiceManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/purchases"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <PurchaseManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/reminders"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <ReminderManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/payments"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <PaymentManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/reports"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <Reports />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/settings"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* ==================== STATIC PAGES ==================== */}
        <Route path="/tentang-kami" element={<TentangKami />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/karir" element={<Karir />} />
        <Route path="/kontak" element={<Kontak />} />
        <Route path="/integrasi" element={<Integrasi />} />
        <Route path="/changelog" element={<Changelog />} />
        <Route path="/status-sistem" element={<StatusSistem />} />
        <Route path="/pusat-bantuan" element={<PusatBantuan />} />
        <Route path="/dokumentasi" element={<Dokumentasi />} />
        <Route path="/panduan-api" element={<PanduanAPI />} />
        <Route path="/komunitas" element={<Komunitas />} />
        <Route
          path="/kebijakan-privasi"
          element={<KebijakanPrivasi />}
        />
        <Route
          path="/syarat-ketentuan"
          element={<SyaratKetentuan />}
        />

        {/* ==================== FALLBACK ==================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;