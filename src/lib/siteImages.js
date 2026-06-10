import { isSupabaseConfigured, supabase } from './supabaseClient.js'

export const SITE_IMAGE_BUCKET = 'orion-assets'

export const usageAreaOptions = [
  { value: 'hero_desktop', label: 'Hero Desktop' },
  { value: 'hero_mobile', label: 'Hero Mobile' },
  { value: 'brand_asset', label: 'Logo / Favicon' },
  { value: 'partner_logo', label: 'Hero Partner Logosu' },
  { value: 'summary_card', label: 'Kamp Özeti Kartı' },
  { value: 'program_card', label: 'Program Kartı' },
  { value: 'why_orion_card', label: 'Neden Orion Kartı' },
  { value: 'section_background', label: 'Bölüm Arka Planı' },
  { value: 'daily_flow', label: 'Günlük Akış' },
  { value: 'gallery', label: 'Galeri' },
  { value: 'contact_robot', label: 'İletişim Robotu' },
  { value: 'contact_panel_image', label: 'İletişim Panel Görseli' },
  { value: 'decoration', label: 'Dekorasyon' },
  { value: 'footer_decoration', label: 'Footer Dekorasyonu' },
]

export const relatedKeyOptionsByUsageArea = {
  brand_asset: [
    { value: 'site-logo', label: 'Site Logosu' },
    { value: 'favicon', label: 'Favicon / Tarayıcı İkonu' },
  ],
  section_background: [
    { value: 'hero', label: 'Ana Sayfa / Hero' },
    { value: 'summary', label: 'Kamp Özeti Bölümü' },
    { value: 'program', label: 'Program İçerikleri Bölümü' },
    { value: 'why-orion', label: 'NEDEN ORION? Bölümü' },
    { value: 'daily-flow', label: 'Günlük Akış Bölümü' },
    { value: 'gallery', label: 'Galeri Bölümü' },
    { value: 'faq', label: 'SSS Bölümü' },
    { value: 'contact', label: 'İletişim Bölümü' },
    { value: 'footer', label: 'Footer / Alt Bilgi' },
  ],
  contact_panel_image: [
    { value: 'quick-contact', label: 'Sol Hızlı İletişim Alanı' },
    { value: 'right-panel', label: 'Sağ Görsel Alanı' },
  ],
  partner_logo: [
    { value: 'partner-1', label: 'Partner Logo 1' },
    { value: 'partner-2', label: 'Partner Logo 2' },
    { value: 'partner-3', label: 'Partner Logo 3' },
  ],
  summary_card: [
    { value: 'yas-araligi', label: '7-13 Yaş' },
    { value: 'teknoloji-atolyeleri', label: 'Teknoloji Atölyeleri' },
    { value: 'spor-etkinlikleri', label: 'Spor Etkinlikleri' },
    { value: 'ingilizce-aktiviteler', label: 'İngilizce Aktiviteler' },
    { value: 'yuzme', label: 'Yüzme' },
    { value: 'guvenli-kamp', label: 'Güvenli Kamp' },
  ],
  program_card: [
    { value: 'oyun-tasarimi', label: 'Oyun Tasarımı' },
    { value: 'arduino-robotik-kodlama', label: 'Arduino Robotik Kodlama' },
    { value: '3d-tasarim', label: '3D Tasarım' },
    { value: 'blok-tabanli-kodlama', label: 'Blok Tabanlı Kodlama' },
    { value: 'yuzme', label: 'Yüzme' },
    { value: 'jimnastik', label: 'Jimnastik' },
    { value: 'futbol', label: 'Futbol' },
    { value: 'resim', label: 'Resim' },
    { value: 'ingilizce-etkinlikler', label: 'İngilizce Etkinlikler' },
    { value: 'oyunlastirilmis-matematik', label: 'Oyunlaştırılmış Matematik' },
  ],
  why_orion_card: [
    { value: 'gelecege-hazirlar', label: 'Geleceğe Hazırlar' },
    { value: 'uzman-egitmenler', label: 'Uzman Eğitmenler' },
    { value: 'guvenli-kamp', label: 'Güvenli Kamp' },
    { value: 'sosyal-mutlu-cocuklar', label: 'Sosyal Mutlu Çocuklar' },
    { value: 'eglenerek-ogrenme', label: 'Eğlenerek Öğrenme' },
    { value: 'sertifikali-deneyim', label: 'Sertifikalı Deneyim' },
  ],
  daily_flow: [
    { value: 'karsilama', label: 'Karşılama' },
    { value: 'teknoloji-atolyesi', label: 'Teknoloji Atölyesi' },
    { value: 'oyun-spor-etkinlikleri', label: 'Oyun / Spor Etkinlikleri' },
    { value: 'ogle-arasi', label: 'Öğle Arası' },
    { value: 'yaratici-sanatsal-etkinlikler', label: 'Yaratıcı / Sanatsal Etkinlikler' },
    { value: 'etkinlikler', label: 'Etkinlikler' },
    { value: 'gun-sonu-degerlendirme', label: 'Gün Sonu Değerlendirme' },
  ],
}

