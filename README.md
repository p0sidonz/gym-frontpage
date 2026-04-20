# Fetch Fitness — marketing landing (Next.js)

This folder is a **Next.js** app that mirrors the public SaaS landing from the main Vite app. Deploy it on your **root domain** (e.g. `https://fetchfitness.com`) and point **`NEXT_PUBLIC_APP_URL`** at your **app** host (e.g. `https://my.fetchfitness.com`) so **Log in**, **Register**, and post-checkout flows open on `my.[domain]`.

## Setup

```bash
cd landing
cp .env.example .env.local
# Fill in Supabase, Razorpay, and NEXT_PUBLIC_APP_URL
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

For local end-to-end testing with the Vite app on port 5173:

```env
NEXT_PUBLIC_APP_URL=http://localhost:5173
```

## Production

- Build: `npm run build`
- Start: `npm run start`
- Configure DNS: apex or `www` → this Next deployment; `my` (or your chosen subdomain) → main React app.

Shared behavior (plans, feature cards, enquiries) uses the same Supabase project as the main application. **Paid plans** on the landing send users to the app at **`/checkout?planId=…`** (see main Vite app). **Razorpay webhooks** for this repo live in **`landing/`** at **`POST /razor-hook`** (see below). `/api/razorpay-webhook` is an alias.

## Razorpay webhooks (`landing/app/razor-hook/route.ts`)

1. In Razorpay Dashboard → **Webhooks**, set URL to: **`https://<your-marketing-domain>/razor-hook`**
2. Subscribe to **`payment.captured`** and **`payment.failed`**.
3. Set **`RAZORPAY_WEBHOOK_SECRET`** and **`SUPABASE_SERVICE_ROLE_KEY`** in the server environment (see `landing/.env.example`).

The handler verifies `X-Razorpay-Signature`, then updates `subscription_payments` and `gyms` (same intent as Supabase Edge `verify-payment`). The in-app checkout still verifies immediately; webhooks cover retries and server-to-server events.

If you do not deploy Next.js, use a **Supabase Edge Function** with the same logic instead.

## SEO & data

- **Subscription plans** and **landing feature cards** are loaded in the **server component** (`app/page.tsx`) so the HTML response includes real copy for crawlers. The page uses **`revalidate = 120`** (ISR, 2 minutes) so content stays reasonably fresh.
- **JSON-LD** (`SoftwareApplication` with `featureList` and paid-plan `Offer`s) is emitted on the server for rich results.
- Use **dark/light** toggle in the nav; theme is stored via `next-themes` (`class` on `<html>`).
