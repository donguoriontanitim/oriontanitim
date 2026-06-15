drop policy if exists "Authenticated admins can delete site analytics" on public.site_analytics;
create policy "Authenticated admins can delete site analytics"
on public.site_analytics
for delete
to authenticated
using (auth.role() = 'authenticated');

delete from public.site_analytics
where id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by session_id
        order by created_at desc, id desc
      ) as duplicate_rank
    from public.site_analytics
    where event_type = 'page_view'
      and device_type = 'desktop'
      and session_id is not null
  ) ranked_desktop_page_views
  where duplicate_rank > 1
);
