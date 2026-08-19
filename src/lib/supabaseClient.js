import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let remember = true;

export function setRememberMode(value) {
  remember = value;
}

const dynamicStorage = {
  getItem: (key) => (remember ? localStorage : sessionStorage).getItem(key),
  setItem: (key, value) => (remember ? localStorage : sessionStorage).setItem(key, value),
  removeItem: (key) => (remember ? localStorage : sessionStorage).removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: dynamicStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});