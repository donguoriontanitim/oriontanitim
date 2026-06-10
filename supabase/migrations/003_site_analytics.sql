create table if not exists public.site_analytics (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  event_type text not null,
  section_id text,
  path text,
  referrer text,
  device_type text,
  viewport_width int,
  viewport_height int,
  duration_ms int default 0,
  user_agent text,
  created_at timestamptz default now(),
  constraint site_analytics_event_type_check check (
    event_type in ('page_view', 'section_view')
  )
);

create index if not exists site_analytics_created_at_idx on public.site_analytics (created_at desc);
create index if not exists site_analytics_session_idx on public.site_analytics (session_id);
create index if not exists site_analytics_section_idx on public.site_analytics (section_id);
create index if not exists site_analytics_event_type_idx on public.site_analytics (event_type);

alter table public.site_analytics enable row level security;

drop policy if exists "Public can insert site analytics" on public.site_analytics;
create policy "Public can insert site analytics"
on public.site_analytics
for insert
to anon, authenticated
with check (event_type in ('page_view', 'section_view'));

drop policy if exists "Authenticated admins can read site analytics" on public.site_analytics;
create policy "Authenticated admins can read site analytics"
on public.site_analytics
for select
to authenticated
using (auth.role() = 'authenticated');
