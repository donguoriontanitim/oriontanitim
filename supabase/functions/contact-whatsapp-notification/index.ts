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

const cleanPhone = (value = '') => value.replace(/\D/g, '')

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

const createMessageBody = (payload: ReturnType<typeof normalizePayload>) =>
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

const createTemplatePayload = (
  payload: ReturnType<typeof normalizePayload>,
  recipientPhone: string,
) => ({
  messaging_product: 'whatsapp',
  to: recipientPhone,
  type: 'template',
  template: {
    name: getRequiredEnv('WHATSAPP_TEMPLATE_NAME'),
    language: {
      code: Deno.env.get('WHATSAPP_TEMPLATE_LANGUAGE')?.trim() || 'tr',
    },
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: payload.parentName },
          { type: 'text', text: payload.phone },
          { type: 'text', text: payload.studentAge },
          {
            type: 'text',
            text: payload.interests.length > 0 ? payload.interests.join(', ') : 'Belirtilmedi',
          },
          { type: 'text', text: payload.message || 'Belirtilmedi' },
        ],
      },
    ],
  },
})

const createTextPayload = (messageBody: string, recipientPhone: string) => ({
  messaging_product: 'whatsapp',
  to: recipientPhone,
  type: 'text',
  text: {
    body: messageBody,
    preview_url: false,
  },
})

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return jsonResponse({ error: 'Sadece POST desteklenir.' }, 405)
  }

  try {
    const accessToken = getRequiredEnv('WHATSAPP_ACCESS_TOKEN')
    const phoneNumberId = getRequiredEnv('WHATSAPP_PHONE_NUMBER_ID')
    const recipientPhone = cleanPhone(getRequiredEnv('WHATSAPP_NOTIFY_TO'))
    const graphVersion = Deno.env.get('WHATSAPP_GRAPH_VERSION')?.trim() || 'v22.0'

    if (!recipientPhone) {
      throw new Error('WHATSAPP_NOTIFY_TO geçerli bir telefon numarası değil.')
    }

    const payload = normalizePayload(await request.json())
    const messageBody = createMessageBody(payload)
    const requestBody = Deno.env.get('WHATSAPP_TEMPLATE_NAME')?.trim()
      ? createTemplatePayload(payload, recipientPhone)
      : createTextPayload(messageBody, recipientPhone)

    const response = await fetch(
      `https://graph.facebook.com/${graphVersion}/${phoneNumberId}/messages`,
      {
        body: JSON.stringify(requestBody),
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        method: 'POST',
      },
    )
    const result = await response.json().catch(() => ({}))

    if (!response.ok) {
      console.error('WhatsApp Cloud API hatası:', result)
      return jsonResponse(
        {
          error: 'WhatsApp bildirimi gönderilemedi.',
          providerStatus: response.status,
          result,
        },
        502,
      )
    }

    return jsonResponse({
      ok: true,
      provider: 'whatsapp-cloud-api',
      result,
    })
  } catch (error) {
    console.error('WhatsApp bildirim fonksiyonu hatası:', error)
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : 'WhatsApp bildirimi gönderilemedi.',
      },
      400,
    )
  }
})
