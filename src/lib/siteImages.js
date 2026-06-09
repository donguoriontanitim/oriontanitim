import { isSupabaseConfigured, supabase } from './supabaseClient.js'

export const SITE_IMAGE_BUCKET = 'orion-assets'

export const usageAreaOptions = [
  { value: 'hero_desktop', label: 'Hero Desktop' },
  { value: 'hero_mobile', label: 'Hero Mobile' },
  { value: 'program_card', label: 'Program Kartı' },
  { value: 'why_orion_card', label: 'Neden Orion Kartı' },
  { value: 'daily_flow', label: 'Günlük Akış' },
  { value: 'gallery', label: 'Galeri' },
  { value: 'contact_robot', label: 'İletişim Robotu' },
  { value: 'decoration', label: 'Dekorasyon' },
  { value: 'footer_decoration', label: 'Footer Dekorasyonu' },
]

export const relatedKeyOptionsByUsageArea = {
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

export const mapImagesByRelatedKey = (images = []) =>
  images.reduce((mappedImages, image) => {
    const key = slugifyKey(image.related_key)

    if (key && !mappedImages[key]) {
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
