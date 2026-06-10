import { Bot, CheckCircle2, Loader2, Mail, Phone, Send, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import WhatsAppIcon from './WhatsAppIcon.jsx'
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient.js'
import { whatsappMessage, whatsappNumber } from '../fallbackContent.js'
import contactVisual from '../assets/orion-hero.png'

const initialForm = {
  parent_name: '',
  phone: '',
  student_age: '',
  interested_areas: [],
  message: '',
  kvkk_approved: false,
}

const inputClass = 'contact-input'
const labelClass = 'contact-label'
const fallbackContactContent = {
  eyebrow: 'İletişim',
  title: 'SİZİ ARAYALIM,',
  highlight: 'DETAYLARI BİRLİKTE PLANLAYALIM',
  description: 'Formu doldurun, en kısa sürede size ulaşalım.',
  quickTitle: 'WhatsApp ile hemen yazın.',
  quickDescription:
    'Formu beklemeden sorularınızı iletebilir, kamp detayları için hızlı dönüş alabilirsiniz.',
}

const contactSummaryItems = [
  { label: 'Yaş aralığı', value: '7-13' },
  { label: 'Program', value: 'Teknoloji + Spor' },
  { label: 'Dönem', value: '2026 Yaz' },
  { label: 'Kontenjan', value: 'Sınırlı' },
]

const trustItems = [
  'Uzman eğitmen kadrosu',
  'Güvenli kamp ortamı',
  'Yaşa uygun etkinlik akışı',
  'Hızlı bilgilendirme ve dönüş',
]

function ContactSection({ programs, contactInfo, contactImage, contactQuickImage, contactSideImage, content }) {
  const [form, setForm] = useState(initialForm)
  const [status, setStatus] = useState({ type: 'idle', message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const contactContent = { ...fallbackContactContent, ...content }
  const contactQuickImageUrl = contactQuickImage?.image_url
  const contactImageUrl = contactSideImage?.image_url || contactImage?.image_url || contactVisual
  const quickPanelBackgroundStyle = contactQuickImageUrl
    ? {
        backgroundImage: `linear-gradient(180deg, rgba(255,248,240,0.98) 0%, rgba(255,248,240,0.9) 34%, rgba(255,248,240,0.72) 56%, rgba(255,248,240,0.96) 100%), url(${contactQuickImageUrl})`,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }
    : undefined
  const sidePanelBackgroundStyle = {
    backgroundImage: `linear-gradient(180deg, rgba(255,248,240,0.86) 0%, rgba(255,248,240,0.46) 48%, rgba(255,248,240,0.94) 100%), url(${contactImageUrl})`,
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'cover',
  }

  const activePrograms = useMemo(
    () => programs.filter((program) => program.is_active !== false),
    [programs],
  )

  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const toggleArea = (title) => {
    setForm((current) => {
      const hasArea = current.interested_areas.includes(title)
      return {
        ...current,
        interested_areas: hasArea
          ? current.interested_areas.filter((area) => area !== title)
          : [...current.interested_areas, title],
      }
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setStatus({ type: 'idle', message: '' })

    const parentName = form.parent_name.trim()
    const phone = form.phone.trim()
    const studentAge = String(form.student_age).trim()
    const studentAgeNumber = Number(studentAge)

    if (!parentName) {
      setStatus({ type: 'error', message: 'Veli adı soyadını yazmalısınız.' })
      return
    }

    if (!phone) {
      setStatus({ type: 'error', message: 'Size ulaşabilmemiz için telefon numaranızı yazmalısınız.' })
      return
    }

    if (!studentAge) {
      setStatus({ type: 'error', message: 'Öğrenci yaşını yazmalısınız.' })
      return
    }

    if (Number.isNaN(studentAgeNumber) || studentAgeNumber < 7 || studentAgeNumber > 13) {
      setStatus({ type: 'error', message: 'Öğrenci yaşı 7 ile 13 arasında olmalı.' })
      return
    }

    if (!form.kvkk_approved) {
      setStatus({ type: 'error', message: 'Devam etmek için KVKK onayını işaretlemelisiniz.' })
      return
    }

    setIsSubmitting(true)

    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.from('contact_requests').insert({
          parent_name: parentName,
          phone,
          student_age: studentAge,
          interests: form.interested_areas,
          message: form.message.trim(),
          kvkk_approved: form.kvkk_approved,
          status: 'Yeni',
        })

        if (error) {
          throw error
        }
      }

      setStatus({
        type: 'success',
        message: isSupabaseConfigured
          ? 'Talebiniz alındı. Şimdi WhatsApp görüşmesine yönlendiriliyorsunuz.'
          : 'Demo modunda talep alındı. Supabase bilgileri eklenince kayıt veritabanına düşer.',
      })
      setForm(initialForm)
      window.setTimeout(() => {
        window.location.href = whatsappUrl
      }, 900)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message || 'Talep gönderilirken bir sorun oluştu. Lütfen tekrar deneyin.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      id="iletisim"
      className="bg-[linear-gradient(180deg,#FFFFFF_0%,#FFFBF5_100%)] py-16 text-[#0B1026] sm:py-20 lg:py-24"
    >
      <div className="section-shell">
        <div className="overflow-hidden rounded-[1.75rem] border border-[#FFE0CC] bg-[#FFF8F0] p-2.5 shadow-[0_28px_90px_rgba(255,106,42,0.12)] sm:rounded-[2.25rem] sm:p-5 lg:rounded-[3rem] lg:p-6">
          <div className="grid gap-5 rounded-[1.45rem] bg-white p-4 sm:gap-6 sm:rounded-[1.75rem] sm:p-7 lg:grid-cols-[0.78fr_1.18fr_0.78fr] lg:items-stretch lg:rounded-[2.35rem] lg:p-8">
            <aside
              className="relative isolate flex min-h-[34rem] min-w-0 flex-col gap-5 overflow-hidden rounded-[1.25rem] border border-[#FFE0CC] bg-[#FFF8F0] p-5 sm:gap-6 sm:rounded-[1.5rem] sm:p-6"
              style={quickPanelBackgroundStyle}
            >
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 text-base font-black text-white shadow-[0_16px_36px_rgba(37,211,102,0.3)] transition hover:bg-[#1ebe5d]"
              >
                <WhatsAppIcon size={20} />
                WhatsApp ile yazın
              </a>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF6A2A]">Hızlı İletişim</p>
                <h3 className="mt-3 text-[1.7rem] font-black leading-[1.05] text-[#0B1026] sm:text-3xl">
                  {contactContent.quickTitle}
                </h3>
                <p className="mt-4 text-base font-extrabold leading-7 text-[#0B1026]/80">
                  {contactContent.quickDescription}
                </p>
              </div>

              <div className="mt-auto grid min-w-0 gap-3 rounded-[1.35rem] border border-white/80 bg-white/92 p-3 text-base font-black leading-tight text-[#0B1026] shadow-[0_18px_42px_rgba(11,16,38,0.16)] backdrop-blur-md sm:p-4 sm:text-[1.05rem]">
                <a
                  className="flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl bg-[#FFFBF5]/96 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                  href={`tel:${contactInfo.phone1.replace(/\D/g, '')}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#FF6A2A] shadow-sm">
                    <Phone size={17} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 break-words leading-snug">{contactInfo.phone1}</span>
                </a>
                <a
                  className="flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl bg-[#FFFBF5]/96 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                  href={`tel:${contactInfo.phone2.replace(/\D/g, '')}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#FF6A2A] shadow-sm">
                    <Phone size={17} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 break-words leading-snug">{contactInfo.phone2}</span>
                </a>
                <a
                  className="flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl bg-[#FFFBF5]/96 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]"
                  href={`mailto:${contactInfo.mail}`}
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-[#FF6A2A] shadow-sm">
                    <Mail size={17} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 break-all leading-snug">{contactInfo.mail}</span>
                </a>
              </div>
            </aside>

            <div>
              <div className="mb-6">
                <p className="section-eyebrow">{contactContent.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-black leading-tight text-[#0B1026] min-[390px]:text-3xl sm:text-4xl lg:text-5xl">
                  {contactContent.title}
                  {contactContent.highlight && (
                    <span className="block text-[#FF6A2A]">{contactContent.highlight}</span>
                  )}
                </h2>
                <p className="mt-4 text-base font-semibold leading-7 text-[#0B1026]/64">
                  {contactContent.description}
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="text-[#0B1026]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className={labelClass}>
                    Veli Adı Soyadı
                    <input
                      required
                      value={form.parent_name}
                      onChange={(event) => updateField('parent_name', event.target.value)}
                      className={inputClass}
                      placeholder="Adınız Soyadınız"
                    />
                  </label>

                  <label className={labelClass}>
                    Telefon Numarası
                    <input
                      required
                      value={form.phone}
                      onChange={(event) => updateField('phone', event.target.value)}
                      className={inputClass}
                      placeholder="05xx xxx xx xx"
                      inputMode="tel"
                    />
                  </label>

                  <label className={labelClass}>
                    Öğrenci Yaşı
                    <input
                      required
                      min="7"
                      max="13"
                      type="number"
                      value={form.student_age}
                      onChange={(event) => updateField('student_age', event.target.value)}
                      className={inputClass}
                      placeholder="7-13"
                    />
                  </label>
                </div>

                <fieldset className="mt-5">
                  <legend className="text-sm font-black text-[#0B1026]/72">İlgilendiği Alanlar</legend>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {activePrograms.map((program) => {
                      const selected = form.interested_areas.includes(program.title)

                      return (
                        <button
                          key={program.id}
                          type="button"
                          onClick={() => toggleArea(program.title)}
                          className={`min-h-11 rounded-full border px-4 py-2.5 text-sm font-black transition ${
                            selected
                              ? 'orion-gradient border-transparent text-white shadow-[0_12px_26px_rgba(255,106,42,0.2)]'
                              : 'border-[#FFE0CC] bg-[#FFFBF5] text-[#0B1026]/72 hover:border-[#FF6A2A] hover:bg-[#FFF1E8]'
                          }`}
                        >
                          {program.title}
                        </button>
                      )
                    })}
                  </div>
                </fieldset>

                <label className={`${labelClass} mt-5`}>
                  Mesaj
                  <textarea
                    rows="4"
                    value={form.message}
                    onChange={(event) => updateField('message', event.target.value)}
                    className={`${inputClass} resize-none`}
                    placeholder="Çocuğunuzun ilgi alanları veya sormak istedikleriniz"
                  />
                </label>

                <label className="mt-5 flex gap-3 rounded-2xl border border-[#FFE0CC] bg-[#FFFBF5] p-4 text-sm font-semibold leading-6 text-[#0B1026]/64">
                  <input
                    type="checkbox"
                    checked={form.kvkk_approved}
                    onChange={(event) => updateField('kvkk_approved', event.target.checked)}
                    className="mt-1 size-5 shrink-0 rounded border-[#FFE0CC] accent-[#FF6A2A]"
                  />
                  KVKK kapsamında iletişim amacıyla bilgilerimin işlenmesini ve tarafıma dönüş
                  yapılmasını kabul ediyorum.
                </label>

                {status.message && (
                  <div
                    aria-live="polite"
                    className={`contact-status mt-5 ${
                      status.type === 'success'
                        ? 'contact-status-success'
                        : 'contact-status-error'
                    }`}
                  >
                    {status.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="orion-gradient orion-gradient-hover cta-orange mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 font-black text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <Loader2 className="animate-spin" size={19} aria-hidden="true" />
                  ) : (
                    <Send size={19} aria-hidden="true" />
                  )}
                  Gönder
                </button>
              </form>
            </div>

            <aside
              className="relative isolate hidden min-h-[34rem] overflow-hidden rounded-[1.5rem] border border-[#FFE0CC] bg-[#FFF8F0] p-5 lg:flex lg:flex-col lg:gap-5"
              style={sidePanelBackgroundStyle}
            >
              <div className="flex items-center justify-between">
                <span className="grid size-11 place-items-center rounded-full bg-white text-[#FF6A2A] shadow-sm">
                  <Bot size={22} aria-hidden="true" />
                </span>
                <span className="grid size-9 place-items-center rounded-full bg-[#FFD166] text-[#0B1026]">
                  <Sparkles size={18} aria-hidden="true" />
                </span>
              </div>

              <div className="rounded-[1.25rem] bg-white/92 p-4 shadow-[0_14px_34px_rgba(11,16,38,0.1)] backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#FF6A2A]">
                  Kamp Özeti
                </p>
                <dl className="mt-3 grid gap-2">
                  {contactSummaryItems.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between gap-3 rounded-2xl bg-[#FFFBF5]/92 px-3 py-2.5"
                    >
                      <dt className="text-xs font-black text-[#0B1026]/58">{item.label}</dt>
                      <dd className="text-sm font-black text-[#0B1026]">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-auto grid gap-3">
                <div className="rounded-[1.25rem] bg-white/92 p-4 shadow-[0_14px_34px_rgba(11,16,38,0.1)] backdrop-blur">
                  <p className="flex items-center gap-2 text-base font-black text-[#0B1026]">
                    <CheckCircle2 size={18} className="text-[#FF6A2A]" aria-hidden="true" />
                    Güven veren detaylar
                  </p>
                  <ul className="mt-3 grid gap-2.5 text-sm font-extrabold leading-5 text-[#0B1026]/78">
                    {trustItems.map((item) => (
                      <li key={item} className="flex gap-2">
                        <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#FF6A2A]" aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactSection
