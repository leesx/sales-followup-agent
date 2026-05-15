import { createClient } from "@supabase/supabase-js";
import { getCloudConfig } from "./cloudConfig.js";

const config = getCloudConfig();

export const supabase = config.isSupabaseConfigured
  ? createClient(config.supabaseUrl, config.supabaseAnonKey)
  : null;

export function getSupabaseClient() {
  return supabase;
}
