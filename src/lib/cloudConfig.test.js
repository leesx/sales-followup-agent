import { describe, expect, it } from "vitest";
import { getCloudConfig } from "./cloudConfig.js";

describe("cloudConfig", () => {
  it("keeps cloud features disabled when Supabase env vars are missing", () => {
    const config = getCloudConfig({});

    expect(config.isSupabaseConfigured).toBe(false);
    expect(config.isBillingConfigured).toBe(false);
  });

  it("enables Supabase and billing when required env vars are present", () => {
    const config = getCloudConfig({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_ANON_KEY: "anon-key",
      VITE_STRIPE_PRICE_ID: "price_123",
    });

    expect(config.isSupabaseConfigured).toBe(true);
    expect(config.isBillingConfigured).toBe(true);
  });

  it("supports Vercel Supabase integration public env names", () => {
    const config = getCloudConfig({
      NEXT_PUBLIC_SALES_FOLLOWUP_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SALES_FOLLOWUP_SUPABASE_ANON_KEY: "anon-key",
    });

    expect(config.supabaseUrl).toBe("https://example.supabase.co");
    expect(config.supabaseAnonKey).toBe("anon-key");
    expect(config.isSupabaseConfigured).toBe(true);
    expect(config.isBillingConfigured).toBe(false);
  });

  it("reads an explicit auth redirect URL", () => {
    const config = getCloudConfig({
      VITE_AUTH_REDIRECT_URL: "https://sales.dengyu.xyz",
    });

    expect(config.authRedirectUrl).toBe("https://sales.dengyu.xyz");
  });
});
