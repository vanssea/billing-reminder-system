import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { roleDashboard } from "../utils/roles";

export default function ProtectedRoute({ children, roles }) {
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

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={roleDashboard[user.role] || "/"} replace />;
  }

  return children;
}