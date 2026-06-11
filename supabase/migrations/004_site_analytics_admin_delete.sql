drop policy if exists "Authenticated admins can delete site analytics" on public.site_analytics;
create policy "Authenticated admins can delete site analytics"
on public.site_analytics
for delete
to authenticated
using (auth.role() = 'authenticated');
