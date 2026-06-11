alter table public.site_analytics
drop constraint if exists site_analytics_event_type_check;

alter table public.site_analytics
add constraint site_analytics_event_type_check check (
  event_type in ('page_view', 'section_view', 'partner_click')
);

drop policy if exists "Public can insert site analytics" on public.site_analytics;
create policy "Public can insert site analytics"
on public.site_analytics
for insert
to anon, authenticated
with check (event_type in ('page_view', 'section_view', 'partner_click'));
