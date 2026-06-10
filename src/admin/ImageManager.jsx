import {
  Edit3,
  ImagePlus,
  LayoutGrid,
  ListChecks,
  Loader2,
  MessageCircle,
  RefreshCw,
  Save,
  Star,
  Trash2,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  SITE_IMAGE_BUCKET,
  createSiteImageStoragePath,
  relatedKeyOptionsByUsageArea,
  slugifyKey,
  usageAreaOptions,
} from '../lib/siteImages.js'
import { isSupabaseConfigured, supabase, supabaseConfigStatus } from '../lib/supabaseClient.js'

const siteImagesSelect =
  'id,title,description,alt_text,image_url,storage_path,usage_area,related_key,sort_order,is_active,created_at,updated_at'

const emptyDraft = {
  title: '',
  description: '',
  alt_text: '',
  usage_area: 'hero_desktop',
  related_key: '',
  sort_order: 0,
  is_active: true,
}

const statusClasses = {
  error: 'contact-status contact-status-error',
  success: 'contact-status contact-status-success',
  warning: 'admin-message',
}

const managedPhotoSections = [
  {
    usageArea: 'summary_card',
    title: 'Kamp Özeti fotoğrafları',
    eyebrow: 'Kamp Özeti',
    description: 'Kamp Özeti bölümündeki ikonların yerine gösterilecek fotoğrafları ayrı ayrı yönetin.',
    icon: LayoutGrid,
  },
  {
    usageArea: 'program_card',
    title: 'Program İçerikleri fotoğrafları',
    eyebrow: 'Program İçerikleri',
    description: 'Program kartlarındaki ikonların yerine gösterilecek aktivite fotoğraflarını yönetin.',
    icon: ListChecks,
  },
  {
    usageArea: 'why_orion_card',
    title: 'Neden Orion fotoğrafları',
    eyebrow: 'NEDEN ORION?',
    description: 'NEDEN ORION? bölümündeki kart ikonlarının yerine gösterilecek fotoğrafları yönetin.',
    icon: Star,
  },
  {
    usageArea: 'contact_panel_image',
    title: 'İletişim bölümü görselleri',
    eyebrow: 'İletişim',
    description: 'Sol hızlı iletişim paneli ve sağ görsel alanına eklenecek fotoğrafları ayrı ayrı yönetin.',
    icon: MessageCircle,
    itemLabel: 'alan',
    emptyLabel: 'Görsel yok',
  },
]

const getFriendlyErrorMessage = (error, fallbackMessage) => {
  const detail = error?.message || ''

  if (/Admin oturumu|session/i.test(detail)) {
    return detail
  }

  if (/row-level security|policy|permission|not authorized|unauthorized/i.test(detail)) {
    return 'Yetki hatası. Supabase RLS policy kontrol edilmeli.'
  }

  if (/relation .*site_images.* does not exist|site_images.*does not exist/i.test(detail)) {
    return 'site_images tablosu bulunamadı. Supabase migration çalıştırılmalı.'
  }

  if (/bucket not found|bucket.*not found|not found/i.test(detail) && /bucket|storage/i.test(detail)) {
    return 'orion-assets bucket bulunamadı. Supabase migration veya Storage bucket ayarını kontrol edin.'
  }

  if (/bucket|storage/i.test(detail)) {
    return `Görsel yüklenemedi. ${detail}`
  }

  return detail ? `${fallbackMessage} ${detail}` : fallbackMessage
}

const getUsageAreaLabel = (usageArea) =>
  usageAreaOptions.find((option) => option.value === usageArea)?.label || usageArea

const getRelatedKeyLabel = (usageArea) => {
  if (usageArea === 'partner_logo') {
    return 'Logo seçimi'
  }

  if (usageArea === 'contact_panel_image') {
    return 'Alan seçimi'
  }

  if (['program_card', 'summary_card', 'why_orion_card'].includes(usageArea)) {
    return 'Kart seçimi'
  }

  return 'Related key'
}

