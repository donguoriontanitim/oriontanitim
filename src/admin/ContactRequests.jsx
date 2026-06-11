import { Download, MessageCircle, Phone, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
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

const formatDateTime = (dateValue) =>
  dateValue
    ? new Intl.DateTimeFormat('tr-TR', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(new Date(dateValue))
    : '-'

const getRequestInterests = (request) => request.interests || request.interested_areas || []

const createContactRequestsHtml = (requests) => {
  const rows = requests
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
    <h1>ORION Kamp İletişim Talepleri</h1>
    <p class="meta">Oluşturulma tarihi: ${escapeHtml(formatDateTime(new Date().toISOString()))} · Toplam talep: ${requests.length}</p>
    <table>
      <thead>
        <tr>
          <th>Veli</th>
          <th>Telefon</th>
          <th>Yaş</th>
          <th>İlgilendiği alanlar</th>
          <th>Mesaj</th>
          <th>Durum</th>
          <th>Tarih</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="7">Kayıt yok</td></tr>'}</tbody>
    </table>
  `
}

function ContactRequests() {
  const [requests, setRequests] = useState(demoRequests)
  const [message, setMessage] = useState('')

  const fetchRequests = useCallback(async () => {
    if (!isSupabaseConfigured) {
      return
    }

    const { data, error } = await supabase
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage(error.message)
      return
    }

    setRequests(data || [])
    setMessage('')
  }, [])

  useEffect(() => {
    const timerId = window.setTimeout(fetchRequests, 0)

    return () => window.clearTimeout(timerId)
  }, [fetchRequests])

  const updateStatus = async (request, nextStatus) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase
        .from('contact_requests')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', request.id)

      if (error) {
        setMessage(error.message)
        return
      }
    }

    setRequests((current) =>
      current.map((item) => (item.id === request.id ? { ...item, status: nextStatus } : item)),
    )
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

      {message && (
        <div className="admin-message mb-5">
          {message}
        </div>
      )}

      <div className="grid gap-4">
        {requests.map((request) => {
          const interests = getRequestInterests(request)

          return (
            <article key={request.id} className="admin-card p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="min-w-0 break-words text-xl font-black text-[#222222]">{request.parent_name}</h2>
                    <span className="admin-pill">
                      {request.status || 'Yeni'}
                    </span>
                    {request.student_age && (
                      <span className="rounded-full bg-[#FFF7D6] px-3 py-1 text-xs font-black text-[#8A5B00]">
                        {request.student_age} yaş
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-[#222222]/62">
                    <a className="inline-flex items-center gap-2" href={`tel:${request.phone}`}>
                      <Phone size={16} aria-hidden="true" />
                      {request.phone}
                    </a>
                    <a
                      className="inline-flex items-center gap-2"
                      href={`https://wa.me/${request.phone?.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                      WhatsApp
                    </a>
                  </div>

                  {interests.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {interests.map((area) => (
                        <span key={area} className="rounded-full bg-[#FFF8F0] px-3 py-1 text-xs font-black text-[#222222]/62">
                          {area}
                        </span>
                      ))}
                    </div>
                  )}

                  {request.message && <p className="mt-4 break-words leading-7 text-[#222222]/64">{request.message}</p>}
                  {request.created_at && (
                    <p className="mt-3 text-xs font-bold text-[#222222]/40">
                      {formatDateTime(request.created_at)}
                    </p>
                  )}
                </div>

                <label className="admin-label min-w-48">
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
              </div>
            </article>
          )
        })}

        {requests.length === 0 && (
          <div className="admin-card border-dashed p-8 text-center font-bold text-[#222222]/50">
            Henüz iletişim talebi yok.
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactRequests
