import { Download, Loader2, MessageCircle, Phone, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { downloadHtmlFile, escapeHtml } from '../lib/htmlExport.js'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'

const statusOptions = [
  'Yeni',
  'Arandı',
  'Görüşüldü',
  'Kayıt Düşünüyor',
  'Kayıt Oldu',
  'Uygun Değil',
]

const demoRequests = [
  {
    id: 'demo-1',
    parent_name: 'Demo Veli',
    phone: '0532 000 00 00',
    student_age: '10',
    interests: ['Arduino Robotik Kodlama', 'Yüzme'],
    message: 'Hafta içi program detaylarını öğrenmek istiyorum.',
    status: 'Yeni',
    created_at: new Date().toISOString(),
  },
]

const formatDateTime = (dateValue) => {
  if (!dateValue) {
    return '-'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}

const getDayKey = (dateValue) => {
  if (!dateValue) {
    return 'unknown'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'unknown'
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

const formatDayLabel = (dateValue) => {
  if (!dateValue) {
    return 'Tarihsiz talepler'
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return 'Tarihsiz talepler'
  }

  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'full',
  }).format(date)
}

const getRequestInterests = (request) => request.interests || request.interested_areas || []

const groupRequestsByDay = (requests) =>
  Object.values(
    requests.reduce((groups, request) => {
      const dayKey = getDayKey(request.created_at)

      if (!groups[dayKey]) {
        groups[dayKey] = {
          date: request.created_at,
          id: dayKey,
          items: [],
          label: formatDayLabel(request.created_at),
        }
      }

      groups[dayKey].items.push(request)

      return groups
    }, {}),
  ).sort((a, b) => {
    if (a.id === 'unknown') return 1
    if (b.id === 'unknown') return -1

    return b.id.localeCompare(a.id)
  })

const createContactRequestsHtml = (requests) => {
  const groups = groupRequestsByDay(requests)
  const groupTables = groups
    .map((group) => {
      const rows = group.items
        .map((request) => {
          const interests = getRequestInterests(request)

          return `
            <tr>
              <td>${escapeHtml(request.parent_name || '-')}</td>
              <td>${escapeHtml(request.phone || '-')}</td>
              <td>${escapeHtml(request.student_age || '-')}</td>
              <td>${escapeHtml(interests.length > 0 ? interests.join(', ') : '-')}</td>
              <td>${escapeHtml(request.message || '-')}</td>
              <td>${escapeHtml(request.status || 'Yeni')}</td>
              <td>${escapeHtml(formatDateTime(request.created_at))}</td>
            </tr>
          `
        })
        .join('')

      return `
        <h2>${escapeHtml(group.label)} (${group.items.length} talep)</h2>
        <table>
          <thead>
            <tr>
              <th>Veli</th>
              <th>Telefon</th>
              <th>Yaş</th>
              <th>İlgilendiği alanlar</th>
              <th>Mesaj</th>
              <th>Durum</th>
              <th>Saat</th>
            </tr>
          </thead>
          <tbody>${rows || '<tr><td colspan="7">Kayıt yok</td></tr>'}</tbody>
        </table>
      `
    })
    .join('')

  return `
    <h1>ORION Kamp İletişim Talepleri</h1>
    <p class="meta">Oluşturulma tarihi: ${escapeHtml(formatDateTime(new Date().toISOString()))} · Toplam talep: ${requests.length}</p>
    ${groupTables || '<p>Kayıt yok</p>'}
  `
}

function ContactRequests() {
  const [requests, setRequests] = useState(demoRequests)
  const [message, setMessage] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const fetchRequests = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return
    }

    const { data, error } = await supabase
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(`İletişim talepleri alınamadı: ${error.message}`)
      return
    }

    setRequests(data || [])
    setMessage('')
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(fetchRequests, 0)

    return () => window.clearTimeout(timerId)
  }, [fetchRequests])

  const groupedRequests = useMemo(() => groupRequestsByDay(requests), [requests])

  const updateStatus = async (request, nextStatus) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', request.id)

      if (error) {
        setMessage(`Durum güncellenemedi: ${error.message}`)
        return
      }
    }

    setRequests((current) =>
      current.map((item) => (item.id === request.id ? { ...item, status: nextStatus } : item)),
    )
    setMessage('')
  }

  const deleteRequest = async (request) => {
    const requestName = request.parent_name || 'Bu iletişim talebi'

    if (!window.confirm(`${requestName} silinsin mi? Bu işlem geri alınamaz.`)) {
      return
    }

    setMessage('')
    setDeletingId(request.id)

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('contact_requests').delete().eq('id', request.id)

      if (error) {
        setMessage(`İletişim talebi silinemedi: ${error.message}`)
        setDeletingId('')
        return
      }
    }

    setRequests((current) => current.filter((item) => item.id !== request.id))
    setDeletingId('')
    setMessage('İletişim talebi silindi.')
  }

  const downloadRequests = () => {
    downloadHtmlFile({
      body: createContactRequestsHtml(requests),
      filename: `orion-iletisim-talepleri-${new Date().toISOString().slice(0, 10)}.html`,
      title: 'ORION Kamp İletişim Talepleri',
    })
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="admin-eyebrow">İletişim Talepleri</p>
          <h1 className="admin-title mt-2">Velilerden gelen talepler</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={downloadRequests} className="admin-secondary-button">
            <Download size={17} aria-hidden="true" />
            HTML İndir
          </button>
          <button type="button" onClick={fetchRequests} className="admin-secondary-button">
            <RefreshCw size={17} aria-hidden="true" />
            Yenile
          </button>
        </div>
      </div>

      {message && <div className="admin-message mb-5">{message}</div>}

      {groupedRequests.length > 0 ? (
        <div className="grid gap-6">
          {groupedRequests.map((group) => (
            <section key={group.id} className="grid gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#FFE0CC] bg-[#FFF8F0] px-4 py-3">
                <h2 className="text-lg font-black text-[#222222]">{group.label}</h2>
                <span className="admin-pill">{group.items.length} talep</span>
              </div>

              <div className="grid gap-4">
                {group.items.map((request) => {
                  const interests = getRequestInterests(request)
                  const phoneDigits = request.phone?.replace(/\D/g, '')

                  return (
                    <article key={request.id} className="admin-card p-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <h3 className="min-w-0 break-words text-xl font-black text-[#222222]">
                              {request.parent_name || 'İsimsiz veli'}
                            </h3>
                            <span className="admin-pill">{request.status || 'Yeni'}</span>
                            {request.student_age && (
                              <span className="rounded-full bg-[#FFF7D6] px-3 py-1 text-xs font-black text-[#8A5B00]">
                                {request.student_age} yaş
                              </span>
                            )}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-[#222222]/62">
                            {request.phone && (
                              <a className="inline-flex items-center gap-2" href={`tel:${request.phone}`}>
                                <Phone size={16} aria-hidden="true" />
                                {request.phone}
                              </a>
                            )}
                            {phoneDigits && (
                              <a
                                className="inline-flex items-center gap-2"
                                href={`https://wa.me/${phoneDigits}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <MessageCircle size={16} aria-hidden="true" />
                                WhatsApp
                              </a>
                            )}
                          </div>

                          {interests.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {interests.map((area) => (
                                <span
                                  key={area}
                                  className="rounded-full bg-[#FFF8F0] px-3 py-1 text-xs font-black text-[#222222]/62"
                                >
                                  {area}
                                </span>
                              ))}
                            </div>
                          )}

                          {request.message && (
                            <p className="mt-4 break-words leading-7 text-[#222222]/64">
                              {request.message}
                            </p>
                          )}
                          {request.created_at && (
                            <p className="mt-3 text-xs font-bold text-[#222222]/40">
                              {formatDateTime(request.created_at)}
                            </p>
                          )}
                        </div>

                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-56">
                          <label className="admin-label">
                            Durum
                            <select
                              value={request.status || 'Yeni'}
                              onChange={(event) => updateStatus(request, event.target.value)}
                              className="admin-input"
                            >
                              {statusOptions.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                          </label>

                          <button
                            type="button"
                            onClick={() => deleteRequest(request)}
                            disabled={deletingId === request.id}
                            className="admin-danger-button w-full disabled:opacity-60"
                          >
                            {deletingId === request.id ? (
                              <Loader2 className="animate-spin" size={17} aria-hidden="true" />
                            ) : (
                              <Trash2 size={17} aria-hidden="true" />
                            )}
                            Talebi Sil
                          </button>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="admin-card border-dashed p-8 text-center font-bold text-[#222222]/50">
          Henüz iletişim talebi yok.
        </div>
      )}
    </div>
  )
}

export default ContactRequests
