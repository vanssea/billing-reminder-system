import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  // ==================================================
  // HACK SEMENTARA: Langsung di-bypass biar bisa fokus ngoding Client!
  // ==================================================
  return children;

  /* --- KODE ASLI DI-COMMENT DULU ---
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fcf8ff] text-sm font-medium text-[#777587]">
        Memuat...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
  -------------------------------------------------- */
}