# My Site

Keith Openshaw's personal site. It uses the Next.js App Router, React, and plain CSS.

## Start here

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Where a page lives

A folder with `page.tsx` is a page. The folder name is the URL. `app/layout.tsx` wraps every page with the fonts and the menu.

| URL | File |
| --- | --- |
| `/` | `app/page.tsx` |
| `/content` | `app/content/page.tsx` |
| `/content/some-post` | `app/content/posts/some-post.mdx` |
| `/fractals` | `app/fractals/page.tsx` |
| `/blacksmithing` | `app/blacksmithing/page.tsx` |

Files next to `layout.tsx` (`navigation.tsx`, `globals.css`) are shared by the whole site. Everything else stays in the folder of the page that uses it.

### Rules to follow

1. Pages render on the server. Put `"use client"` at the top of a file only when it needs state, clicks, or the browser. `app/home-fractal.tsx` is the small example. `app/blacksmithing/page.tsx` is a server page.
2. Colors, type, and spacing come from the variables at the top of `app/globals.css`. Use those variables. Do not add raw colors in a page.
3. Layout for one component lives in the `*.module.css` file next to it. Classes used by more than one page (`.page-shell`, `.heading-accent`, `.image-grid`, `.button`, `.button-outline`) live at the bottom of `globals.css`.
4. Use normal HTML for links, buttons, and form fields. Copy an existing page instead of adding a component library.
5. There are two `api` folders. `app/api/` is Next.js. `api/fractal.py` is Python and is not started by `npm run dev`.

### Add a page

1. Create `app/your-page/page.tsx` that returns an `<h1>`.
2. For a reading page, wrap it in `<section className="page-shell">`.
3. Add `{ href: "/your-page", label: "Your page" }` to the `links` list in `app/navigation.tsx`.

### Add a piece of writing

1. Copy a file in `app/content/posts/`.
2. The filename, without `.mdx`, becomes the URL.
3. Keep the block at the top. `title` and `publishedAt` are required. `summary` is optional and used for link previews.
4. Put a PDF in `public/content/`, then embed it with `<PdfDocument href="/content/your.pdf" title="Your title" />`.

### Fractal generator

`npm run dev` serves the site only. Generate fractal needs the Python function in `api/fractal.py` (Python 3.12, see `.python-version`):

```bash
npm run dev:apis
```

The first run may install the Vercel CLI and ask you to link this checkout to the Vercel project.

Dev and production builds write to different folders on purpose (`.next-dev` and `.next`, set in `next.config.ts`) so a production build does not wipe a running preview.

## Stock backtester

`/projects/stock-backtester` ports the RSI and SMA strategies and market overview
from `kdopenshaw/websitepythonanywhere` into this Next.js app. The original checkout
is at `../websitepythonanywhere`; Flask and pandas are not required here.
Plotly is loaded in the browser for interactive charts.

Set `ALPACA_API_KEY` and `ALPACA_SECRET_KEY` in `.env.local` and in the deployment's
server environment. Use fresh keys: the original repository contains hardcoded
credentials, which should be revoked/rotated. Do not prefix these settings with
`NEXT_PUBLIC_` or commit them. `ALPACA_DATA_FEED` defaults to `iex`; `sip` requires
appropriate data access. The server reads daily, split-adjusted prices from
[Alpaca's historical bars API](https://docs.alpaca.markets/us/reference/stockbars),
following pagination and caching price requests for one hour. No trading API is used.

The form supports up to five symbols, five years per run, 2–200-session indicators,
custom buy/sell thresholds, and initial cash. The original page organization is retained: a home page with market overview,
`/rsi` and `/sma` basic strategy pages, `/rsi/custom` and `/sma/custom` parameter
forms, and a dedicated `/results` page, all under `/projects/stock-backtester`.
Basic forms retain the original defaults (RSI 14/30/65; SMA 14/2%/5%).
Results URLs carry the parameters, so they can be reloaded or shared; data is
recalculated by the server. Charts support hover, drag-to-zoom, and reset, with
accessible value tables. Desktop results pair charts with key metrics and trade
logs with position statistics; the columns stack on smaller screens.
RSI uses rolling averages as in the original, not Wilder smoothing. Flat prices
produce neutral RSI 50. Prior sessions warm up the indicators.

Accounting is intentionally corrected: all symbols share cash on a chronological
timeline; buys require available cash; sales appear for every symbol; open shares
are valued at the last available close. Signals execute at the next session's open
to avoid using the same close for both a decision and a fill. Sales happen before
buys, with alphabetical buy priority. Each purchase is one split-adjusted share.
Dividends, fees, slippage, taxes, and interest are excluded. The original
trade-return-based Sharpe calculation is omitted; the new metrics include equity
drawdown, realized/unrealized gains, and closed-trade win rate instead.

`npm run dev` serves both the UI and the stock API; no Python process is needed.
Run the focused checks with Node 24+: `node --test tests/stock-backtester.test.mjs`.

## Fractal gallery

Create a Supabase project and run `supabase/fractal-gallery.sql` in the SQL Editor. Rerun that file after pulling gallery schema changes; it is idempotent.

Set these in `.env.local` for local development, and in Vercel Preview and Production:

```text
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
```

`.env.local` is gitignored. `SUPABASE_SERVICE_ROLE_KEY` still works as a legacy name. Keep either secret server-side; a `NEXT_PUBLIC_` prefix would expose it.

The storage bucket is `fractal-gallery`. A different name needs `SUPABASE_FRACTAL_BUCKET` and the same change in the SQL file.

Uploads are PNGs, at most 6 MB, and three per IP every 15 minutes. Visitors read the gallery through the site API.
