import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function readEnv(name: string) {
  return { ...process.env }[name];
}

export function supabaseUrl() {
  return readEnv("SUPABASE_URL") ?? readEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey() {
  return readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") ?? readEnv("SUPABASE_ANON_KEY");
}

function supabaseServiceKey() {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY") ?? readEnv("SUPABASE_SECRET_KEY");
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && supabaseServiceKey());
}

export function supabaseAdmin(): SupabaseClient {
  const url = supabaseUrl();
  const key = supabaseServiceKey();
  if (!url || !key) {
    throw new Error("Supabase is not configured");
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
