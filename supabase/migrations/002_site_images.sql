create extension if not exists pgcrypto;

create table if not exists public.site_images (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  alt_text text,
  image_url text not null,
  storage_path text,
  usage_area text not null,
  related_key text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint site_images_usage_area_check check (
    usage_area in (
      'hero_desktop',
      'hero_mobile',
      'partner_logo',
      'summary_card',
      'program_card',
      'why_orion_card',
      'daily_flow',
      'gallery',
      'contact_robot',
      'contact_panel_image',
      'decoration',
      'footer_decoration'
    )
  )
);

alter table public.site_images drop constraint if exists site_images_usage_area_check;
alter table public.site_images add constraint site_images_usage_area_check check (
  usage_area in (
    'hero_desktop',
    'hero_mobile',
    'partner_logo',
    'summary_card',
    'program_card',
    'why_orion_card',
    'daily_flow',
    'gallery',
    'contact_robot',
    'contact_panel_image',
    'decoration',
    'footer_decoration'
  )
);

create index if not exists site_images_usage_area_idx on public.site_images (usage_area);
create index if not exists site_images_related_key_idx on public.site_images (related_key);
create index if not exists site_images_active_sort_idx on public.site_images (is_active, usage_area, sort_order);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_images_updated_at on public.site_images;
create trigger set_site_images_updated_at
before update on public.site_images
for each row execute function public.set_updated_at();

alter table public.site_images enable row level security;

drop policy if exists "Public can read active site images" on public.site_images;
create policy "Public can read active site images"
on public.site_images
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Authenticated admins can manage site images" on public.site_images;
create policy "Authenticated admins can manage site images"
on public.site_images
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('orion-assets', 'orion-assets', true)
on conflict (id) do update
set public = excluded.public,
    name = excluded.name;

drop policy if exists "Public can read orion assets" on storage.objects;
create policy "Public can read orion assets"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'orion-assets');

drop policy if exists "Authenticated admins can upload orion assets" on storage.objects;
create policy "Authenticated admins can upload orion assets"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'orion-assets' and auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can update orion assets" on storage.objects;
create policy "Authenticated admins can update orion assets"
on storage.objects
for update
to authenticated
using (bucket_id = 'orion-assets' and auth.role() = 'authenticated')
with check (bucket_id = 'orion-assets' and auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can delete orion assets" on storage.objects;
create policy "Authenticated admins can delete orion assets"
on storage.objects
for delete
to authenticated
using (bucket_id = 'orion-assets' and auth.role() = 'authenticated');
