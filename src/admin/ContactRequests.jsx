import { MessageCircle, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'
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

function ContactRequests() {
  const [requests, setRequests] = useState(demoRequests)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return
    }

    supabase
      .from('contact_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          setMessage(error.message)
          return
        }

        setRequests(data || [])
      })
  }, [])

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

  return (
    <div>
      <div className="mb-6">
        <p className="admin-eyebrow">İletişim Talepleri</p>
        <h1 className="admin-title mt-2">Velilerden gelen talepler</h1>
      </div>

      {message && (
        <div className="admin-message mb-5">
          {message}
        </div>
      )}

      <div className="grid gap-4">
        {requests.map((request) => {
          const interests = request.interests || request.interested_areas || []

          return (
            <article key={request.id} className="admin-card p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="min-w-0 break-words text-xl font-black text-[#0B1026]">{request.parent_name}</h2>
                    <span className="admin-pill">
                      {request.status || 'Yeni'}
                    </span>
                    {request.student_age && (
                      <span className="rounded-full bg-[#FFF7D6] px-3 py-1 text-xs font-black text-[#8A5B00]">
                        {request.student_age} yaş
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-[#0B1026]/62">
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
                        <span key={area} className="rounded-full bg-[#FFF8F0] px-3 py-1 text-xs font-black text-[#0B1026]/62">
                          {area}
                        </span>
                      ))}
                    </div>
                  )}

                  {request.message && <p className="mt-4 break-words leading-7 text-[#0B1026]/64">{request.message}</p>}
                  {request.created_at && (
                    <p className="mt-3 text-xs font-bold text-[#0B1026]/40">
                      {new Date(request.created_at).toLocaleString('tr-TR')}
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
          <div className="admin-card border-dashed p-8 text-center font-bold text-[#0B1026]/50">
            Henüz iletişim talebi yok.
          </div>
        )}
      </div>
    </div>
  )
}

export default ContactRequests
