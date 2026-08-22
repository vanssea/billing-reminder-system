import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";

// Auth
import LandingPage from "./pages/auth/LandingPage";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import LupaPassword from "./pages/auth/LupaPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Dashboard
import ClientDashboard from "./pages/client/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminClients from "./pages/admin/Clients";
import AdminProducts from "./pages/admin/Products";
import AdminInvoices from "./pages/admin/Invoices";
import SuperAdminDashboard from "./pages/superadmin/Dashboard";

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

        {/* ==================== DASHBOARD ==================== */}
        <Route
          path="/client/dashboard"
          element={
            <ProtectedRoute roles={["CLIENT"]}>
              <ClientDashboard />
            </ProtectedRoute>
          }
        />

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
            <ProtectedRoute>
              <AdminClients />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/products"
          element={
            <ProtectedRoute>
              <AdminProducts />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/invoices"
          element={
            <ProtectedRoute>
              <AdminInvoices />
            </ProtectedRoute>
          }
        />

        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute roles={["SUPERADMIN"]}>
              <SuperAdminDashboard />
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
        <Route path="/kebijakan-privasi" element={<KebijakanPrivasi />} />
        <Route path="/syarat-ketentuan" element={<SyaratKetentuan />} />

        {/* ==================== FALLBACK ==================== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;