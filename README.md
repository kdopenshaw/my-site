# My Site

Personal site built with Next.js. Fractal images are rendered by the Python function in `api/`. The public gallery stores metadata in Supabase Postgres and PNG files in Supabase Storage.

## Development

```bash
npm run dev
```

Opens [http://localhost:3000](http://localhost:3000) and serves the Next.js app.

Fractal rendering needs Python 3.12 (`.python-version`). To serve `api/fractal.py` with the app:

```bash
npm run dev:apis
```

The first run may install the Vercel CLI and ask you to link this checkout to the Vercel project.

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
