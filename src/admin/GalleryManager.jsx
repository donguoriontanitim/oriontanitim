import { ArrowDown, ArrowUp, Edit3, ImagePlus, Loader2, RefreshCw, Save, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fallbackContent } from '../fallbackContent.js'
import {
  SITE_IMAGE_BUCKET,
  createSiteImageStoragePath,
} from '../lib/siteImages.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const gallerySelect =
  'id,title,description,alt_text,image_url,storage_path,usage_area,related_key,sort_order,is_active,created_at,updated_at'

const emptyGalleryItem = {
  title: '',
  description: '',
  alt_text: '',
  related_key: '',
  sort_order: 0,
  is_active: true,
}

const statusClasses = {
  error: 'contact-status contact-status-error',
  success: 'contact-status contact-status-success',
  warning: 'admin-message',
}

const normalizeFallbackImage = (image, index = 0) => ({
  ...image,
  id: image.id || `demo-gallery-${index}`,
  alt_text: image.alt_text || image.alt || image.title || '',
  description: image.description || '',
  related_key: image.related_key || '',
  sort_order: image.sort_order ?? index + 1,
  usage_area: 'gallery',
  is_active: image.is_active !== false,
})

const sortGalleryImages = (images = []) =>
  [...images].sort((first, second) => {
    const orderSort = Number(first.sort_order || 0) - Number(second.sort_order || 0)

    if (orderSort !== 0) {
      return orderSort
    }

    return String(first.created_at || '').localeCompare(String(second.created_at || ''))
  })

const getFriendlyErrorMessage = (error, fallbackMessage) => {
  const detail = error?.message || ''

  if (/row-level security|policy|permission|not authorized|unauthorized/i.test(detail)) {
    return 'Yetki hatası. Supabase RLS policy kontrol edilmeli.'
  }

  if (/relation .*site_images.* does not exist|site_images.*does not exist/i.test(detail)) {
    return 'site_images tablosu bulunamadı. Supabase migration çalıştırılmalı.'
  }

  if (/bucket not found|bucket.*not found|not found/i.test(detail) && /bucket|storage/i.test(detail)) {
    return 'orion-assets bucket bulunamadı. Supabase Storage ayarını kontrol edin.'
  }

  return detail ? `${fallbackMessage} ${detail}` : fallbackMessage
}

