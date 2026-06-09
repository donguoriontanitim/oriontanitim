create extension if not exists pgcrypto;

create table if not exists public.site_contents (
  id uuid primary key default gen_random_uuid(),
  section_key text not null,
  content_key text not null,
  content_value text,
  content_type text default 'text',
  is_html boolean default false,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint site_contents_section_content_unique unique (section_key, content_key)
);

create table if not exists public.program_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  icon_name text,
  color_class text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  title text,
  description text,
  image_url text not null,
  storage_path text,
  alt_text text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  is_html boolean default true,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  parent_name text not null,
  phone text not null,
  student_age text,
  interests text[],
  message text,
  kvkk_approved boolean default false,
  status text default 'Yeni',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint contact_requests_status_check check (
    status in (
      'Yeni',
      'Arandı',
      'Görüşüldü',
      'Kayıt Düşünüyor',
      'Kayıt Oldu',
      'Uygun Değil'
    )
  )
);

alter table public.site_contents add column if not exists id uuid default gen_random_uuid();
alter table public.site_contents add column if not exists section_key text;
alter table public.site_contents add column if not exists content_key text;
alter table public.site_contents add column if not exists content_value text;
alter table public.site_contents add column if not exists content_type text default 'text';
alter table public.site_contents add column if not exists is_html boolean default false;
alter table public.site_contents add column if not exists is_active boolean default true;
alter table public.site_contents add column if not exists sort_order int default 0;
alter table public.site_contents add column if not exists created_at timestamptz default now();
alter table public.site_contents add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'site_contents'
      and column_name = 'key'
  ) then
    execute 'update public.site_contents
      set section_key = coalesce(section_key, split_part("key", ''.'', 1)),
          content_key = coalesce(content_key, coalesce(nullif(split_part("key", ''.'', 2), ''''), ''body''))
      where section_key is null or content_key is null';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'site_contents'
      and column_name = 'html'
  ) then
    execute 'update public.site_contents
      set content_value = coalesce(content_value, html),
          content_type = ''html'',
          is_html = true
      where content_value is null';
  end if;
end;
$$;

update public.site_contents set id = gen_random_uuid() where id is null;
update public.site_contents set section_key = 'legacy' where section_key is null or section_key = '';
update public.site_contents set content_key = id::text where content_key is null or content_key = '';
update public.site_contents set content_type = 'text' where content_type is null or content_type = '';
update public.site_contents set is_html = false where is_html is null;
update public.site_contents set is_active = true where is_active is null;
update public.site_contents set sort_order = 0 where sort_order is null;

alter table public.site_contents alter column id set default gen_random_uuid();
alter table public.site_contents alter column id set not null;
alter table public.site_contents alter column section_key set not null;
alter table public.site_contents alter column content_key set not null;
alter table public.site_contents alter column content_type set default 'text';
alter table public.site_contents alter column is_html set default false;
alter table public.site_contents alter column is_active set default true;
alter table public.site_contents alter column sort_order set default 0;
alter table public.site_contents alter column created_at set default now();
alter table public.site_contents alter column updated_at set default now();

do $$
declare
  current_pk text;
  current_pk_cols smallint[];
  id_attnum smallint;
begin
  select attnum
  into id_attnum
  from pg_attribute
  where attrelid = 'public.site_contents'::regclass
    and attname = 'id';

  select conname, conkey
  into current_pk, current_pk_cols
  from pg_constraint
  where conrelid = 'public.site_contents'::regclass
    and contype = 'p'
  limit 1;

  if current_pk is not null and current_pk_cols <> array[id_attnum]::smallint[] then
    execute format('alter table public.site_contents drop constraint %I', current_pk);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.site_contents'::regclass
      and contype = 'p'
  ) then
    alter table public.site_contents add constraint site_contents_pkey primary key (id);
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.site_contents'::regclass
      and conname = 'site_contents_section_content_unique'
  ) then
    alter table public.site_contents
      add constraint site_contents_section_content_unique unique (section_key, content_key);
  end if;
end;
$$;

alter table public.program_items add column if not exists description text;
alter table public.program_items add column if not exists icon_name text;
alter table public.program_items add column if not exists color_class text;
alter table public.program_items add column if not exists sort_order int default 0;
alter table public.program_items add column if not exists is_active boolean default true;
alter table public.program_items add column if not exists created_at timestamptz default now();
alter table public.program_items add column if not exists updated_at timestamptz default now();
alter table public.program_items alter column description drop not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'program_items'
      and column_name = 'icon'
  ) then
    execute 'update public.program_items set icon_name = coalesce(icon_name, icon)';
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'program_items'
      and column_name = 'position'
  ) then
    execute 'update public.program_items set sort_order = coalesce(sort_order, position)';
  end if;
end;
$$;

alter table public.gallery_images add column if not exists title text;
alter table public.gallery_images add column if not exists description text;
alter table public.gallery_images add column if not exists storage_path text;
alter table public.gallery_images add column if not exists alt_text text;
alter table public.gallery_images add column if not exists sort_order int default 0;
alter table public.gallery_images add column if not exists is_active boolean default true;
alter table public.gallery_images add column if not exists created_at timestamptz default now();
alter table public.gallery_images add column if not exists updated_at timestamptz default now();
alter table public.gallery_images alter column title drop not null;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gallery_images'
      and column_name = 'alt'
  ) then
    execute 'update public.gallery_images set alt_text = coalesce(alt_text, alt)';
  end if;
end;
$$;

alter table public.faq_items add column if not exists is_html boolean default true;
alter table public.faq_items add column if not exists sort_order int default 0;
alter table public.faq_items add column if not exists is_active boolean default true;
alter table public.faq_items add column if not exists created_at timestamptz default now();
alter table public.faq_items add column if not exists updated_at timestamptz default now();

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'faq_items'
      and column_name = 'position'
  ) then
    execute 'update public.faq_items set sort_order = coalesce(sort_order, position)';
  end if;
end;
$$;

alter table public.contact_requests add column if not exists interests text[];
alter table public.contact_requests add column if not exists student_age text;
alter table public.contact_requests add column if not exists message text;
alter table public.contact_requests add column if not exists kvkk_approved boolean default false;
alter table public.contact_requests add column if not exists status text default 'Yeni';
alter table public.contact_requests add column if not exists created_at timestamptz default now();
alter table public.contact_requests add column if not exists updated_at timestamptz default now();
alter table public.contact_requests alter column student_age type text using student_age::text;
alter table public.contact_requests alter column kvkk_approved drop not null;
alter table public.contact_requests alter column kvkk_approved set default false;
alter table public.contact_requests alter column status set default 'Yeni';

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'contact_requests'
      and column_name = 'interested_areas'
  ) then
    execute 'update public.contact_requests set interests = coalesce(interests, interested_areas)';
  end if;
end;
$$;

update public.contact_requests
set status = case status
  when 'new' then 'Yeni'
  when 'contacted' then 'Arandı'
  when 'planned' then 'Görüşüldü'
  when 'closed' then 'Kayıt Oldu'
  when 'Yeni' then 'Yeni'
  when 'Arandı' then 'Arandı'
  when 'Görüşüldü' then 'Görüşüldü'
  when 'Kayıt Düşünüyor' then 'Kayıt Düşünüyor'
  when 'Kayıt Oldu' then 'Kayıt Oldu'
  when 'Uygun Değil' then 'Uygun Değil'
  else 'Yeni'
end
where status is not null;

alter table public.contact_requests drop constraint if exists contact_requests_status_check;
alter table public.contact_requests add constraint contact_requests_status_check check (
  status in (
    'Yeni',
    'Arandı',
    'Görüşüldü',
    'Kayıt Düşünüyor',
    'Kayıt Oldu',
    'Uygun Değil'
  )
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_site_contents_updated_at on public.site_contents;
create trigger set_site_contents_updated_at
before update on public.site_contents
for each row execute function public.set_updated_at();

drop trigger if exists set_program_items_updated_at on public.program_items;
create trigger set_program_items_updated_at
before update on public.program_items
for each row execute function public.set_updated_at();

drop trigger if exists set_gallery_images_updated_at on public.gallery_images;
create trigger set_gallery_images_updated_at
before update on public.gallery_images
for each row execute function public.set_updated_at();

drop trigger if exists set_faq_items_updated_at on public.faq_items;
create trigger set_faq_items_updated_at
before update on public.faq_items
for each row execute function public.set_updated_at();

drop trigger if exists set_contact_requests_updated_at on public.contact_requests;
create trigger set_contact_requests_updated_at
before update on public.contact_requests
for each row execute function public.set_updated_at();

alter table public.site_contents enable row level security;
alter table public.program_items enable row level security;
alter table public.gallery_images enable row level security;
alter table public.faq_items enable row level security;
alter table public.contact_requests enable row level security;

drop policy if exists "Public can read active site contents" on public.site_contents;
create policy "Public can read active site contents"
on public.site_contents
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Authenticated admins can manage site contents" on public.site_contents;
create policy "Authenticated admins can manage site contents"
on public.site_contents
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Public can read active program items" on public.program_items;
create policy "Public can read active program items"
on public.program_items
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Authenticated admins can manage program items" on public.program_items;
create policy "Authenticated admins can manage program items"
on public.program_items
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Public can read active gallery images" on public.gallery_images;
create policy "Public can read active gallery images"
on public.gallery_images
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Authenticated admins can manage gallery images" on public.gallery_images;
create policy "Authenticated admins can manage gallery images"
on public.gallery_images
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Public can read active faq items" on public.faq_items;
create policy "Public can read active faq items"
on public.faq_items
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Authenticated admins can manage faq items" on public.faq_items;
create policy "Authenticated admins can manage faq items"
on public.faq_items
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Public can insert contact requests" on public.contact_requests;
create policy "Public can insert contact requests"
on public.contact_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "Authenticated admins can manage contact requests" on public.contact_requests;
create policy "Authenticated admins can manage contact requests"
on public.contact_requests
for all
to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

insert into storage.buckets (id, name, public)
values ('gallery', 'gallery', true)
on conflict (id) do update
set public = excluded.public,
    name = excluded.name;

drop policy if exists "Public can read gallery storage objects" on storage.objects;
create policy "Public can read gallery storage objects"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'gallery');

drop policy if exists "Authenticated admins can upload gallery storage objects" on storage.objects;
create policy "Authenticated admins can upload gallery storage objects"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'gallery' and auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can update gallery storage objects" on storage.objects;
create policy "Authenticated admins can update gallery storage objects"
on storage.objects
for update
to authenticated
using (bucket_id = 'gallery' and auth.role() = 'authenticated')
with check (bucket_id = 'gallery' and auth.role() = 'authenticated');

drop policy if exists "Authenticated admins can delete gallery storage objects" on storage.objects;
create policy "Authenticated admins can delete gallery storage objects"
on storage.objects
for delete
to authenticated
using (bucket_id = 'gallery' and auth.role() = 'authenticated');

insert into public.site_contents (
  section_key,
  content_key,
  content_value,
  content_type,
  is_html,
  sort_order
)
values
  ('hero', 'title', 'ORION KAMP 2026', 'text', false, 10),
  ('hero', 'subtitle', '7–13 yaş çocuklar için teknoloji, spor ve eğlence dolu yaz kampı.', 'text', false, 20),
  ('hero', 'primary_button', 'WhatsApp’tan Bilgi Al', 'text', false, 30),
  ('hero', 'secondary_button', 'Programı İncele', 'text', false, 40),
  ('contact', 'title', 'Sizi Arayalım, Detayları Birlikte Planlayalım', 'text', false, 10),
  ('contact', 'description', 'Orion Kamp 2026 hakkında detaylı bilgi almak için formu doldurun, ekibimiz sizinle iletişime geçsin.', 'text', false, 20),
  ('footer', 'phone_1', '0 (532) 723 66 48', 'text', false, 10),
  ('footer', 'phone_2', '0 (532) 603 66 48', 'text', false, 20),
  ('footer', 'email', 'dongusoft@gmail.com', 'text', false, 30),
  ('footer', 'instagram', '@dongu.akademi', 'text', false, 40),
  ('footer', 'address', 'Gazipaşa Mah. Yavuz Selim Blv. Mustafa Köstereli İş Mrk. Kat:2 No:10 Ortahisar/Trabzon', 'text', false, 50)
on conflict (section_key, content_key) do update
set content_value = excluded.content_value,
    content_type = excluded.content_type,
    is_html = excluded.is_html,
    sort_order = excluded.sort_order,
    updated_at = now();

with seed_programs (title, description, icon_name, color_class, sort_order) as (
  values
    ('Oyun Tasarımı', 'Çocuklar kendi oyun fikirlerini kurgular ve oyun mantığını keşfeder.', 'Gamepad2', 'cyan', 10),
    ('Arduino Robotik Kodlama', 'Sensörler, motorlar ve temel kodlama ile üretim becerisi gelişir.', 'Bot', 'emerald', 20),
    ('3D Tasarım', 'Hayal edilen nesneler dijital ortamda modellenir.', 'Box', 'amber', 30),
    ('Blok Tabanlı Kodlama', 'Algoritmik düşünme oyunlaştırılmış görevlerle öğrenilir.', 'Blocks', 'fuchsia', 40),
    ('Yüzme', 'Yaz enerjisi güvenli ve keyifli havuz etkinlikleriyle desteklenir.', 'Waves', 'sky', 50),
    ('Jimnastik', 'Koordinasyon, esneklik ve beden farkındalığı güçlenir.', 'Activity', 'rose', 60),
    ('Futbol', 'Takım ruhu ve hareketli oyunlarla sosyal beceriler gelişir.', 'CircleDot', 'lime', 70),
    ('Resim', 'Renk, çizgi ve hayal gücüyle yaratıcı ifade alanı açılır.', 'Palette', 'orange', 80),
    ('İngilizce Etkinlikler', 'Günlük ifadeler oyun, drama ve mini görevlerle pratik edilir.', 'Languages', 'indigo', 90),
    ('Oyunlaştırılmış Matematik', 'Problem çözme ve mantık yürütme eğlenceli meydan okumalarla gelişir.', 'Sigma', 'violet', 100)
)
insert into public.program_items (title, description, icon_name, color_class, sort_order)
select title, description, icon_name, color_class, sort_order
from seed_programs seed
where not exists (
  select 1
  from public.program_items item
  where item.title = seed.title
);

with seed_faqs (question, answer, sort_order) as (
  values
    ('Orion Kamp hangi yaş grubuna uygundur?', 'Orion Kamp 2026, 7–13 yaş aralığındaki çocuklar için uygundur.', 10),
    ('Programda yüzme etkinliği var mı?', 'Evet. Program akışında yüzme etkinlikleri de yer alır.', 20),
    ('Etkinlikler sadece teknoloji odaklı mı?', 'Hayır. Teknoloji atölyelerinin yanında spor, sanat, İngilizce ve oyunlaştırılmış matematik etkinlikleri bulunur.', 30),
    ('Kontenjan sınırlı mı?', 'Evet. Grup kalitesini korumak için kontenjanlar sınırlı tutulur.', 40),
    ('Detaylı bilgi nasıl alabilirim?', 'İletişim formunu doldurabilir veya WhatsApp üzerinden ekibimizle görüşebilirsiniz.', 50)
)
insert into public.faq_items (question, answer, sort_order, is_html)
select question, answer, sort_order, true
from seed_faqs seed
where not exists (
  select 1
  from public.faq_items item
  where item.question = seed.question
);
