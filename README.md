# ORION KAMP 2026

React + Vite + Tailwind CSS + Supabase ile hazırlanmış landing page ve admin panel projesi.

## Yerelde Çalıştırma

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Rotalar

GitHub Pages uyumluluğu için uygulama `HashRouter` kullanır.

- `#/` landing page
- `#/admin/login` kullanıcı adı ve şifre ile admin girişi
- `#/admin` admin dashboard
- `#/admin/images` görsel yönetimi
- `#/kvkk`, `#/gizlilik-politikasi`, `#/kullanim-sartlari` yasal sayfalar

## Supabase Ayarları

1. `.env.example` dosyasını `.env` olarak kopyalayın.
2. Supabase Project Settings > API ekranından değerleri doldurun:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

3. Yeni kurulum için `supabase-schema.sql` dosyasını Supabase SQL Editor içinde çalıştırın.
4. Görsel yönetimi için ayrıca `supabase/migrations/002_site_images.sql` migration dosyasını çalıştırın.
5. Supabase CLI kullanıyorsanız ana şema `supabase/migrations/20260606143000_production_schema.sql` içindedir.
6. Authentication bölümünden tek admin kullanıcısını oluşturun. Varsayılan kullanıcı adı `admin` ise Supabase Auth e-postası `admin@orionkamp.local` olmalıdır.
7. Storage için `gallery` ve `orion-assets` bucket'ları public olmalıdır. Migration dosyaları bucket kayıtlarını ve RLS policy'lerini oluşturur.

Supabase değişkenleri yoksa landing page fallback verilerle çalışır. Admin panel demo modunda `/admin/login` üzerinden açılır; demo kullanıcı adı/şifre `.env.example` içindeki `VITE_DEMO_ADMIN_USERNAME` ve `VITE_DEMO_ADMIN_PASSWORD` değerleridir.

## GitHub Pages Yayınlama

Bu proje şu repository için hazırlanmıştır:

- Repository: `https://github.com/donguoriontanitim/oriontanitim`
- Canlı adres: `https://donguoriontanitim.github.io/oriontanitim/`
- Base path: `VITE_PUBLIC_BASE_PATH=/oriontanitim/`

1. GitHub'da repository oluşturun.
2. Kodu GitHub'a gönderin.
3. Repository içinde Settings > Pages ekranına gidin.
4. Source olarak `GitHub Actions` seçin.
5. Settings > Secrets and variables > Actions ekranından gerekli secret ve variable değerlerini ekleyin.
6. `main` branch'e push yapın.
7. Actions sekmesinden deploy sonucunu kontrol edin.

## Base Path Ayarı

GitHub Pages için `VITE_PUBLIC_BASE_PATH` repository tipine göre ayarlanmalıdır.

- User/organization site ise: `VITE_PUBLIC_BASE_PATH=/`
- Project site ise: `VITE_PUBLIC_BASE_PATH=/repo-adi/`

Bu project repository için:

```bash
VITE_PUBLIC_BASE_PATH=/oriontanitim/
```

Örnek user site repository:

```bash
VITE_PUBLIC_BASE_PATH=/
```

Bu değer Vite `base` ayarını belirler. Değer verilmezse varsayılan `/` kullanılır.

## GitHub Secrets ve Variables

GitHub repository üzerinde Settings > Secrets and variables > Actions ekranını açın.

Secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Variables:

- `VITE_PUBLIC_BASE_PATH`
- `VITE_WHATSAPP_PHONE`

Örnek variables:

```bash
VITE_PUBLIC_BASE_PATH=/oriontanitim/
VITE_WHATSAPP_PHONE=905327236648
```

## GitHub Actions

`.github/workflows/deploy.yml` workflow dosyası `main` branch'e push yapılınca otomatik çalışır. Manuel çalıştırma da desteklenir.

Workflow adımları:

- Node.js 20 kurulumu
- `npm ci`
- `npm run lint`
- `npm run build`
- `dist` klasörünü GitHub Pages'e deploy

## Komutlar

```bash
npm run dev
npm run lint
npm run build
npm run preview
```