const readGalleryImages = async () => {
  const { data, error } = await supabase
    .from('site_images')
    .select(gallerySelect)
    .eq('usage_area', 'gallery')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

function GalleryManager() {
  const [images, setImages] = useState(() => fallbackContent.gallery.map(normalizeFallbackImage))
  const [draft, setDraft] = useState(emptyGalleryItem)
  const [editingImage, setEditingImage] = useState(null)
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured)
  const [isSaving, setIsSaving] = useState(false)
  const [deletingId, setDeletingId] = useState('')
  const [movingId, setMovingId] = useState('')

  const sortedImages = useMemo(() => sortGalleryImages(images), [images])

  const fetchImages = async () => {
    if (!isSupabaseConfigured) {
      setStatus({
        type: 'warning',
        message: 'Supabase bağlantısı yok. Galeri demo verileriyle gösteriliyor.',
      })
      return
    }

    setIsLoading(true)
    setStatus({ type: 'idle', message: '' })

    try {
      const data = await readGalleryImages()
      setImages(data)
    } catch (error) {
      console.error('Galeri görselleri alınamadı:', error)
      setStatus({
        type: 'error',
        message: getFriendlyErrorMessage(error, 'Galeri görselleri alınamadı.'),
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return undefined
    }

    let isMounted = true

    readGalleryImages()
      .then((data) => {
        if (!isMounted) {
          return
        }

        setImages(data)
        setIsLoading(false)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        console.error('Galeri görselleri alınamadı:', error)
        setIsLoading(false)
        setStatus({
          type: 'error',
          message: getFriendlyErrorMessage(error, 'Galeri görselleri alınamadı.'),
        })
      })

    return () => {
      isMounted = false
    }
  }, [])

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }))
  }

  const resetForm = () => {
    setDraft({ ...emptyGalleryItem, sort_order: sortedImages.length + 1 })
    setEditingImage(null)
    setFile(null)
  }

  const editImage = (image) => {
    setEditingImage(image)
    setFile(null)
    setDraft({
      title: image.title || '',
      description: image.description || '',
      alt_text: image.alt_text || '',
      related_key: image.related_key || '',
      sort_order: image.sort_order ?? sortedImages.length + 1,
      is_active: image.is_active !== false,
    })
    setStatus({ type: 'idle', message: '' })

    window.requestAnimationFrame(() => {
      document.getElementById('gallery-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const saveImage = async (event) => {
    event.preventDefault()
    const formElement = event.currentTarget
    setStatus({ type: 'idle', message: '' })

    if (!editingImage && !file) {
      setStatus({ type: 'error', message: 'Lütfen bir görsel seçin.' })
      return
    }

    const sortOrder = Number(draft.sort_order || sortedImages.length + 1)

    if (!isSupabaseConfigured) {
      const imageUrl = file ? URL.createObjectURL(file) : editingImage.image_url
      const nextImage = {
        ...(editingImage || { id: crypto.randomUUID(), created_at: new Date().toISOString() }),
        ...draft,
        image_url: imageUrl,
        usage_area: 'gallery',
        sort_order: sortOrder,
        updated_at: new Date().toISOString(),
      }

      setImages((current) =>
        editingImage
          ? current.map((image) => (image.id === editingImage.id ? nextImage : image))
          : sortGalleryImages([...current, nextImage]),
      )
      resetForm()
      formElement.reset()
      setStatus({ type: 'success', message: 'Galeri görseli demo modunda kaydedildi.' })
      return
    }

    setIsSaving(true)

    let uploadedStoragePath = ''

    try {
      let imageUrl = editingImage?.image_url || ''
      let storagePath = editingImage?.storage_path || ''

      if (file) {
        uploadedStoragePath = createSiteImageStoragePath('gallery', file.name)

        const { error: uploadError } = await supabase.storage
          .from(SITE_IMAGE_BUCKET)
          .upload(uploadedStoragePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          throw uploadError
        }

        const { data } = supabase.storage.from(SITE_IMAGE_BUCKET).getPublicUrl(uploadedStoragePath)

        if (!data?.publicUrl) {
          throw new Error('Storage public URL alınamadı.')
        }

        imageUrl = data.publicUrl
        storagePath = uploadedStoragePath
      }

      const payload = {
        title: draft.title.trim() || null,
        description: draft.description.trim() || null,
        alt_text: draft.alt_text.trim() || null,
        image_url: imageUrl,
        storage_path: storagePath || null,
        usage_area: 'gallery',
        related_key: draft.related_key.trim() || null,
        sort_order: sortOrder,
        is_active: draft.is_active,
        updated_at: new Date().toISOString(),
      }

      const { error: databaseError } = editingImage
        ? await supabase.from('site_images').update(payload).eq('id', editingImage.id)
        : await supabase.from('site_images').insert(payload)

      if (databaseError) {
        if (uploadedStoragePath) {
          await supabase.storage.from(SITE_IMAGE_BUCKET).remove([uploadedStoragePath])
        }

        throw databaseError
      }

      if (editingImage?.storage_path && uploadedStoragePath && editingImage.storage_path !== uploadedStoragePath) {
        const { error: removeOldError } = await supabase.storage
          .from(SITE_IMAGE_BUCKET)
          .remove([editingImage.storage_path])

        if (removeOldError) {
          console.warn(`Eski galeri dosyası silinemedi: ${removeOldError.message}`)
        }
      }

      const refreshedImages = await readGalleryImages()
      setImages(refreshedImages)
      resetForm()
      formElement.reset()
      setStatus({
        type: 'success',
        message: editingImage ? 'Galeri görseli güncellendi.' : 'Galeri görseli eklendi.',
      })
    } catch (error) {
      console.error('Galeri görseli kaydetme hatası:', error)
      setStatus({
        type: 'error',
        message: getFriendlyErrorMessage(error, 'Galeri görseli kaydedilemedi.'),
      })
    } finally {
      setIsSaving(false)
    }
  }

  const toggleActive = async (image) => {
    const nextActive = !image.is_active

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('site_images')
        .update({ is_active: nextActive, updated_at: new Date().toISOString() })
        .eq('id', image.id)

      if (error) {
        setStatus({
          type: 'error',
          message: getFriendlyErrorMessage(error, 'Galeri görseli güncellenemedi.'),
        })
        return
      }
    }

    setImages((current) =>
      current.map((item) => (item.id === image.id ? { ...item, is_active: nextActive } : item)),
    )
    setStatus({ type: 'success', message: 'Galeri görseli güncellendi.' })
  }

  const deleteImage = async (image) => {
    if (!window.confirm('Bu galeri görseli silinsin mi?')) {
      return
    }

    setDeletingId(image.id)
    setStatus({ type: 'idle', message: '' })

    try {
      if (isSupabaseConfigured) {
        const { error: databaseError } = await supabase.from('site_images').delete().eq('id', image.id)

        if (databaseError) {
          throw databaseError
        }

        if (image.storage_path) {
          const { error: storageError } = await supabase.storage
            .from(SITE_IMAGE_BUCKET)
            .remove([image.storage_path])

          if (storageError) {
            console.warn(`Galeri Storage dosyası silinemedi: ${storageError.message}`)
          }
        }
      }

      setImages((current) => current.filter((item) => item.id !== image.id))
      setStatus({ type: 'success', message: 'Galeri görseli silindi.' })

      if (editingImage?.id === image.id) {
        resetForm()
      }
    } catch (error) {
      console.error('Galeri görseli silme hatası:', error)
      setStatus({
        type: 'error',
        message: getFriendlyErrorMessage(error, 'Galeri görseli silinemedi.'),
      })
    } finally {
      setDeletingId('')
    }
  }

  const moveImage = async (image, direction) => {
    const currentIndex = sortedImages.findIndex((item) => item.id === image.id)
    const targetIndex = currentIndex + direction
    const targetImage = sortedImages[targetIndex]

    if (currentIndex < 0 || !targetImage) {
      return
    }

    const currentOrder = Number(image.sort_order || currentIndex + 1)
    const targetOrder = Number(targetImage.sort_order || targetIndex + 1)

    setMovingId(image.id)
    setStatus({ type: 'idle', message: '' })

    try {
      if (isSupabaseConfigured) {
        const updates = [
          supabase
            .from('site_images')
            .update({ sort_order: targetOrder, updated_at: new Date().toISOString() })
            .eq('id', image.id),
          supabase
            .from('site_images')
            .update({ sort_order: currentOrder, updated_at: new Date().toISOString() })
            .eq('id', targetImage.id),
        ]
        const results = await Promise.all(updates)
        const failedResult = results.find((result) => result.error)

        if (failedResult?.error) {
          throw failedResult.error
        }
      }

      setImages((current) =>
        current.map((item) => {
          if (item.id === image.id) {
            return { ...item, sort_order: targetOrder }
          }

          if (item.id === targetImage.id) {
            return { ...item, sort_order: currentOrder }
          }

          return item
        }),
      )
      setStatus({ type: 'success', message: 'Galeri sırası güncellendi.' })
    } catch (error) {
      console.error('Galeri sırası güncellenemedi:', error)
      setStatus({
        type: 'error',
        message: getFriendlyErrorMessage(error, 'Galeri sırası güncellenemedi.'),
      })
    } finally {
      setMovingId('')
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="admin-eyebrow">Galeri</p>
          <h1 className="admin-title mt-2">Galeri görsellerini düzenle ve sırala</h1>
        </div>
        <button type="button" onClick={fetchImages} className="admin-secondary-button">
          <RefreshCw size={17} aria-hidden="true" />
          Yenile
        </button>
      </div>

      <form
        id="gallery-form"
        onSubmit={saveImage}
        className="admin-card mb-6 grid scroll-mt-24 gap-4 p-5 lg:grid-cols-[1fr_1fr_auto]"
      >
        <div className="lg:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-black text-[#222222]">
                {editingImage ? 'Galeri görselini düzenle' : 'Yeni galeri görseli ekle'}
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-[#222222]/56">
                Dosya, başlık, açıklama, aktiflik ve sıra değerini buradan yönetebilirsiniz.
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
        </div>

        <label className="admin-label">
          Başlık
          <input
            required
            value={draft.title}
            onChange={(event) => updateDraft('title', event.target.value)}
            className="admin-input"
          />
        </label>

        <label className="admin-label">
          Alt metin
          <input
            required
            value={draft.alt_text}
            onChange={(event) => updateDraft('alt_text', event.target.value)}
            className="admin-input"
          />
        </label>

        <div className="admin-label">
          Görsel
          <label className="admin-file-button">
            <ImagePlus size={18} aria-hidden="true" />
            {file ? file.name : editingImage ? 'Yeni görsel seç' : 'Seç'}
            <input
              type="file"
              accept="image/*"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="sr-only"
            />
          </label>
        </div>

        <label className="admin-label lg:col-span-2">
          Açıklama
          <textarea
            rows="3"
            value={draft.description}
            onChange={(event) => updateDraft('description', event.target.value)}
            className="admin-input"
          />
        </label>

        <label className="admin-label">
          Sıra
          <input
            type="number"
            value={draft.sort_order}
            onChange={(event) => updateDraft('sort_order', event.target.value)}
            className="admin-input"
          />
        </label>

        <label className="admin-label lg:col-span-2">
          Galeri anahtarı
          <input
            value={draft.related_key}
            onChange={(event) => updateDraft('related_key', event.target.value)}
            className="admin-input"
            placeholder="Opsiyonel"
          />
        </label>

        <label className="admin-checkbox-card">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(event) => updateDraft('is_active', event.target.checked)}
          />
          Aktif göster
        </label>

        <button
          type="submit"
          disabled={isSaving}
          className="admin-primary-button disabled:opacity-60 lg:col-span-3"
        >
          {isSaving ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
          {editingImage ? 'Güncelle' : 'Kaydet'}
        </button>

        {status.message && (
          <div className={`${statusClasses[status.type] || 'admin-message'} lg:col-span-3`}>
            {status.message}
          </div>
        )}
      </form>

      {isLoading ? (
        <div className="admin-card grid min-h-56 place-items-center p-6 text-center font-black text-[#222222]/62">
          <span className="inline-flex items-center gap-2">
            <Loader2 className="animate-spin text-[#FF6A2A]" size={19} aria-hidden="true" />
            Galeri görselleri yükleniyor...
          </span>
        </div>
      ) : sortedImages.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sortedImages.map((image, index) => (
            <article key={image.id} className="admin-card admin-card-hover overflow-hidden">
              <img
                src={image.image_url}
                alt={image.alt_text || image.title}
                className="aspect-[4/3] w-full object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="admin-pill">Sıra {image.sort_order ?? index + 1}</span>
                  <span
                    className={`admin-status-button ${
                      image.is_active ? 'admin-status-button-active' : 'admin-status-button-muted'
                    }`}
                  >
                    {image.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <h2 className="mt-3 break-words font-black text-[#222222]">{image.title}</h2>
                <p className="mt-1 break-words text-sm text-[#222222]/50">{image.alt_text}</p>
                {image.description && <p className="mt-2 break-words text-sm text-[#222222]/62">{image.description}</p>}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => moveImage(image, -1)}
                    disabled={index === 0 || movingId === image.id}
                    className="admin-secondary-button min-h-10 rounded-full px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowUp size={15} aria-hidden="true" />
                    Yukarı
                  </button>
                  <button
                    type="button"
                    onClick={() => moveImage(image, 1)}
                    disabled={index === sortedImages.length - 1 || movingId === image.id}
                    className="admin-secondary-button min-h-10 rounded-full px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowDown size={15} aria-hidden="true" />
                    Aşağı
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
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
                    aria-label={`${image.title} düzenle`}
                  >
                    <Edit3 size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteImage(image)}
                    disabled={deletingId === image.id}
                    className="admin-danger-button admin-icon-danger-button disabled:opacity-60"
                    aria-label={`${image.title} sil`}
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
            <h2 className="mt-4 text-xl font-black">Henüz galeri görseli yok.</h2>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#222222]/60">
              İlk görseli eklediğinizde canlı galeri bölümünde otomatik görünür.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GalleryManager
