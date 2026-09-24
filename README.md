# My Site

Keith Openshaw's personal site, built with Next.js, React, and plain CSS.

## Development

Requires Node.js 24 and Python 3.12.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Environment variables are
documented in `.env.example`; keep `.env.local` out of version control.

The fractal renderer runs as a Python function through Vercel's local runtime.
Use this command instead when working on the complete fractal flow:

```bash
npm run dev:apis
```

## Neon

The fractal gallery stores records in Neon Postgres and images in the
`fractal-gallery` Object Storage bucket. Link the local checkout and pull its
credentials with:

```bash
neon link --project-id damp-mountain-06763139 --branch production -y
neon deploy
```

Apply gallery schema changes with:

```bash
npm run db:migrate
```

Set the variables from `.env.example` in Vercel before deploying. Keep database
and storage credentials server-side.

## Checks

```bash
npm run build
node --test tests/stock-backtester.test.mjs
python3 -m unittest tests/test_fractal.py
```
