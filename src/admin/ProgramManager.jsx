import { ImagePlus, Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { fallbackContent } from '../fallbackContent.js'
import {
  SITE_IMAGE_BUCKET,
  createSiteImageStoragePath,
  getRelatedKeyForItem,
  mapImagesByRelatedKey,
} from '../lib/siteImages.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const siteImagesSelect =
  'id,title,description,alt_text,image_url,storage_path,usage_area,related_key,sort_order,is_active,created_at,updated_at'

const emptyProgram = {
  id: '',
  title: '',
  description: '',
  icon_name: 'Gamepad2',
  color_class: 'cyan',
  is_active: true,
  sort_order: 0,
}

const getProgramCardImageTitle = (programTitle) =>
  programTitle ? `${programTitle} fotoğrafı` : 'Program fotoğrafı'

const readProgramImages = async () => {
  const { data, error } = await supabase
    .from('site_images')
    .select(siteImagesSelect)
    .eq('usage_area', 'program_card')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    throw error
  }

  return data || []
}

function ProgramManager() {
  const [programs, setPrograms] = useState(() =>
    fallbackContent.programs.map((program, index) => ({
      ...program,
      icon_name: program.icon_name || program.icon || 'Gamepad2',
      color_class: program.color_class || 'cyan',
      sort_order: program.sort_order ?? program.position ?? index + 1,
    })),
  )
  const [draft, setDraft] = useState(emptyProgram)
  const [programImagesByKey, setProgramImagesByKey] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [message, setMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const loadProgramImages = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return
    }

    try {
      const data = await readProgramImages()
      setProgramImagesByKey(mapImagesByRelatedKey(data))
    } catch (error) {
      console.error('Program kart fotoğrafları alınamadı:', error)
      setMessage(error.message)
    }
  }, [])

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    let isMounted = true

    supabase
      .from('program_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!isMounted) {
          return
        }

        if (error) {
          setMessage(error.message)
          return
        }

        if (data?.length) {
          setPrograms(data)
        }
      })

    readProgramImages()
      .then((data) => {
        if (isMounted) {
          setProgramImagesByKey(mapImagesByRelatedKey(data))
        }
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        console.error('Program kart fotoğrafları alınamadı:', error)
        setMessage(error.message)
      })

    return () => {
      isMounted = false
    }
  }, [])

  const editProgram = (program) => {
    setDraft({
      ...emptyProgram,
      ...program,
      icon_name: program.icon_name || program.icon || 'Gamepad2',
      sort_order: program.sort_order ?? program.position ?? 0,
    })
    setImageFile(null)
    setMessage('')
  }

  const resetDraft = () => {
    setDraft({ ...emptyProgram, sort_order: programs.length + 1 })
    setImageFile(null)
    setMessage('')
  }

  const saveProgram = async (event) => {
    event.preventDefault()
    setMessage('')

    if (imageFile && !isSupabaseConfigured) {
      setMessage('Fotoğraf yüklemek için Supabase bağlantısı gereklidir.')
      return
    }

    const payload = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      sort_order: Number(draft.sort_order || programs.length + 1),
      updated_at: new Date().toISOString(),
    }
    const existingProgram = programs.find((program) => program.id === draft.id)
    const previousRelatedKey = getRelatedKeyForItem(existingProgram || draft, 'program_card')
    const nextRelatedKey = getRelatedKeyForItem(payload, 'program_card')
    const existingImage = programImagesByKey[previousRelatedKey] || programImagesByKey[nextRelatedKey]

    setIsSaving(true)

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('program_items').upsert(payload)

        if (error) {
          throw error
        }

        if (imageFile || existingImage) {
          let imageUrl = existingImage?.image_url || ''
          let storagePath = existingImage?.storage_path || ''
          let uploadedStoragePath = ''

          if (imageFile) {
            uploadedStoragePath = createSiteImageStoragePath('program_card', imageFile.name)
            console.info('Program kart fotoğrafı upload başladı:', {
              bucket: SITE_IMAGE_BUCKET,
              path: uploadedStoragePath,
            })

            const { error: uploadError } = await supabase.storage
              .from(SITE_IMAGE_BUCKET)
              .upload(uploadedStoragePath, imageFile, {
                cacheControl: '3600',
                upsert: false,
              })

            if (uploadError) {
              throw uploadError
            }

            const { data: publicUrlData } = supabase.storage
              .from(SITE_IMAGE_BUCKET)
              .getPublicUrl(uploadedStoragePath)

            if (!publicUrlData?.publicUrl) {
              throw new Error('Storage public URL alınamadı.')
            }

            imageUrl = publicUrlData.publicUrl
            storagePath = uploadedStoragePath
          }

          const imagePayload = {
            title: getProgramCardImageTitle(payload.title),
            description: payload.description || null,
            alt_text: payload.title || 'Program görseli',
            image_url: imageUrl,
            storage_path: storagePath || null,
            usage_area: 'program_card',
            related_key: nextRelatedKey,
            sort_order: payload.sort_order,
            is_active: payload.is_active,
            updated_at: new Date().toISOString(),
          }

          const { error: imageError } = existingImage
            ? await supabase.from('site_images').update(imagePayload).eq('id', existingImage.id)
            : await supabase.from('site_images').insert(imagePayload)

          if (imageError) {
            if (uploadedStoragePath) {
              const { error: cleanupError } = await supabase.storage
                .from(SITE_IMAGE_BUCKET)
                .remove([uploadedStoragePath])

              if (cleanupError) {
                console.warn(`DB hatası sonrası yüklenen program fotoğrafı silinemedi: ${cleanupError.message}`)
              }
            }

            throw new Error(`Program fotoğrafı database kaydı oluşturulamadı: ${imageError.message}`)
          }

          if (existingImage?.storage_path && uploadedStoragePath && existingImage.storage_path !== uploadedStoragePath) {
            const { error: removeOldError } = await supabase.storage
              .from(SITE_IMAGE_BUCKET)
              .remove([existingImage.storage_path])

            if (removeOldError) {
              console.warn(`Eski program fotoğrafı silinemedi: ${removeOldError.message}`)
            }
          }

          await loadProgramImages()
        }
      }

      setPrograms((current) => {
        const exists = current.some((program) => program.id === payload.id)
        const next = exists
          ? current.map((program) => (program.id === payload.id ? payload : program))
          : [...current, payload]

        return [...next].sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      })
      setDraft(emptyProgram)
      setImageFile(null)
      setMessage(imageFile ? 'Program ve kart fotoğrafı kaydedildi.' : 'Program içeriği kaydedildi.')
    } catch (error) {
      console.error('Program kaydetme hatası:', error)
      setMessage(error.message || 'Program kaydedilemedi.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteProgram = async (programId) => {
    if (!window.confirm('Bu program içeriği silinsin mi?')) {
      return
    }

    const programToDelete = programs.find((program) => program.id === programId)
    const relatedKey = getRelatedKeyForItem(programToDelete || { id: programId }, 'program_card')
    const programImage = programImagesByKey[relatedKey]

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('program_items').delete().eq('id', programId)
      if (error) {
        setMessage(error.message)
        return
      }

      if (programImage) {
        const { error: imageDeleteError } = await supabase.from('site_images').delete().eq('id', programImage.id)

        if (imageDeleteError) {
          console.error('Program fotoğrafı database silme hatası:', imageDeleteError)
          setMessage(`Program silindi, ancak fotoğraf kaydı silinemedi: ${imageDeleteError.message}`)
        } else if (programImage.storage_path) {
          const { error: storageError } = await supabase.storage
            .from(SITE_IMAGE_BUCKET)
            .remove([programImage.storage_path])

          if (storageError) {
            console.warn(`Program fotoğrafı Storage dosyası silinemedi: ${storageError.message}`)
            setMessage(`Program silindi, ancak Storage dosyası silinemedi: ${storageError.message}`)
          }
        }

        await loadProgramImages()
      }
    }

    setPrograms((current) => current.filter((program) => program.id !== programId))
  }

  const toggleActive = async (program) => {
    const payload = { ...program, is_active: !program.is_active }

    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('program_items')
        .update({ is_active: payload.is_active })
        .eq('id', program.id)

      if (error) {
        setMessage(error.message)
        return
      }

      const relatedKey = getRelatedKeyForItem(program, 'program_card')
      const programImage = programImagesByKey[relatedKey]

      if (programImage) {
        const { error: imageError } = await supabase
          .from('site_images')
          .update({ is_active: payload.is_active, updated_at: new Date().toISOString() })
          .eq('id', programImage.id)

        if (imageError) {
          setMessage(imageError.message)
          return
        }

        await loadProgramImages()
      }
    }

    setPrograms((current) => current.map((item) => (item.id === program.id ? payload : item)))
  }

  const draftImage = programImagesByKey[getRelatedKeyForItem(draft, 'program_card')]

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="admin-eyebrow">Program İçerikleri</p>
          <h1 className="admin-title mt-2">Ekle, düzenle, sil</h1>
        </div>
        <button
          type="button"
          onClick={resetDraft}
          className="admin-primary-button"
        >
          <Plus size={18} aria-hidden="true" />
          Yeni Program
        </button>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <div className="grid gap-3">
          {programs.map((program) => {
            const relatedKey = getRelatedKeyForItem(program, 'program_card')
            const programImage = programImagesByKey[relatedKey]

            return (
              <article
                key={program.id}
                className="admin-card p-5"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex min-w-0 gap-4">
                    <div className="hidden size-20 shrink-0 overflow-hidden rounded-2xl border border-[#FFE0CC] bg-[#FFF8F0] p-1 sm:block">
                      {programImage?.image_url ? (
                        <img
                          src={programImage.image_url}
                          alt={programImage.alt_text || program.title}
                          className="h-full w-full rounded-xl object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="grid h-full w-full place-items-center rounded-xl bg-white text-xs font-black text-[#0B1026]/42">
                          İkon
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0B1026]/38">
                        {programImage ? 'Fotoğraflı kart' : program.icon_name || program.icon} · Sıra {program.sort_order || 0}
                      </p>
                      <h2 className="mt-2 break-words text-xl font-black text-[#0B1026]">{program.title}</h2>
                      <p className="mt-2 break-words leading-7 text-[#0B1026]/64">{program.description}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2 sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleActive(program)}
                      className={`admin-status-button ${
                        program.is_active ? 'admin-status-button-active' : 'admin-status-button-muted'
                      }`}
                    >
                      {program.is_active ? 'Aktif' : 'Pasif'}
                    </button>
                    <button
                      type="button"
                      onClick={() => editProgram(program)}
                      className="admin-secondary-button min-h-9 rounded-full px-4 py-2 text-xs"
                    >
                      Düzenle
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProgram(program.id)}
                      className="admin-danger-button admin-icon-danger-button"
                      aria-label={`${program.title} sil`}
                    >
                      <Trash2 aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <form onSubmit={saveProgram} className="admin-card h-fit p-5">
          <h2 className="text-xl font-black">{draft.id ? 'Program Düzenle' : 'Yeni Program'}</h2>

          <label className="admin-label mt-4">
            Başlık
            <input
              required
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              className="admin-input"
            />
          </label>

          <label className="admin-label mt-4">
            Açıklama
            <textarea
              required
              rows="4"
              value={draft.description}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              className="admin-input"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="admin-label">
              Icon adı
              <input
                value={draft.icon_name}
                onChange={(event) => setDraft((current) => ({ ...current, icon_name: event.target.value }))}
                className="admin-input"
              />
            </label>

            <label className="admin-label">
              Sıra
              <input
                type="number"
                value={draft.sort_order}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, sort_order: event.target.value }))
                }
                className="admin-input"
              />
            </label>
          </div>

          <label className="admin-label mt-4">
            Renk sınıfı
            <input
              value={draft.color_class}
              onChange={(event) =>
                setDraft((current) => ({ ...current, color_class: event.target.value }))
              }
              className="admin-input"
            />
          </label>

          <div className="admin-panel-soft mt-4 p-4">
            <label className="admin-label">
              Kart Fotoğrafı
              <span className="admin-file-button">
                <ImagePlus size={18} aria-hidden="true" />
                {imageFile ? imageFile.name : draftImage ? 'Fotoğrafı değiştir' : 'Fotoğraf seç'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setImageFile(event.target.files?.[0] || null)}
                  className="sr-only"
                />
              </span>
            </label>

            {draftImage?.image_url && (
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#FFE0CC] bg-white p-2">
                <img
                  src={draftImage.image_url}
                  alt={draftImage.alt_text || draft.title || 'Program görseli'}
                  className="size-16 shrink-0 rounded-xl object-contain"
                  loading="lazy"
                />
                <p className="min-w-0 break-words text-sm font-bold text-[#0B1026]/58">
                  Mevcut fotoğraf: {draftImage.title || draft.title || 'Program kartı'}
                </p>
              </div>
            )}

            {imageFile && (
              <p className="mt-3 break-words text-sm font-bold text-[#0B1026]/58">
                Seçilen dosya: {imageFile.name}
              </p>
            )}
          </div>

          <label className="admin-checkbox-card mt-4">
            <input
              type="checkbox"
              checked={draft.is_active}
              onChange={(event) =>
                setDraft((current) => ({ ...current, is_active: event.target.checked }))
              }
            />
            Aktif göster
          </label>

          {message && (
            <div className="admin-message mt-4">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="admin-primary-button mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
            {isSaving ? 'Kaydediliyor' : 'Kaydet'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProgramManager
