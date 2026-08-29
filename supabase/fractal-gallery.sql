-- Run this once in the Supabase SQL Editor for the site's gallery project.

create table if not exists public.fractal_gallery (
  id uuid primary key,
  storage_path text not null unique check (storage_path ~ '^images/[0-9a-f-]+\.png$'),
  width integer not null check (width between 64 and 1200),
  height integer not null check (height between 64 and 1200),
  family text not null constraint fractal_gallery_family_check
    check (family in ('mandelbrot', 'julia', 'burning_ship', 'tricorn', 'newton')),
  power smallint not null check (power between 2 and 8),
  palette text not null check (char_length(palette) between 1 and 64),
  parameters jsonb not null check (jsonb_typeof(parameters) = 'object'),
  status text not null default 'published' check (status in ('published', 'hidden')),
  created_at timestamptz not null default now()
);

-- Keep existing gallery projects in sync when this setup script is rerun.
alter table public.fractal_gallery
  drop constraint if exists fractal_gallery_family_check;
alter table public.fractal_gallery
  add constraint fractal_gallery_family_check
  check (family in ('mandelbrot', 'julia', 'burning_ship', 'tricorn', 'newton'));

create index if not exists fractal_gallery_published_idx
  on public.fractal_gallery (created_at desc)
  where status = 'published';

alter table public.fractal_gallery enable row level security;
revoke all on table public.fractal_gallery from public, anon, authenticated;
grant select, insert, update, delete on table public.fractal_gallery to service_role;

create schema if not exists fractal_gallery_private;
revoke all on schema fractal_gallery_private from public, anon, authenticated;
grant usage on schema fractal_gallery_private to service_role;

create table if not exists fractal_gallery_private.uploads (
  request_hash text not null check (request_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default now()
);

create index if not exists fractal_gallery_uploads_rate_idx
  on fractal_gallery_private.uploads (request_hash, created_at desc);

create index if not exists fractal_gallery_uploads_created_at_idx
  on fractal_gallery_private.uploads (created_at);

alter table fractal_gallery_private.uploads enable row level security;
revoke all on table fractal_gallery_private.uploads from public, anon, authenticated;
grant select, insert, delete on table fractal_gallery_private.uploads to service_role;

create or replace function public.fractal_gallery_page(
  p_seed text,
  p_after_order text default null,
  p_after_id uuid default null,
  p_limit integer default 11
)
returns table (
  id uuid,
  storage_path text,
  width integer,
  height integer,
  family text,
  power smallint,
  palette text,
  created_at timestamptz,
  order_key text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with randomized as (
    select
      gallery.id,
      gallery.storage_path,
      gallery.width,
      gallery.height,
      gallery.family,
      gallery.power,
      gallery.palette,
      gallery.created_at,
      md5(gallery.id::text || ':' || left(p_seed, 100)) as order_key
    from public.fractal_gallery as gallery
    where gallery.status = 'published'
  )
  select randomized.*
  from randomized
  where p_after_order is null
    or (randomized.order_key, randomized.id) > (p_after_order, p_after_id)
  order by randomized.order_key, randomized.id
  limit greatest(1, least(p_limit, 11));
$$;

revoke all on function public.fractal_gallery_page(text, text, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.fractal_gallery_page(text, text, uuid, integer)
  to service_role;

create or replace function public.fractal_gallery_claim_upload(p_request_hash text)
returns boolean
language plpgsql
volatile
security invoker
set search_path = ''
as $$
declare
  recent_uploads integer;
begin
  if p_request_hash !~ '^[0-9a-f]{64}$' then
    return false;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_request_hash, 0));

  delete from fractal_gallery_private.uploads
  where created_at < now() - interval '1 day';

  select count(*)
  into recent_uploads
  from fractal_gallery_private.uploads
  where request_hash = p_request_hash
    and created_at > now() - interval '15 minutes';

  if recent_uploads >= 3 then
    return false;
  end if;

  insert into fractal_gallery_private.uploads (request_hash)
  values (p_request_hash);
  return true;
end;
$$;

revoke all on function public.fractal_gallery_claim_upload(text)
  from public, anon, authenticated;
grant execute on function public.fractal_gallery_claim_upload(text)
  to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fractal-gallery', 'fractal-gallery', true, 6000000, array['image/png'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Uploads go through the site's server-only endpoint with a Supabase secret key.
-- No INSERT/UPDATE/DELETE policy on storage.objects is intentionally created.
