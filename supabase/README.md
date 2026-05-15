# Supabase Setup

This directory contains the database schema and Edge Functions for the SaaS backend.

## Apply Schema

Install and login to the Supabase CLI, then link a project:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

## Deploy Edge Functions

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

Set function secrets:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxx
supabase secrets set STRIPE_PRICE_ID=price_xxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
supabase secrets set SITE_URL=https://sales-followup-agent.vercel.app
```

The webhook function also needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which are available in deployed Supabase Edge Functions when configured as secrets.
