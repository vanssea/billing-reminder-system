import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import { AuthProvider } from "./context/AuthContext";

// Auth
const LandingPage = lazy(() => import("./pages/auth/LandingPage"));
const Login = lazy(() => import("./pages/auth/Login"));
const Register = lazy(() => import("./pages/auth/Register"));
const LupaPassword = lazy(() => import("./pages/auth/LupaPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

// Client
const ClientDashboard = lazy(() => import("./pages/client/Dashboard"));
const ClientInvoices = lazy(() => import("./pages/client/MyInvoices"));
const ClientPayments = lazy(() => import("./pages/client/Payments"));
const ClientProducts = lazy(() => import("./pages/client/Products"));
const ClientTestimonials = lazy(() => import("./pages/client/Testimonials"));
const InvoiceDetail = lazy(() => import("./pages/client/InvoiceDetail"));
const ClientProfile = lazy(() => import("./pages/client/Profile"));

// Admin
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminClients = lazy(() => import("./pages/admin/Clients"));
const AdminProducts = lazy(() => import("./pages/admin/Products"));
const AdminInvoices = lazy(() => import("./pages/admin/Invoices"));
const AdminPayments = lazy(() => import("./pages/admin/Payments"));
const AdminReminders = lazy(() => import("./pages/admin/Reminders"));
const AdminPurchases = lazy(() => import("./pages/admin/Purchases"));
const AdminReports = lazy(() => import("./pages/admin/Reports"));
const AdminProfile = lazy(() => import("./pages/admin/Profile"));

// Super Admin
const SuperAdminDashboard = lazy(() => import("./pages/superadmin/Dashboard"));
const AdminManagement = lazy(() => import("./pages/superadmin/AdminManagement"));
const ClientManagement = lazy(() => import("./pages/superadmin/ClientManagement"));
const ProductManagement = lazy(() => import("./pages/superadmin/ProductManagement"));
const PurchaseManagement = lazy(() => import("./pages/superadmin/PurchaseManagement"));
const InvoiceManagement = lazy(() => import("./pages/superadmin/InvoiceManagement"));
const ReminderManagement = lazy(() => import("./pages/superadmin/ReminderManagement"));
const PaymentManagement = lazy(() => import("./pages/superadmin/PaymentManagement"));
const Reports = lazy(() => import("./pages/superadmin/Reports"));
const Settings = lazy(() => import("./pages/superadmin/Settings"));

// Static Pages
const TentangKami = lazy(() => import("./pages/static/TentangKami"));
const Blog = lazy(() => import("./pages/static/Blog"));
const Karir = lazy(() => import("./pages/static/Karir"));
const Kontak = lazy(() => import("./pages/static/Kontak"));
const Integrasi = lazy(() => import("./pages/static/Integrasi"));
const Changelog = lazy(() => import("./pages/static/Changelog"));
const StatusSistem = lazy(() => import("./pages/static/StatusSistem"));
const PusatBantuan = lazy(() => import("./pages/static/PusatBantuan"));
const Dokumentasi = lazy(() => import("./pages/static/Dokumentasi"));
const PanduanAPI = lazy(() => import("./pages/static/PanduanAPI"));
const Komunitas = lazy(() => import("./pages/static/Komunitas"));
const KebijakanPrivasi = lazy(() => import("./pages/static/KebijakanPrivasi"));
const SyaratKetentuan = lazy(() => import("./pages/static/SyaratKetentuan"));

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <p className="text-sm font-medium text-slate-500">Memuat...</p>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />

      <Suspense fallback={<PageFallback />}>
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
          <Route path="testimonials" element={<ClientTestimonials />} />
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
      </Suspense>
    </AuthProvider>
  );
}

export default App;