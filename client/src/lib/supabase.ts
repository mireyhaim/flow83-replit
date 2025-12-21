import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabaseInstance: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient> {
  if (supabaseInstance) return supabaseInstance;
  
  const res = await fetch("/api/config/supabase");
  const config = await res.json();
  
  supabaseInstance = createClient(config.url, config.anonKey);
  return supabaseInstance;
}
