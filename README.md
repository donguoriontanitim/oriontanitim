# ORION KAMP 2026

React + Vite + Tailwind CSS + Supabase ile hazırlanmış landing page ve admin panel projesi.

## Yerelde Çalıştırma

```bash
npm install
npm run dev
```

Yerel Supabase bağlantısı için proje kökünde `.env` dosyası gerekir. `.env` dosyası GitHub'a gönderilmez; `.gitignore` içinde `.env` satırı bulunur.

```bash
VITE_SUPABASE_URL=https://vigbyqymmxsofjusjlss.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_UzXpltbZBcyfuTDLTeH5DA_4ehqTxus
VITE_PUBLIC_BASE_PATH=/oriontanitim/
VITE_WHATSAPP_PHONE=905327236648
```

## Supabase Bilgileri

Supabase Project URL:

1. Supabase panelinde projeyi açın.
2. Project Settings > API ekranına gidin.
3. Project URL alanındaki değeri `VITE_SUPABASE_URL` olarak kullanın.

Anon public key:

1. Aynı API ekranında Project API keys bölümünü açın.
2. `anon` veya `publishable` public key değerini `VITE_SUPABASE_ANON_KEY` olarak kullanın.
3. Frontend içinde sadece anon/publishable key kullanılmalıdır. `service_role` key kullanılmaz.

## SQL Kurulumu

SQL dosyalarını Supabase > SQL Editor içinde şu sırayla çalıştırın:

1. `supabase-schema.sql`
2. `supabase/migrations/002_site_images.sql`

Bu dosyalar şu tabloları ve policy'leri hazırlar:

- `site_contents`
- `program_items`
- `gallery_images`
- `faq_items`
- `contact_requests`
- `site_images`

Kurallar:

- RLS aktif olur.
- Public kullanıcı sadece aktif landing page verilerini okuyabilir.
- Public kullanıcı `contact_requests` tablosuna kayıt bırakabilir.
- Authenticated kullanıcı admin kabul edilir ve CRUD yapabilir.
- `updated_at` trigger'ları kurulur.

## Storage

Görsel Yönetimi için gerekli bucket:

```bash
orion-assets
```

`supabase/migrations/002_site_images.sql` dosyası bu bucket'ı public olarak oluşturur ve şu policy'leri ekler:

- Public kullanıcı görselleri okuyabilir.
- Authenticated kullanıcı upload/update/delete yapabilir.

Manuel kontrol için:

1. Supabase > Storage ekranına gidin.
2. `orion-assets` bucket var mı kontrol edin.
3. Yoksa New bucket seçin.
4. Bucket name: `orion-assets`
5. Public bucket: aktif

Not: Eski galeri yönetimi için `supabase-schema.sql` ayrıca `gallery` bucket'ını hazırlar.

## Admin Kullanıcısı

Admin kullanıcı Supabase Auth üzerinden manuel oluşturulur:

1. Supabase > Authentication > Users ekranına gidin.
2. Add user seçin.
3. Email ve şifre belirleyin.
4. Admin panelde bu email + şifre ile giriş yapın.

Şimdilik tek admin mantığı kullanılır: `auth.role() = 'authenticated'`.

İstenen admin kullanıcı için uygulama kullanıcı adını şu email'e çevirir:

```bash
orionadmin -> orionadmin@orionkamp.local
```

SQL Editor ile oluşturmak isterseniz:

- Güvenli örnek dosya: `supabase/create-admin-user.example.sql`
- Bu bilgisayarda gerçek şifreyle hazırlanan local dosya: `supabase/local-admin-user.sql`

`supabase/local-admin-user.sql` gerçek şifre içerdiği için GitHub'a gönderilmez.

## GitHub Pages Yayını

Repository:

```bash
https://github.com/donguoriontanitim/oriontanitim
```

Canlı site:

```bash
https://donguoriontanitim.github.io/oriontanitim/
```

GitHub Pages için uygulama `HashRouter` kullanır.

Test URL'leri:

- `https://donguoriontanitim.github.io/oriontanitim/`
- `https://donguoriontanitim.github.io/oriontanitim/#/admin`
- `https://donguoriontanitim.github.io/oriontanitim/#/admin/images`

## GitHub Secrets ve Variables

GitHub repository içinde Settings > Secrets and variables > Actions ekranına gidin.

Secrets:

```bash
VITE_SUPABASE_URL=https://vigbyqymmxsofjusjlss.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_UzXpltbZBcyfuTDLTeH5DA_4ehqTxus
```

Variables:

```bash
VITE_PUBLIC_BASE_PATH=/oriontanitim/
VITE_WHATSAPP_PHONE=905327236648
```

Workflow `.github/workflows/deploy.yml` içinde bu değerleri build env olarak kullanır.

## Veri Akışı

Landing page Supabase bağlıysa aktif kayıtları okur, veri yoksa fallback içerikle çalışır:

- `site_contents`: hero, contact, footer ve yönetilebilir metinler
- `program_items`: program kartları
- `faq_items`: sık sorulan sorular
- `gallery_images`: eski galeri kayıtları
- `site_images`: hero, partner logoları, kamp özeti, neden Orion, program kartı, iletişim panelleri, galeri, dekorasyon ve diğer görsel slotları
- `contact_requests`: iletişim formu kayıtları

Görsel Yönetimi akışı:

1. Dosya seçilir.
2. Kullanım alanı seçilir.
3. Gerekirse related key seçilir.
4. Dosya `orion-assets` bucket içine yüklenir.
5. Public URL alınır.
6. `site_images` tablosuna kayıt atılır.
7. Liste yenilenir.

İletişim formu akışı:

1. KVKK onayı zorunludur.
2. Form `contact_requests` tablosuna kayıt atar.
3. Başarı mesajı gösterilir.
4. Kullanıcı WhatsApp görüşmesine yönlendirilir.

## Komutlar

```bash
npm run dev
npm run lint
npm run build
npm run preview
```
