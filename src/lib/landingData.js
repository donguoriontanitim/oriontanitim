import { fallbackContent } from '../fallbackContent.js'
import { isSupabaseConfigured, supabase } from './supabaseClient.js'

const defaultContactContent = {
  eyebrow: 'İletişim',
  title: 'SİZİ ARAYALIM,',
  highlight: 'DETAYLARI BİRLİKTE PLANLAYALIM',
  description: 'Formu doldurun, en kısa sürede size ulaşalım.',
  quickTitle: 'WhatsApp ile hemen yazın.',
  quickDescription:
    'Formu beklemeden sorularınızı iletebilir, kamp detayları için hızlı dönüş alabilirsiniz.',
}

const getContentValue = (rows, sectionKey, contentKey) =>
  rows.find(
    (row) =>
      row.section_key === sectionKey &&
      row.content_key === contentKey &&
      row.is_active !== false &&
      row.content_value,
  )?.content_value

const getRemoteRows = async (query, fallbackValue, label) => {
  try {
    const { data, error } = await query

    if (error) {
      throw error
    }

    return data?.length ? data : fallbackValue
  } catch (error) {
    console.warn(`${label} Supabase verisi alınamadı, fallback kullanılacak: ${error.message}`)
    return fallbackValue
  }
}

const mapSiteContents = (rows = []) => {
  const contactTitle = getContentValue(rows, 'contact', 'title')
  const contactHighlight = getContentValue(rows, 'contact', 'highlight')
  const hero = {
    ...fallbackContent.hero,
    title: getContentValue(rows, 'hero', 'title') || fallbackContent.hero.title,
    eyebrow: getContentValue(rows, 'hero', 'eyebrow') || fallbackContent.hero.eyebrow,
    html:
      getContentValue(rows, 'hero', 'subtitle_html') ||
      getContentValue(rows, 'hero', 'subtitle') ||
      fallbackContent.hero.html,
    ctaLabel:
      getContentValue(rows, 'hero', 'primary_button') ||
      getContentValue(rows, 'hero', 'cta_label') ||
      fallbackContent.hero.ctaLabel,
    secondaryCtaLabel:
      getContentValue(rows, 'hero', 'secondary_button') ||
      getContentValue(rows, 'hero', 'secondary_cta_label') ||
      fallbackContent.hero.secondaryCtaLabel,
  }

  const summary = {
    ...fallbackContent.summary,
    title: getContentValue(rows, 'summary', 'title') || fallbackContent.summary.title,
    html:
      getContentValue(rows, 'summary', 'body') ||
      getContentValue(rows, 'summary', 'html') ||
      fallbackContent.summary.html,
  }

  const dailyFlow = {
    ...fallbackContent.dailyFlowContent,
    eyebrow:
      getContentValue(rows, 'daily_flow', 'eyebrow') || fallbackContent.dailyFlowContent.eyebrow,
    title: getContentValue(rows, 'daily_flow', 'title') || fallbackContent.dailyFlowContent.title,
    description:
      getContentValue(rows, 'daily_flow', 'description') ||
      fallbackContent.dailyFlowContent.description,
    groupALabel:
      getContentValue(rows, 'daily_flow', 'group_a_label') ||
      fallbackContent.dailyFlowContent.groupALabel,
    groupATitle:
      getContentValue(rows, 'daily_flow', 'group_a_title') ||
      fallbackContent.dailyFlowContent.groupATitle,
    groupBLabel:
      getContentValue(rows, 'daily_flow', 'group_b_label') ||
      fallbackContent.dailyFlowContent.groupBLabel,
    groupBTitle:
      getContentValue(rows, 'daily_flow', 'group_b_title') ||
      fallbackContent.dailyFlowContent.groupBTitle,
    morningTitle:
      getContentValue(rows, 'daily_flow', 'morning_title') ||
      fallbackContent.dailyFlowContent.morningTitle,
    afternoonTitle:
      getContentValue(rows, 'daily_flow', 'afternoon_title') ||
      fallbackContent.dailyFlowContent.afternoonTitle,
    switchLabel:
      getContentValue(rows, 'daily_flow', 'switch_label') ||
      fallbackContent.dailyFlowContent.switchLabel,
    footerNote:
      getContentValue(rows, 'daily_flow', 'footer_note') ||
      fallbackContent.dailyFlowContent.footerNote,
  }

  const contact = {
    ...defaultContactContent,
    eyebrow: getContentValue(rows, 'contact', 'eyebrow') || defaultContactContent.eyebrow,
    title: contactTitle || defaultContactContent.title,
    highlight: contactHighlight || (contactTitle ? '' : defaultContactContent.highlight),
    description: getContentValue(rows, 'contact', 'description') || defaultContactContent.description,
    quickTitle: getContentValue(rows, 'contact', 'quick_title') || defaultContactContent.quickTitle,
    quickDescription:
      getContentValue(rows, 'contact', 'quick_description') || defaultContactContent.quickDescription,
  }

  const contactInfo = {
    ...fallbackContent.contactInfo,
    phone1: getContentValue(rows, 'footer', 'phone_1') || fallbackContent.contactInfo.phone1,
    phone2: getContentValue(rows, 'footer', 'phone_2') || fallbackContent.contactInfo.phone2,
    mail: getContentValue(rows, 'footer', 'email') || fallbackContent.contactInfo.mail,
    instagram: getContentValue(rows, 'footer', 'instagram') || fallbackContent.contactInfo.instagram,
    address: getContentValue(rows, 'footer', 'address') || fallbackContent.contactInfo.address,
  }

  return { contact, contactInfo, dailyFlow, hero, summary }
}

export const getLandingData = async () => {
  if (!isSupabaseConfigured) {
    return {
      contact: defaultContactContent,
      contactInfo: fallbackContent.contactInfo,
      dailyFlow: fallbackContent.dailyFlowContent,
      faqs: fallbackContent.faqs,
      hero: fallbackContent.hero,
      programs: fallbackContent.programs,
      summary: fallbackContent.summary,
    }
  }

  const [siteContents, programs, faqs] = await Promise.all([
    getRemoteRows(
      supabase
        .from('site_contents')
        .select('section_key,content_key,content_value,is_active,sort_order')
        .eq('is_active', true)
        .order('section_key', { ascending: true })
        .order('sort_order', { ascending: true }),
      [],
      'site_contents',
    ),
    getRemoteRows(
      supabase
        .from('program_items')
        .select('id,title,description,icon_name,color_class,sort_order,is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      fallbackContent.programs,
      'program_items',
    ),
    getRemoteRows(
      supabase
        .from('faq_items')
        .select('id,question,answer,is_html,sort_order,is_active')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      fallbackContent.faqs,
      'faq_items',
    ),
  ])

  const mappedContents = mapSiteContents(siteContents)

  return {
    ...mappedContents,
    faqs,
    programs,
  }
}