const siteImagesSelect =
  'id,title,description,alt_text,image_url,storage_path,usage_area,related_key,sort_order,is_active,created_at,updated_at'

const turkishCharacterMap = {
  Ç: 'C',
  Ğ: 'G',
  İ: 'I',
  I: 'I',
  Ö: 'O',
  Ş: 'S',
  Ü: 'U',
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
}

const relatedKeyAliases = {
  brand_asset: {
    logo: 'site-logo',
    'site-logo': 'site-logo',
    marka: 'site-logo',
    favicon: 'favicon',
    icon: 'favicon',
    ikon: 'favicon',
  },
  section_background: {
    ana: 'hero',
    anasayfa: 'hero',
    home: 'hero',
    ozet: 'summary',
    'kamp-ozeti': 'summary',
    programlar: 'program',
    'program-icerikleri': 'program',
    neden: 'why-orion',
    'neden-orion': 'why-orion',
    akis: 'daily-flow',
    'gunluk-akis': 'daily-flow',
    galeri: 'gallery',
    gallery: 'gallery',
    sss: 'faq',
    faq: 'faq',
    iletisim: 'contact',
    contact: 'contact',
    alt: 'footer',
    footer: 'footer',
  },
  contact_panel_image: {
    contact: 'quick-contact',
    left: 'quick-contact',
    'left-panel': 'quick-contact',
    quick: 'quick-contact',
    right: 'right-panel',
    'side-panel': 'right-panel',
  },
  partner_logo: {
    'logo-1': 'partner-1',
    'logo-2': 'partner-2',
    'logo-3': 'partner-3',
  },
  summary_card: {
    '7-13': 'yas-araligi',
    '7-13-yas': 'yas-araligi',
    age: 'yas-araligi',
    security: 'guvenli-kamp',
    sport: 'spor-etkinlikleri',
    sports: 'spor-etkinlikleri',
    swimming: 'yuzme',
    technology: 'teknoloji-atolyeleri',
  },
  program_card: {
    arduino: 'arduino-robotik-kodlama',
    '3d-design': '3d-tasarim',
    'block-coding': 'blok-tabanli-kodlama',
    english: 'ingilizce-etkinlikler',
    football: 'futbol',
    'game-design': 'oyun-tasarimi',
    gymnastics: 'jimnastik',
    math: 'oyunlastirilmis-matematik',
    painting: 'resim',
    swimming: 'yuzme',
  },
  why_orion_card: {
    'certified-experience': 'sertifikali-deneyim',
    'expert-trainers': 'uzman-egitmenler',
    'future-ready': 'gelecege-hazirlar',
    'learn-with-fun': 'eglenerek-ogrenme',
    'safe-comfortable': 'guvenli-kamp',
    'social-happy': 'sosyal-mutlu-cocuklar',
  },
  daily_flow: {
    activities: 'etkinlikler',
    'creative-art': 'yaratici-sanatsal-etkinlikler',
    'day-review': 'gun-sonu-degerlendirme',
    'game-sports': 'oyun-spor-etkinlikleri',
    lunch: 'ogle-arasi',
    'technology-workshop': 'teknoloji-atolyesi',
    welcome: 'karsilama',
  },
}

