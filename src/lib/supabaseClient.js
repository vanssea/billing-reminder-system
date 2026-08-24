import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let remember = true;

export function setRememberMode(value) {
  remember = Boolean(value);
}

const dynamicStorage = {
  getItem: (key) => {
    return (
      localStorage.getItem(key) ??
      sessionStorage.getItem(key)
    );
  },
  setItem: (key, value) => {
    (remember ? localStorage : sessionStorage).setItem(key, value);
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: dynamicStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});