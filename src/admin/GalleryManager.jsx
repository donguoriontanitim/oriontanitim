import { ImagePlus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fallbackContent } from '../fallbackContent.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const emptyGalleryItem = {
  title: '',
  description: '',
  alt_text: '',
  sort_order: 0,
  is_active: true,
}

const normalizeImage = (image, index = 0) => ({
  ...image,
  alt_text: image.alt_text || image.alt || '',
  description: image.description || '',
  sort_order: image.sort_order ?? index + 1,
})

function GalleryManager() {
  const [images, setImages] = useState(() => fallbackContent.gallery.map(normalizeImage))
  const [draft, setDraft] = useState(emptyGalleryItem)
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    supabase
      .from('gallery_images')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data?.length) {
          setImages(data)
        }
      })
  }, [])

  const uploadImage = async (event) => {
    event.preventDefault()
    setMessage('')

    if (!file) {
      setMessage('Lütfen bir görsel seçin.')
      return
    }

    setIsUploading(true)

    try {
      const id = crypto.randomUUID()
      let imageUrl = URL.createObjectURL(file)
      let storagePath = ''
      const sortOrder = Number(draft.sort_order || images.length + 1)

      if (isSupabaseConfigured) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
        storagePath = `${Date.now()}-${safeName}`
        const { error: uploadError } = await supabase.storage.from('gallery').upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        })

        if (uploadError) {
          throw uploadError
        }

        const { data } = supabase.storage.from('gallery').getPublicUrl(storagePath)
        imageUrl = data.publicUrl

        const { error: insertError } = await supabase.from('gallery_images').insert({
          id,
          title: draft.title,
          description: draft.description,
          alt_text: draft.alt_text,
          image_url: imageUrl,
          storage_path: storagePath,
          sort_order: sortOrder,
          is_active: draft.is_active,
        })

        if (insertError) {
          throw insertError
        }
      }

      setImages((current) => [
        {
          id,
          title: draft.title,
          description: draft.description,
          alt_text: draft.alt_text,
          image_url: imageUrl,
          storage_path: storagePath,
          sort_order: sortOrder,
          is_active: draft.is_active,
        },
        ...current,
      ])
      setDraft(emptyGalleryItem)
      setFile(null)
      event.currentTarget.reset()
      setMessage('Galeri görseli eklendi.')
    } catch (error) {
      setMessage(error.message || 'Görsel yüklenirken bir sorun oluştu.')
    } finally {
      setIsUploading(false)
    }
  }

  const toggleActive = async (image) => {
    const nextActive = !image.is_active

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('gallery_images')
        .update({ is_active: nextActive })
        .eq('id', image.id)

      if (error) {
        setMessage(error.message)
        return
      }
    }

    setImages((current) =>
      current.map((item) => (item.id === image.id ? { ...item, is_active: nextActive } : item)),
    )
  }

  const deleteImage = async (image) => {
    if (!window.confirm('Bu görsel galeri listesinden silinsin mi?')) {
      return
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('gallery_images').delete().eq('id', image.id)
      if (error) {
        setMessage(error.message)
        return
      }
    }

    setImages((current) => current.filter((item) => item.id !== image.id))
  }

  return (
    <div>
      <div className="mb-6">
        <p className="admin-eyebrow">Galeri</p>
        <h1 className="admin-title mt-2">Supabase Storage görsel yönetimi</h1>
      </div>

      <form
        onSubmit={uploadImage}
        className="admin-card mb-6 grid gap-4 p-5 lg:grid-cols-[1fr_1fr_auto]"
      >
        <label className="admin-label">
          Başlık
          <input
            required
            value={draft.title}
            onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
            className="admin-input"
          />
        </label>

        <label className="admin-label">
          Alt metin
          <input
            required
            value={draft.alt_text}
            onChange={(event) => setDraft((current) => ({ ...current, alt_text: event.target.value }))}
            className="admin-input"
          />
        </label>

        <div className="admin-label">
          Görsel
          <label className="admin-file-button">
            <ImagePlus size={18} aria-hidden="true" />
            Seç
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
            onChange={(event) =>
              setDraft((current) => ({ ...current, description: event.target.value }))
            }
            className="admin-input"
          />
        </label>

        <label className="admin-label">
          Sıra
          <input
            type="number"
            value={draft.sort_order}
            onChange={(event) => setDraft((current) => ({ ...current, sort_order: event.target.value }))}
            className="admin-input"
          />
        </label>

        <label className="admin-checkbox-card lg:col-span-2">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(event) => setDraft((current) => ({ ...current, is_active: event.target.checked }))}
          />
          Aktif göster
        </label>

        <button
          type="submit"
          disabled={isUploading}
          className="admin-primary-button disabled:opacity-60"
        >
          <Save size={18} aria-hidden="true" />
          {isUploading ? 'Yükleniyor' : 'Kaydet'}
        </button>

        {file && <p className="text-sm font-bold text-[#0B1026]/52 lg:col-span-3">Seçilen dosya: {file.name}</p>}
        {message && (
          <div className="admin-message lg:col-span-3">
            {message}
          </div>
        )}
      </form>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {images.map((image) => (
          <article key={image.id} className="admin-card admin-card-hover overflow-hidden">
            <img
              src={image.image_url}
              alt={image.alt_text || image.title}
              className="aspect-[4/3] w-full object-cover"
            />
            <div className="p-4">
              <h2 className="break-words font-black text-[#0B1026]">{image.title}</h2>
              <p className="mt-1 break-words text-sm text-[#0B1026]/50">{image.alt_text}</p>
              {image.description && <p className="mt-2 break-words text-sm text-[#0B1026]/62">{image.description}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleActive(image)}
                  className={`admin-status-button ${
                    image.is_active ? 'admin-status-button-active' : 'admin-status-button-muted'
                  }`}
                >
                  {image.is_active ? 'Aktif' : 'Pasif'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteImage(image)}
                  className="admin-danger-button grid size-9 place-items-center rounded-full p-0"
                  aria-label={`${image.title} sil`}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

export default GalleryManager
