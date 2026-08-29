# My Site

A personal website built with Next.js.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the site.

## Deployment

This site is deployed on Vercel.

## Fractal gallery backend

The public fractal gallery uses Supabase Postgres for metadata and Supabase
Storage for PNG files. To connect it:

1. Create a Supabase project and run `supabase/fractal-gallery.sql` in its SQL
   Editor.
2. Add these server-side environment variables to Vercel (Preview and
   Production), then redeploy:

   ```text
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   ```

   A legacy `SUPABASE_SERVICE_ROLE_KEY` also works. Never prefix either secret
   with `NEXT_PUBLIC_`.
3. If the bucket name is changed from `fractal-gallery`, set
   `SUPABASE_FRACTAL_BUCKET` and make the same change in the SQL setup file.

Uploads are validated as PNGs, capped at 6 MB, and limited to three per IP in
15 minutes. Visitors can read the shuffled feed only through the site API;
direct database writes and Storage uploads remain closed.
