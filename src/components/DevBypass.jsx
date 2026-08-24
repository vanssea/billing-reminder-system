import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { roleDashboard } from "../utils/roles";
import { supabase } from "../lib/supabaseClient";
import { DEV_BYPASS_ROLE_KEY } from "../context/AuthContext";

const VALID_ROLES = ["CLIENT", "ADMIN", "SUPERADMIN"];

// Khusus development: kunjungi /dev/admin atau /dev/superadmin (atau /dev/client)
// untuk masuk ke dashboard terkait tanpa login. Tidak aktif di production.
export function DevBypass({ role }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!import.meta.env.DEV) {
      navigate("/", { replace: true });
      return;
    }

    if (!VALID_ROLES.includes(role)) {
      navigate("/login", { replace: true });
      return;
    }

    localStorage.setItem(DEV_BYPASS_ROLE_KEY, role);
    window.location.href = roleDashboard[role] || "/";
  }, [role, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcf8ff] text-sm font-medium text-[#777587]">
      Masuk sebagai {role} (dev)...
    </div>
  );
}

export function DevLogout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!import.meta.env.DEV) {
      navigate("/login", { replace: true });
      return;
    }

    localStorage.removeItem(DEV_BYPASS_ROLE_KEY);
    supabase.auth.signOut().finally(() => {
      window.location.href = "/login";
    });
  }, [navigate]);

  return null;
}