const toAscii = (value = '') =>
  String(value)
    .replace(/[ÇĞİIÖŞÜçğıöşü]/g, (character) => turkishCharacterMap[character] || character)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

export const slugifyKey = (value = '') =>
  toAscii(value)
    .toLowerCase()
    .trim()
    .replace(/&/g, ' ve ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export const cleanFileName = (fileName = 'image') => {
  const safeName = toAscii(fileName).toLowerCase().trim()
  const parts = safeName.split('.')
  const extension = parts.length > 1 ? parts.pop().replace(/[^a-z0-9]/g, '') : ''
  const baseName = (parts.join('.') || 'image')
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[.-]+|[.-]+$/g, '')

  return `${baseName || 'image'}${extension ? `.${extension}` : ''}`
}

export const createSiteImageStoragePath = (usageArea, fileName, timestamp = Date.now()) =>
  `${usageArea}/${timestamp}-${cleanFileName(fileName)}`

export const filterImagesByUsageArea = (images = [], usageArea) =>
  images
    .filter((image) => image?.usage_area === usageArea && image.image_url)
    .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))

export const getFirstImageByUsageArea = (images = [], usageArea) =>
  filterImagesByUsageArea(images, usageArea)[0] || null

export const createSectionBackgroundStyle = (image) => {
  if (!image?.image_url) {
    return undefined
  }

  return {
    '--section-bg-image': `url(${image.image_url})`,
  }
}

const getImageDateValue = (image = {}) => {
  const dateValue = Date.parse(image.updated_at || image.created_at || '')

  return Number.isNaN(dateValue) ? 0 : dateValue
}

const shouldUseImageForKey = (candidate, current) => {
  if (!current) {
    return true
  }

  if (candidate.is_active !== false && current.is_active === false) {
    return true
  }

  if (candidate.is_active === false && current.is_active !== false) {
    return false
  }

  return getImageDateValue(candidate) >= getImageDateValue(current)
}

export const mapImagesByRelatedKey = (images = []) =>
  images.reduce((mappedImages, image) => {
    const key = slugifyKey(image.related_key)

    if (key && shouldUseImageForKey(image, mappedImages[key])) {
      mappedImages[key] = image
    }

    return mappedImages
  }, {})

export const getRelatedKeyForItem = (item = {}, usageArea) => {
  const directKey = slugifyKey(item.related_key || item.slug || item.key)

  if (directKey) {
    return directKey
  }

  const aliases = relatedKeyAliases[usageArea] || {}
  const allowedKeys = new Set((relatedKeyOptionsByUsageArea[usageArea] || []).map((option) => option.value))
  const candidates = [item.id, item.content_key, item.title, item.name]

  for (const candidate of candidates) {
    const candidateKey = slugifyKey(candidate)

    if (aliases[candidateKey]) {
      return aliases[candidateKey]
    }

    if (allowedKeys.has(candidateKey)) {
      return candidateKey
    }
  }

  return slugifyKey(item.title || item.name || item.id)
}

export const getActiveSiteImages = async () => {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('site_images')
    .select(siteImagesSelect)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.warn(`site_images aktif görselleri alınamadı: ${error.message}`)
    return []
  }

  return data || []
}

export const getImagesByUsageArea = async (usageArea) => {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('site_images')
    .select(siteImagesSelect)
    .eq('is_active', true)
    .eq('usage_area', usageArea)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.warn(`${usageArea} görselleri alınamadı: ${error.message}`)
    return []
  }

  return data || []
}
