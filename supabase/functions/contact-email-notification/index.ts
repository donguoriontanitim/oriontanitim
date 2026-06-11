const corsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Origin': '*',
  'Content-Type': 'application/json',
}

type ContactNotificationPayload = {
  parentName?: string
  phone?: string
  studentAge?: string
  interests?: string[]
  message?: string
  submittedAt?: string
}

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    headers: corsHeaders,
    status,
  })

const getRequiredEnv = (name: string) => {
  const value = Deno.env.get(name)?.trim()

  if (!value) {
    throw new Error(`${name} Supabase secret olarak tanımlı değil.`)
  }

  return value
}

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

const normalizePayload = (payload: ContactNotificationPayload) => {
  const parentName = String(payload.parentName || '').trim()
  const phone = String(payload.phone || '').trim()
  const studentAge = String(payload.studentAge || '').trim()
  const interests = Array.isArray(payload.interests)
    ? payload.interests.map((interest) => String(interest).trim()).filter(Boolean)
    : []
  const message = String(payload.message || '').trim()
  const submittedAt = String(payload.submittedAt || new Date().toISOString()).trim()

  if (!parentName || !phone || !studentAge) {
    throw new Error('Veli adı, telefon ve öğrenci yaşı zorunludur.')
  }

  return {
    parentName,
    phone,
    studentAge,
    interests,
    message,
    submittedAt,
  }
}

const createTextBody = (payload: ReturnType<typeof normalizePayload>) =>
  [
    'Yeni iletişim formu dolduruldu.',
    '',
    `Veli: ${payload.parentName}`,
    `Telefon: ${payload.phone}`,
    `Öğrenci yaşı: ${payload.studentAge}`,
    `İlgilendiği alanlar: ${payload.interests.length > 0 ? payload.interests.join(', ') : 'Belirtilmedi'}`,
    `Mesaj: ${payload.message || 'Belirtilmedi'}`,
    `Tarih: ${new Date(payload.submittedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' })}`,
    '',
    'Kaynak: ORION Kamp 2026 web sitesi',
  ].join('\n')

const createHtmlBody = (payload: ReturnType<typeof normalizePayload>) => {
  const rows = [
    ['Veli', payload.parentName],
    ['Telefon', payload.phone],
    ['Öğrenci yaşı', payload.studentAge],
    ['İlgilendiği alanlar', payload.interests.length > 0 ? payload.interests.join(', ') : 'Belirtilmedi'],
    ['Mesaj', payload.message || 'Belirtilmedi'],
    [
      'Tarih',
      new Date(payload.submittedAt).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul' }),
    ],
  ]

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#222222">
      <h2 style="margin:0 0 16px;color:#ff6a2a">Yeni iletişim formu dolduruldu</h2>
      <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <td style="border:1px solid #ffe0cc;font-weight:700;background:#fff8f0;width:180px">${escapeHtml(label)}</td>
                  <td style="border:1px solid #ffe0cc">${escapeHtml(value)}</td>
                </tr>
              `,
            )
            .join('')}
        </tbody>
      </table>
      <p style="margin-top:16px;color:#666666">Kaynak: ORION Kamp 2026 web sitesi</p>
    </div>
  `
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Sadece POST desteklenir.' }, 405)
  }

  try {
    const resendApiKey = getRequiredEnv('RESEND_API_KEY')
    const from = getRequiredEnv('CONTACT_NOTIFICATION_FROM')
    const to = getRequiredEnv('CONTACT_NOTIFICATION_TO')
      .split(',')
      .map((email) => email.trim())
      .filter(Boolean)

    if (to.length === 0) {
      throw new Error('CONTACT_NOTIFICATION_TO geçerli bir e-posta adresi içermiyor.')
    }

    const payload = normalizePayload(await request.json())
    const response = await fetch('https://api.resend.com/emails', {
      body: JSON.stringify({
        from,
        to,
        subject: `Yeni form: ${payload.parentName}`,
        text: createTextBody(payload),
        html: createHtmlBody(payload),
      }),
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('E-posta bildirim servisi hatası:', result)
      return jsonResponse(
        {
          error: 'E-posta bildirimi gönderilemedi.',
          providerStatus: response.status,
          result,
        },
        502,
      )
    }

    return jsonResponse({
      ok: true,
      provider: 'resend',
      result,
    })
  } catch (error) {
    console.error('E-posta bildirim fonksiyonu hatası:', error)
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'E-posta bildirimi gönderilemedi.',
      },
      400,
    )
  }
})
