import { createContext, useContext, useEffect, useState } from "react";
import { supabase, setRememberMode } from "../lib/supabaseClient";
import { getMe } from "../services/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data.session;

      if (session) {
        try {
          const profile = await getMe(session.access_token);
          setUser({ id: session.user.id, email: session.user.email, ...profile });
        } catch {
          await supabase.auth.signOut();
          setUser(null);
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

    setUser(authUser);

    return authUser;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}