const getMissingConfigMessage = () => {
  if (supabaseConfigStatus.usesPlaceholderConfig) {
    return 'Supabase bağlantısı yok. .env içinde örnek VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY değerleri gerçek değerlerle değiştirilmelidir.'
  }

  if (!supabaseConfigStatus.hasUrl && !supabaseConfigStatus.hasAnonKey) {
    return 'Supabase bağlantısı yok. VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlı değil.'
  }

  if (!supabaseConfigStatus.hasUrl) {
    return 'Supabase bağlantısı yok. VITE_SUPABASE_URL tanımlı değil.'
  }

  if (!supabaseConfigStatus.hasAnonKey) {
    return 'Supabase bağlantısı yok. VITE_SUPABASE_ANON_KEY tanımlı değil.'
  }

  return 'Supabase bağlantısı yok. Ortam değişkenlerini kontrol edin.'
}

const readSiteImages = async () => {
  const { data, error } = await supabase
    .from('site_images')
    .select(siteImagesSelect)
    .order('usage_area', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

const requireAdminSession = async () => {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(`Admin oturumu kontrol edilemedi: ${error.message}`)
  }

  if (!data.session) {
    throw new Error('Admin oturumu bulunamadı. Lütfen yeniden giriş yapın.')
  }

  return data.session
}

const getImageDateValue = (image = {}) => {
  const dateValue = Date.parse(image.updated_at || image.created_at || '')

  return Number.isNaN(dateValue) ? 0 : dateValue
}

const shouldPreferSlotImage = (candidate, current) => {
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

const findImageForSlot = (images, usageArea, relatedKey) => {
  const normalizedRelatedKey = slugifyKey(relatedKey)

  if (!usageArea || !normalizedRelatedKey) {
    return null
  }

  return images.reduce((selectedImage, image) => {
    const isSameSlot =
      image.usage_area === usageArea && slugifyKey(image.related_key) === normalizedRelatedKey

    if (!isSameSlot || !shouldPreferSlotImage(image, selectedImage)) {
      return selectedImage
    }

    return image
  }, null)
}

function ImageManager() {
  const [images, setImages] = useState([])
  const [draft, setDraft] = useState(emptyDraft)
  const [file, setFile] = useState(null)
  const [editingImage, setEditingImage] = useState(null)
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')

  const relatedKeyOptions = relatedKeyOptionsByUsageArea[draft.usage_area] || []
  const requiresRelatedKey = relatedKeyOptions.length > 0
  const selectedRelatedOption = relatedKeyOptions.find((option) => option.value === draft.related_key)
  const selectedUsageAreaLabel = getUsageAreaLabel(draft.usage_area)
  const formTitle = editingImage
    ? `${selectedRelatedOption?.label || draft.title || selectedUsageAreaLabel} fotoğrafını düzenle`
    : `${selectedRelatedOption?.label || selectedUsageAreaLabel} fotoğrafı yükle`

  const sortedImages = useMemo(
    () =>
      [...images].sort((a, b) => {
        const usageCompare = String(a.usage_area).localeCompare(String(b.usage_area))

        if (usageCompare !== 0) {
          return usageCompare
        }

        return Number(a.sort_order || 0) - Number(b.sort_order || 0)
      }),
    [images],
  )

  const managedImagesBySlot = useMemo(
    () =>
      images.reduce((mappedImages, image) => {
        const usageArea = image.usage_area
        const relatedKey = slugifyKey(image.related_key)

        if (!usageArea || !relatedKey) {
          return mappedImages
        }

        if (!mappedImages[usageArea]) {
          mappedImages[usageArea] = {}
        }

        const currentImage = mappedImages[usageArea][relatedKey]

        if (shouldPreferSlotImage(image, currentImage)) {
          mappedImages[usageArea][relatedKey] = image
        }

        return mappedImages
      }, {}),
    [images],
  )

  const fetchImages = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setStatus({
        type: 'error',
        message: getMissingConfigMessage(),
      })
      return
    }

    setIsLoading(true)
    setStatus({ type: 'idle', message: '' })

    try {
      const data = await readSiteImages()
      setImages(data)
    } catch (error) {
      console.error('site_images listesi alınamadı:', error)
      setStatus({
        type: 'error',
        message: getFriendlyErrorMessage(error, 'Görseller listelenemedi.'),
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let isMounted = true

    readSiteImages()
      .then((data) => {
        if (!isMounted) {
          return
        }

        setIsLoading(false)
        setImages(data)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        setIsLoading(false)
        console.error('site_images listesi alınamadı:', error)
        setStatus({
          type: 'error',
          message: getFriendlyErrorMessage(error, 'Görseller listelenemedi.'),
        })
      })

    return () => {
      isMounted = false
    }
  }, [])

  const updateDraft = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === 'usage_area' ? { related_key: '' } : {}),
    }))
  }

  const resetForm = () => {
    setDraft({ ...emptyDraft, sort_order: images.length + 1 })
    setFile(null)
    setEditingImage(null)
  }

  const selectManagedPhotoSlot = (section, option, currentImage) => {
    const options = relatedKeyOptionsByUsageArea[section.usageArea] || []
    const slotIndex = options.findIndex((item) => item.value === option.value)
    const sortOrder = slotIndex >= 0 ? slotIndex + 1 : images.length + 1

    setEditingImage(currentImage || null)
    setFile(null)
    setDraft({
      title: currentImage?.title || option.label,
      description: currentImage?.description || section.description,
      alt_text: currentImage?.alt_text || `${option.label} fotoğrafı`,
      usage_area: section.usageArea,
      related_key: option.value,
      sort_order: currentImage?.sort_order ?? sortOrder,
      is_active: currentImage?.is_active !== false,
    })
    setStatus({ type: 'idle', message: '' })

    window.requestAnimationFrame(() => {
      document.getElementById('image-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const editImage = (image) => {
    setEditingImage(image)
    setFile(null)
    setDraft({
      title: image.title || '',
      description: image.description || '',
      alt_text: image.alt_text || '',
      usage_area: image.usage_area || 'hero_desktop',
      related_key: image.related_key || '',
      sort_order: image.sort_order ?? 0,
      is_active: image.is_active !== false,
    })
    setStatus({ type: 'idle', message: '' })
  }

  const saveImage = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    setStatus({ type: 'idle', message: '' })

    if (!isSupabaseConfigured) {
      setStatus({
        type: 'error',
        message: getMissingConfigMessage(),
      })
      return
    }

    if (!editingImage && !file) {
      setStatus({ type: 'error', message: 'Görsel dosyası seçmelisiniz.' })
      return
    }

    if (requiresRelatedKey && !draft.related_key) {
      setStatus({ type: 'error', message: 'Bu kullanım alanı için related key seçmelisiniz.' })
      return
    }

    setIsSaving(true)

    let uploadedStoragePath = ''
    let isUpdatingExistingImage = Boolean(editingImage)

    try {
      await requireAdminSession()

      const existingSlotImage =
        editingImage || findImageForSlot(images, draft.usage_area, draft.related_key)
      isUpdatingExistingImage = Boolean(existingSlotImage)
      let imageUrl = existingSlotImage?.image_url || ''
      let storagePath = existingSlotImage?.storage_path || ''

      if (file) {
        uploadedStoragePath = createSiteImageStoragePath(draft.usage_area, file.name)
        console.info('orion-assets upload başladı:', {
          bucket: SITE_IMAGE_BUCKET,
          path: uploadedStoragePath,
        })

        const { error: uploadError } = await supabase.storage
          .from(SITE_IMAGE_BUCKET)
          .upload(uploadedStoragePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw uploadError
        }

        console.info('orion-assets upload başarılı:', uploadedStoragePath)

        const { data: publicUrlData } = supabase.storage
          .from(SITE_IMAGE_BUCKET)
          .getPublicUrl(uploadedStoragePath)

        if (!publicUrlData?.publicUrl) {
          throw new Error('Storage public URL alınamadı.')
        }

        imageUrl = publicUrlData.publicUrl
        storagePath = uploadedStoragePath
      }

      const payload = {
        title: draft.title.trim() || null,
        description: draft.description.trim() || null,
        alt_text: draft.alt_text.trim() || null,
        image_url: imageUrl,
        storage_path: storagePath || null,
        usage_area: draft.usage_area,
        related_key: draft.related_key ? slugifyKey(draft.related_key) : null,
        sort_order: Number(draft.sort_order || 0),
        is_active: draft.is_active,
        updated_at: new Date().toISOString(),
      }

      const { error: databaseError } = isUpdatingExistingImage
        ? await supabase.from('site_images').update(payload).eq('id', existingSlotImage.id)
        : await supabase.from('site_images').insert(payload)

      if (databaseError) {
        if (uploadedStoragePath) {
          const { error: cleanupError } = await supabase.storage
            .from(SITE_IMAGE_BUCKET)
            .remove([uploadedStoragePath])

          if (cleanupError) {
            console.warn(`DB hatası sonrası yüklenen dosya silinemedi: ${cleanupError.message}`)
          }
        }

        throw databaseError
      }

      console.info('site_images kaydı başarılı:', {
        usage_area: payload.usage_area,
        related_key: payload.related_key,
        storage_path: payload.storage_path,
      })

      if (existingSlotImage?.storage_path && uploadedStoragePath && existingSlotImage.storage_path !== uploadedStoragePath) {
        const { error: removeOldError } = await supabase.storage
          .from(SITE_IMAGE_BUCKET)
          .remove([existingSlotImage.storage_path])

        if (removeOldError) {
          console.warn(`Eski görsel dosyası silinemedi: ${removeOldError.message}`)
        }
      }

      try {
        const refreshedImages = await readSiteImages()
        setImages(refreshedImages)
      } catch (refreshError) {
        console.error('Görsel kaydedildi ancak liste yenilenemedi:', refreshError)
        resetForm()
        formElement.reset()
        setStatus({
          type: 'warning',
          message: 'Görsel başarıyla kaydedildi, ancak liste otomatik yenilenemedi. Yenile butonunu deneyin.',
        })
        return
      }

      resetForm()
      formElement.reset()
      setStatus({
        type: 'success',
        message: isUpdatingExistingImage ? 'Görsel güncellendi.' : 'Görsel başarıyla yüklendi.',
      })
    } catch (error) {
      console.error('Görsel kaydetme hatası:', error)
      setStatus({
        type: 'error',
        message: getFriendlyErrorMessage(
          error,
          isUpdatingExistingImage ? 'Database kaydı güncellenemedi.' : 'Database kaydı oluşturulamadı.',
        ),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (image) => {
    if (!isSupabaseConfigured) {
      setStatus({ type: 'error', message: getMissingConfigMessage() })
      return
    }

    const nextActive = !image.is_active
    const { error } = await supabase
      .from('site_images')
      .update({ is_active: nextActive, updated_at: new Date().toISOString() })
      .eq('id', image.id)

    if (error) {
      console.error('Görsel aktif/pasif güncelleme hatası:', error)
      setStatus({
        type: 'error',
        message: getFriendlyErrorMessage(error, 'Görsel güncellenemedi.'),
      })
      return
    }

    setImages((current) =>
      current.map((item) => (item.id === image.id ? { ...item, is_active: nextActive } : item)),
    )
    setStatus({ type: 'success', message: 'Görsel güncellendi.' })
  }

  const deleteImage = async (image) => {
    if (!window.confirm('Bu görsel kaydı ve mümkünse Storage dosyası silinsin mi?')) {
      return
    }

    if (!isSupabaseConfigured) {
      setStatus({ type: 'error', message: getMissingConfigMessage() })
      return
    }

    setDeletingId(image.id)
    setStatus({ type: 'idle', message: '' })

    const { error: databaseError } = await supabase.from('site_images').delete().eq('id', image.id)

    if (databaseError) {
      console.error('Görsel database silme hatası:', databaseError)
      setDeletingId('')
      setStatus({
        type: 'error',
        message: getFriendlyErrorMessage(databaseError, 'Görsel silinemedi.'),
      })
      return
    }

    let storageErrorMessage = ''

    if (image.storage_path) {
      const { error: storageError } = await supabase.storage
        .from(SITE_IMAGE_BUCKET)
        .remove([image.storage_path])

      if (storageError) {
        storageErrorMessage = storageError.message
        console.warn(`Storage dosyası silinemedi: ${storageError.message}`)
      }
    }

    setDeletingId('')
    setImages((current) => current.filter((item) => item.id !== image.id))
    setStatus({
      type: storageErrorMessage ? 'warning' : 'success',
      message: storageErrorMessage
        ? `Görsel database kaydı silindi, ancak Storage dosyası silinemedi: ${storageErrorMessage}`
        : 'Görsel silindi.',
    })
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="admin-eyebrow">Görsel Yönetimi</p>
          <h1 className="admin-title mt-2">Landing page görselleri</h1>
        </div>
        <button type="button" onClick={fetchImages} className="admin-secondary-button">
          <RefreshCw size={17} aria-hidden="true" />
          Yenile
        </button>
      </div>

      {!isSupabaseConfigured && (
        <div className="contact-status contact-status-error mb-6">
          {getMissingConfigMessage()}
        </div>
      )}

      <section className="mb-6 grid gap-4">
        {managedPhotoSections.map((section) => {
          const Icon = section.icon
          const options = relatedKeyOptionsByUsageArea[section.usageArea] || []
          const isSelectedSection = draft.usage_area === section.usageArea

          return (
            <article
              key={section.usageArea}
              className={`admin-card p-4 sm:p-5 ${
                isSelectedSection ? 'border-[#FFB088] shadow-[0_22px_60px_rgba(255,106,42,0.12)]' : ''
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                  <span className="orion-gradient grid size-12 shrink-0 place-items-center rounded-2xl text-white shadow-[0_14px_30px_rgba(255,106,42,0.18)]">
                    <Icon size={22} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="admin-eyebrow">{section.eyebrow}</p>
                    <h2 className="mt-1 text-xl font-black leading-tight text-[#0B1026]">
                      {section.title}
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#0B1026]/58">
                      {section.description}
                    </p>
                  </div>
                </div>
                <span className="admin-pill w-fit shrink-0">
                  {options.length} {section.itemLabel || 'kart'}
                </span>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {options.map((option) => {
                  const currentImage = managedImagesBySlot[section.usageArea]?.[option.value]
                  const isSelectedSlot =
                    draft.usage_area === section.usageArea && draft.related_key === option.value

                  return (
                    <div
                      key={option.value}
                      className={`rounded-2xl border p-3 transition ${
                        isSelectedSlot
                          ? 'border-[#FF6A2A] bg-[#FFF1E8]'
                          : 'border-[#FFE0CC] bg-[#FFFBF5]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl border border-[#FFE0CC] bg-white">
                          {currentImage?.image_url ? (
                            <img
                              src={currentImage.image_url}
                              alt={currentImage.alt_text || currentImage.title || option.label}
                              className="h-full w-full object-contain p-1.5"
                              loading="lazy"
                            />
                          ) : (
                            <Icon size={24} className="text-[#FF6A2A]" aria-hidden="true" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="break-words text-sm font-black leading-5 text-[#0B1026]">
                            {option.label}
                          </h3>
                          <span
                            className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[0.68rem] font-black ${
                              currentImage?.is_active
                                ? 'bg-[#ECFDF5] text-[#047857]'
                                : currentImage
                                  ? 'bg-[#F8FAFC] text-[#0B1026]/54'
                                  : 'bg-white text-[#0B1026]/48'
                            }`}
                          >
                            {currentImage?.is_active
                              ? 'Fotoğraf yayında'
                              : currentImage
                                ? 'Pasif fotoğraf'
                                : section.emptyLabel || 'Varsayılan ikon'}
                          </span>
                        </div>
                      </div>

                      {currentImage ? (
                        <div className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                          <button
                            type="button"
                            onClick={() => selectManagedPhotoSlot(section, option, currentImage)}
                            className="admin-secondary-button rounded-full text-xs"
                          >
                            <Edit3 size={15} aria-hidden="true" />
                            Fotoğrafı düzenle
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteImage(currentImage)}
                            disabled={deletingId === currentImage.id}
                            className="admin-danger-button admin-icon-danger-button disabled:opacity-60"
                            aria-label={`${option.label} görselini sil`}
                          >
                            {deletingId === currentImage.id ? (
                              <Loader2 className="animate-spin" size={15} aria-hidden="true" />
                            ) : (
                              <Trash2 aria-hidden="true" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => selectManagedPhotoSlot(section, option, currentImage)}
                          className="admin-secondary-button mt-3 w-full rounded-full text-xs"
                        >
                          <ImagePlus size={15} aria-hidden="true" />
                          Fotoğraf yükle
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </article>
          )
        })}
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <form id="image-form" onSubmit={saveImage} className="admin-card h-fit scroll-mt-24 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black">{formTitle}</h2>
              <p className="mt-1 text-sm font-semibold text-[#0B1026]/54">
                {selectedRelatedOption
                  ? `${selectedUsageAreaLabel} içinde ${selectedRelatedOption.label} için fotoğraf seçin.`
                  : editingImage
                    ? 'Dosya seçmeden sadece bilgileri güncelleyebilirsiniz.'
                    : 'Dosya Storage alanına yüklenir.'}
              </p>
            </div>
            {editingImage && (
              <button
                type="button"
                onClick={resetForm}
                className="admin-secondary-button grid size-10 shrink-0 place-items-center rounded-full p-0"
                aria-label="Düzenlemeyi iptal et"
              >
                <X size={17} aria-hidden="true" />
              </button>
            )}
          </div>

          <label className="admin-label mt-5">
            Görsel dosyası
            <span className="admin-file-button">
              <ImagePlus size={18} aria-hidden="true" />
              {file ? file.name : editingImage ? 'Yeni dosya seç' : 'Görsel seç'}
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setFile(event.target.files?.[0] || null)}
                className="sr-only"
              />
            </span>
          </label>

          <label className="admin-label mt-4">
            Başlık
            <input
              value={draft.title}
              onChange={(event) => updateDraft('title', event.target.value)}
              className="admin-input"
              placeholder="Hero görseli"
            />
          </label>

          <label className="admin-label mt-4">
            Alt metin
            <input
              value={draft.alt_text}
              onChange={(event) => updateDraft('alt_text', event.target.value)}
              className="admin-input"
              placeholder="Görsel açıklaması"
            />
          </label>

          <label className="admin-label mt-4">
            Açıklama
            <textarea
              rows="3"
              value={draft.description}
              onChange={(event) => updateDraft('description', event.target.value)}
              className="admin-input"
              placeholder="İsteğe bağlı kısa not"
            />
          </label>

          <label className="admin-label mt-4">
            Kullanım alanı
            <select
              required
              value={draft.usage_area}
              onChange={(event) => updateDraft('usage_area', event.target.value)}
              className="admin-input"
            >
              {usageAreaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {relatedKeyOptions.length > 0 ? (
            <label className="admin-label mt-4">
              {getRelatedKeyLabel(draft.usage_area)}
              <select
                required
                value={draft.related_key}
                onChange={(event) => updateDraft('related_key', event.target.value)}
                className="admin-input"
              >
                <option value="">Seçin</option>
                {relatedKeyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="admin-label mt-4">
              {getRelatedKeyLabel(draft.usage_area)}
              <input
                value={draft.related_key}
                onChange={(event) => updateDraft('related_key', event.target.value)}
                className="admin-input"
                placeholder={draft.usage_area === 'gallery' ? 'Serbest metin' : 'Opsiyonel'}
              />
            </label>
          )}

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="admin-label">
              Sıralama
              <input
                type="number"
                value={draft.sort_order}
                onChange={(event) => updateDraft('sort_order', event.target.value)}
                className="admin-input"
              />
            </label>

            <label className="admin-checkbox-card self-end">
              <input
                type="checkbox"
                checked={draft.is_active}
                onChange={(event) => updateDraft('is_active', event.target.checked)}
              />
              Aktif
            </label>
          </div>

          {status.message && (
            <div className={`${statusClasses[status.type] || 'admin-message'} mt-4`}>
              {status.message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving || !isSupabaseConfigured}
            className="admin-primary-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
            {editingImage ? 'Görseli Güncelle' : 'Görseli Yükle'}
          </button>
        </form>

        <section className="min-w-0">
          {isLoading ? (
            <div className="admin-card grid min-h-56 place-items-center p-6 text-center font-black text-[#0B1026]/62">
              <span className="inline-flex items-center gap-2">
                <Loader2 className="animate-spin text-[#FF6A2A]" size={19} aria-hidden="true" />
                Görseller yükleniyor...
              </span>
            </div>
          ) : sortedImages.length > 0 ? (
            <div className="grid gap-4">
              {sortedImages.map((image) => (
                <article key={image.id} className="admin-card admin-card-hover p-4">
                  <div className="grid gap-4 md:grid-cols-[104px_1fr_auto] md:items-center">
                    <div className="overflow-hidden rounded-2xl border border-[#FFE0CC] bg-[#FFF8F0]">
                      <img
                        src={image.image_url}
                        alt={image.alt_text || image.title || 'Orion görseli'}
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-2">
                        <span className="admin-pill">{getUsageAreaLabel(image.usage_area)}</span>
                        <span
                          className={`admin-status-button ${
                            image.is_active ? 'admin-status-button-active' : 'admin-status-button-muted'
                          }`}
                        >
                          {image.is_active ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <h2 className="mt-3 break-words text-lg font-black text-[#0B1026]">
                        {image.title || 'Başlıksız görsel'}
                      </h2>
                      <dl className="mt-2 grid gap-1 text-sm font-semibold text-[#0B1026]/58 sm:grid-cols-2">
                        <div className="min-w-0">
                          <dt className="font-black text-[#0B1026]/42">Kart / logo seçimi</dt>
                          <dd className="break-words">{image.related_key || '-'}</dd>
                        </div>
                        <div>
                          <dt className="font-black text-[#0B1026]/42">Sıralama</dt>
                          <dd>{image.sort_order ?? 0}</dd>
                        </div>
                      </dl>
                      {image.description && (
                        <p className="mt-2 break-words text-sm font-semibold leading-6 text-[#0B1026]/60">
                          {image.description}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 md:justify-end">
                      <button
                        type="button"
                        onClick={() => toggleActive(image)}
                        className="admin-secondary-button min-h-10 rounded-full px-4 py-2 text-xs"
                      >
                        {image.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                      </button>
                      <button
                        type="button"
                        onClick={() => editImage(image)}
                        className="admin-secondary-button grid size-10 place-items-center rounded-full p-0"
                        aria-label={`${image.title || 'Görsel'} düzenle`}
                      >
                        <Edit3 size={16} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteImage(image)}
                        disabled={deletingId === image.id}
                        className="admin-danger-button admin-icon-danger-button disabled:opacity-60"
                        aria-label={`${image.title || 'Görsel'} sil`}
                      >
                        {deletingId === image.id ? (
                          <Loader2 className="animate-spin" size={16} aria-hidden="true" />
                        ) : (
                          <Trash2 aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="admin-card grid min-h-56 place-items-center p-6 text-center">
              <div>
                <div className="mx-auto grid size-14 place-items-center rounded-full bg-[#FFF1E8] text-[#FF6A2A]">
                  <ImagePlus size={25} aria-hidden="true" />
                </div>
                <h2 className="mt-4 text-xl font-black">Henüz görsel yok.</h2>
                <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#0B1026]/60">
                  İlk görseli yüklediğinizde landing page ilgili alanda otomatik kullanmaya başlar.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default ImageManager
