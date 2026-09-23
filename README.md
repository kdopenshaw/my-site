# My Site

A personal website built with Next.js.

## Development

```bash
npm run dev
```

This starts plain Next.js for the usual frontend workflow. Open
[http://localhost:3000](http://localhost:3000) to view the site. To serve the
Python fractal function under `api/` as well, run `npm run dev:apis`. The first
run may prompt you to install the Vercel CLI and link this checkout to the
Vercel project.

The Python function targets Python 3.12. Install Python 3.12 locally before
running the Vercel dev server.

## Styles

`app/globals.css` owns design tokens, element defaults, accessibility, and the
shared page shell, title, button, and image-grid primitives. Feature styles and
their responsive rules live in CSS modules beside the page or component that
uses them. MDX prose and PDF styles belong to their renderers; PDF vendor styles
are imported by the reader. Reuse global tokens instead of adding local palettes,
font scales, or copies of shared patterns.

## Deployment

This site is deployed on Vercel.

## Fractal gallery backend

The public fractal gallery uses Supabase Postgres for metadata and Supabase
Storage for PNG files. To connect it:

1. Create a Supabase project and run `supabase/fractal-gallery.sql` in its SQL
   Editor.
   Rerun this idempotent setup file after pulling gallery schema updates, such
   as support for additional fractal families.
2. Put the same server-side environment variables in `.env.local` for local
   development, and in Vercel (Preview and Production) for deployments:

   ```text
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

   Copy `.env.example` to `.env.local` and fill in your project URL and secret
   key. `.env.local` is ignored by Git. A legacy
   `SUPABASE_SERVICE_ROLE_KEY` also works. Never prefix either secret with
   `NEXT_PUBLIC_`.
3. If the bucket name is changed from `fractal-gallery`, set
   `SUPABASE_FRACTAL_BUCKET` and make the same change in the SQL setup file.

Uploads are validated as PNGs, capped at 6 MB, and limited to three per IP in
15 minutes. Visitors can read the shuffled feed only through the site API;
direct database writes and Storage uploads remain closed.
