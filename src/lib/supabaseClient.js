import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let remember = true;

export function setRememberMode(value) {
  remember = Boolean(value);
}

const dynamicStorage = {
  getItem: (key) => {
    const sessionValue = sessionStorage.getItem(key);
    if (sessionValue) return sessionValue;
    return localStorage.getItem(key);
  },
  setItem: (key, value) => {
    // Simpan hanya di satu storage agar tidak ada dua session aktif berselisih
    // (session lama di storage lain tidak sampai terpilih oleh getItem).
    if (remember) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
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