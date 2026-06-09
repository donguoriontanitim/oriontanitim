import { Plus, Save, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fallbackContent } from '../fallbackContent.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const emptyProgram = {
  id: '',
  title: '',
  description: '',
  icon_name: 'Gamepad2',
  color_class: 'cyan',
  is_active: true,
  sort_order: 0,
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
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    supabase
      .from('program_items')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data?.length) {
          setPrograms(data)
        }
      })
  }, [])

  const editProgram = (program) => {
    setDraft({
      ...emptyProgram,
      ...program,
      icon_name: program.icon_name || program.icon || 'Gamepad2',
      sort_order: program.sort_order ?? program.position ?? 0,
    })
    setMessage('')
  }

  const resetDraft = () => {
    setDraft({ ...emptyProgram, sort_order: programs.length + 1 })
    setMessage('')
  }

  const saveProgram = async (event) => {
    event.preventDefault()
    setMessage('')

    const payload = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      sort_order: Number(draft.sort_order || programs.length + 1),
      updated_at: new Date().toISOString(),
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('program_items').upsert(payload)
      if (error) {
        setMessage(error.message)
        return
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
    setMessage('Program içeriği kaydedildi.')
  }

  const deleteProgram = async (programId) => {
    if (!window.confirm('Bu program içeriği silinsin mi?')) {
      return
    }

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('program_items').delete().eq('id', programId)
      if (error) {
        setMessage(error.message)
        return
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
    }

    setPrograms((current) => current.map((item) => (item.id === program.id ? payload : item)))
  }

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
          {programs.map((program) => (
            <article
              key={program.id}
              className="admin-card p-5"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#0B1026]/38">
                    {program.icon_name || program.icon} · Sıra {program.sort_order || 0}
                  </p>
                  <h2 className="mt-2 break-words text-xl font-black text-[#0B1026]">{program.title}</h2>
                  <p className="mt-2 break-words leading-7 text-[#0B1026]/64">{program.description}</p>
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
                    className="admin-danger-button grid size-9 place-items-center rounded-full p-0"
                    aria-label={`${program.title} sil`}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            </article>
          ))}
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
            className="admin-primary-button mt-5 w-full"
          >
            <Save size={18} aria-hidden="true" />
            Kaydet
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProgramManager
