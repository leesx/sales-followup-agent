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
});
