export function getCloudConfig(env = import.meta.env) {
  const supabaseUrl =
    env.VITE_SUPABASE_URL ?? env.NEXT_PUBLIC_SALES_FOLLOWUP_SUPABASE_URL ?? "";
  const supabaseAnonKey =
    env.VITE_SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SALES_FOLLOWUP_SUPABASE_ANON_KEY ??
    env.NEXT_PUBLIC_SALES_FOLLOWUP_SUPABASE_PUBLISHABLE_KEY ??
    "";
  const stripePriceId = env.VITE_STRIPE_PRICE_ID ?? "";

  return {
    supabaseUrl,
    supabaseAnonKey,
    stripePriceId,
    isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    isBillingConfigured: Boolean(supabaseUrl && supabaseAnonKey && stripePriceId),
  };
}
