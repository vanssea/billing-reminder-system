import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { supabase, setRememberMode } from "../lib/supabaseClient";
import { getMe } from "../services/authApi";
import { getClientByProfileId } from "../services/clientApi";

const AuthContext = createContext(null);

// Khusus development: kunci localStorage untuk masuk tanpa login.
// Tidak berpengaruh pada build production (import.meta.env.DEV === false).
export const DEV_BYPASS_ROLE_KEY = "dev_bypass_role";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [client, setClient] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      // Bypass login khusus development (? /dev/admin, /dev/superadmin, /dev/client)
      if (import.meta.env.DEV) {
        const devRole = localStorage.getItem(DEV_BYPASS_ROLE_KEY);
        if (devRole && ["CLIENT", "ADMIN", "SUPERADMIN"].includes(devRole)) {
          setUser({
            id: "dev-bypass-user",
            email: `dev-${devRole.toLowerCase()}@localhost`,
            full_name: `Dev ${devRole}`,
            role: devRole,
          });
          setClient(null);
          setAccessToken(null);
          setLoading(false);
          return;
        }
      }

      if (session) {
        try {
          const profile = await getMe(session.access_token);
          const authUser = { id: session.user.id, email: session.user.email, ...profile };
          setUser(authUser);
          setAccessToken(session.access_token);

          // Fetch client data by profile_id
          try {
            const clientData = await getClientByProfileId(session.user.id, session.access_token);
            setClient(clientData);
          } catch {
            setClient(null);
          }
        } catch {
          await supabase.auth.signOut();
          setUser(null);
          setClient(null);
          setAccessToken(null);
        }
      }

      setLoading(false);
    };

    init();
  }, []);

  const signIn = async (email, password, remember) => {
    setRememberMode(remember);

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      throw new Error(error.message);
    }

    const profile = await getMe(data.session.access_token);
    const authUser = { id: data.user.id, email: data.user.email, ...profile };

    // Fetch client data by profile_id
    let clientData = null;
    try {
      clientData = await getClientByProfileId(data.user.id, data.session.access_token);
    } catch {
      clientData = null;
    }

    setUser(authUser);
    setClient(clientData);
    setAccessToken(data.session.access_token);

    return authUser;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(DEV_BYPASS_ROLE_KEY);
    setUser(null);
    setClient(null);
    setAccessToken(null);
  };

  const isProfileComplete = useMemo(() => {
    if (!client) return false;
    return !!(
      client.company_name &&
      client.pic_name &&
      client.email &&
      client.phone &&
      client.address
    );
  }, [client]);

  return (
    <AuthContext.Provider value={{ user, client, accessToken, loading, signIn, signOut, isProfileComplete }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}