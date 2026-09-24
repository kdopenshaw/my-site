# My Site

Keith Openshaw's personal site. Next.js App Router, React, and plain CSS.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local`. Do not commit it, and do not prefix secrets with `NEXT_PUBLIC_`.

Dev and production builds write to `.next-dev` and `.next` so `next build` does not wipe a running preview.

## Fractal generator

`npm run dev` serves the site only. Rendering uses the Python function in `api/fractal.py` (Python 3.12, see `.python-version`):

```bash
npm run dev:apis
```

The first run may install the Vercel CLI and ask you to link this checkout.

## Fractal gallery

Create a Supabase project and run `supabase/fractal-gallery.sql` in the SQL Editor. Rerun that file after gallery schema changes; it is idempotent.

Set `SUPABASE_URL` and `SUPABASE_SECRET_KEY` in `.env.local` and in Vercel. `SUPABASE_SERVICE_ROLE_KEY` still works as a legacy name.

The storage bucket is `fractal-gallery`. A different name needs `SUPABASE_FRACTAL_BUCKET` and the same change in the SQL file.

## Technical threshold backtesting

Set `ALPACA_API_KEY` and `ALPACA_SECRET_KEY` in `.env.local` and in the deployment environment. `ALPACA_DATA_FEED` defaults to `iex`; `sip` needs the matching Alpaca data subscription.

`npm run dev` serves the UI and the stock API. Check the engine with Node 24+:

```bash
node --test tests/stock-backtester.test.mjs
```
