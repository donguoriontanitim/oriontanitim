import heroImage from './assets/orion-hero.png'

export const whatsappNumber =
  (import.meta.env.VITE_WHATSAPP_PHONE || '905327236648').trim().replace(/\D/g, '') ||
  '905327236648'

export const whatsappMessage =
  'Merhaba, Orion Kamp 2026 hakkında detaylı bilgi almak istiyorum.'

export const fallbackContent = {
  hero: {
    title: 'ORION KAMP 2026',
    eyebrow: '7–13 yaş çocuklar için yaz kampı',
    html: '<p>7–13 yaş çocuklar için teknoloji, spor ve eğlence dolu unutulmaz bir yaz kampı!</p>',
    ctaLabel: 'Bilgi Al',
    secondaryCtaLabel: 'Programı İncele',
    image: heroImage,
    partners: [
      { id: 'partner-1', name: 'Anlaşmalı eğitim kurumu logosu 1', shortName: 'LOGO 1', logo_url: '' },
      { id: 'partner-2', name: 'Anlaşmalı eğitim kurumu logosu 2', shortName: 'LOGO 2', logo_url: '' },
      { id: 'partner-3', name: 'Anlaşmalı eğitim kurumu logosu 3', shortName: 'LOGO 3', logo_url: '' },
    ],
  },
  summary: {
    title: 'Kamp Özeti',
    html: '<p>Orion Kamp 2026, çocukların merak duygusunu canlı tutan; robotik kodlama, 3D tasarım, oyun tasarımı, spor ve sanat etkinlikleriyle zenginleşen bütüncül bir yaz programıdır.</p>',
  },
  stats: [
    { value: '7-13', label: 'Yaş aralığı' },
    { value: '10+', label: 'Etkinlik alanı' },
    { value: 'STEM', label: 'Teknoloji odağı' },
    { value: 'Aktif', label: 'Spor ve sanat' },
  ],
  programs: [
    {
      id: 'game-design',
      title: 'Oyun Tasarımı',
      description: 'Çocuklar kendi oyun fikirlerini kurgular, karakter ve seviye mantığını keşfeder.',
      icon: 'Gamepad2',
      is_active: true,
    },
    {
      id: 'arduino',
      title: 'Arduino Robotik Kodlama',
      description: 'Sensörler, motorlar ve temel kodlama ile üretmenin keyfini yaşarlar.',
      icon: 'Bot',
      is_active: true,
    },
    {
      id: '3d-design',
      title: '3D Tasarım',
      description: 'Hayal ettikleri nesneleri dijital ortamda modellemeye başlarlar.',
      icon: 'Box',
      is_active: true,
    },
    {
      id: 'block-coding',
      title: 'Blok Tabanlı Kodlama',
      description: 'Algoritmik düşünmeyi renkli ve oyunlaştırılmış görevlerle öğrenirler.',
      icon: 'Blocks',
      is_active: true,
    },
    {
      id: 'swimming',
      title: 'Yüzme',
      description: 'Yaz kampının enerjisini güvenli ve keyifli havuz etkinlikleriyle dengeler.',
      icon: 'Waves',
      is_active: true,
    },
    {
      id: 'gymnastics',
      title: 'Jimnastik',
      description: 'Koordinasyon, esneklik ve beden farkındalığı desteklenir.',
      icon: 'Activity',
      is_active: true,
    },
    {
      id: 'football',
      title: 'Futbol',
      description: 'Takım ruhu ve hareketli oyunlarla sosyal beceriler güçlenir.',
      icon: 'CircleDot',
      is_active: true,
    },
    {
      id: 'painting',
      title: 'Resim',
      description: 'Renk, çizgi ve hayal gücü ile yaratıcı ifade alanı açılır.',
      icon: 'Palette',
      is_active: true,
    },
    {
      id: 'english',
      title: 'İngilizce Etkinlikler',
      description: 'Günlük ifadeler oyun, drama ve mini görevlerle pratik edilir.',
      icon: 'Languages',
      is_active: true,
    },
    {
      id: 'math',
      title: 'Oyunlaştırılmış Matematik',
      description: 'Problem çözme ve mantık yürütme eğlenceli meydan okumalarla gelişir.',
      icon: 'Sigma',
      is_active: true,
    },
  ],
  whyOrion: [
    {
      id: 'future-ready',
      title: 'Geleceğe Hazırlar',
      text: 'Teknoloji, üretim ve problem çözme odaklı atölyelerle çocukların merakını güçlü becerilere dönüştürür.',
    },
    {
      id: 'expert-trainers',
      title: 'Uzman Eğitmenler',
      text: 'Alanında deneyimli ekipler, yaş grubuna uygun anlatım ve uygulamalarla her çocuğa eşlik eder.',
    },
    {
      id: 'safe-comfortable',
      title: 'Güvenli ve Konforlu',
      text: 'Kontrollü kamp akışı, net iletişim ve rahat ortam sayesinde çocuklar gün boyunca güvende hisseder.',
    },
    {
      id: 'social-happy',
      title: 'Sosyal ve Mutlu Çocuklar',
      text: 'Takım çalışması, oyunlar ve paylaşım alanları çocukların arkadaşlık kurmasını doğal şekilde destekler.',
    },
    {
      id: 'learn-with-fun',
      title: 'Eğlenerek Öğrenme',
      text: 'Kamp deneyimi; spor, sanat, kodlama ve keşif görevlerini neşeli bir öğrenme ritminde birleştirir.',
    },
    {
      id: 'certified-experience',
      title: 'Sertifikalı Deneyim',
      text: 'Çocuklar kamp sonunda katıldıkları üretim ve keşif sürecini hatırlatan anlamlı bir deneyim kazanır.',
    },
  ],
  dailyFlow: [
    {
      id: 'welcome',
      time: '08:30 - 09:00',
      title: 'Karşılama',
      text: 'Güne sakin başlangıç, yoklama ve kısa hazırlık.',
    },
    {
      id: 'technology-workshop',
      time: '09:00 - 10:30',
      title: 'Teknoloji Atölyesi',
      text: 'Kodlama, robotik veya tasarım odaklı üretim zamanı.',
    },
    {
      id: 'game-sports',
      time: '10:45 - 12:15',
      title: 'Oyun / Spor Etkinlikleri',
      text: 'Hareket, takım oyunu ve enerjik açık alan etkinlikleri.',
    },
    {
      id: 'lunch',
      time: '12:15 - 13:15',
      title: 'Öğle Arası',
      text: 'Dinlenme, yemek ve serbest sohbet molası.',
    },
    {
      id: 'creative-art',
      time: '13:30 - 15:00',
      title: 'Yaratıcı / Sanatsal Etkinlikler',
      text: 'Sanat, üretim ve hayal gücünü destekleyen çalışmalar.',
    },
    {
      id: 'activities',
      time: '15:15 - 16:30',
      title: 'Etkinlikler',
      text: 'Günün temasına göre seçilen ek atölye ve oyunlar.',
    },
    {
      id: 'day-review',
      time: '16:30 - 17:00',
      title: 'Gün Sonu Değerlendirme',
      text: 'Paylaşım, kısa değerlendirme ve kapanış ritmi.',
    },
  ],
  gallery: [
    {
      id: 'lab',
      title: 'Robotik ve Kodlama',
      image_url: heroImage,
      alt_text: 'Robotik kodlama atölyesinde çocuklar',
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'design',
      title: 'Tasarım Görevleri',
      image_url: heroImage,
      alt_text: '3D tasarım ve oyun tasarımı etkinliği',
      sort_order: 2,
      is_active: true,
    },
    {
      id: 'team',
      title: 'Takım Enerjisi',
      image_url: heroImage,
      alt_text: 'Orion Kamp takım etkinliği',
      sort_order: 3,
      is_active: true,
    },
  ],
  faqs: [
    {
      id: 'age',
      question: 'Kamp hangi yaş grubu için uygundur?',
      answer: 'Orion Kamp 2026, 7-13 yaş aralığındaki çocuklar için planlanmıştır.',
      is_html: false,
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'price',
      question: 'Fiyat bilgisi nereden alınır?',
      answer: 'Fiyat ve kontenjan detayları için formu bırakabilir veya WhatsApp üzerinden iletişime geçebilirsiniz.',
      is_html: false,
      sort_order: 2,
      is_active: true,
    },
    {
      id: 'content',
      question: 'Çocuğum tüm etkinliklere katılabilir mi?',
      answer: 'Program akışı yaş, ilgi alanı ve grup dinamiğine göre dengelenir. Detayları görüşmede birlikte netleştiririz.',
      is_html: false,
      sort_order: 3,
      is_active: true,
    },
    {
      id: 'contact',
      question: 'Form gönderince ne olur?',
      answer: 'Talebiniz ekibe düşer, ekranda bilgilendirme gösterilir ve WhatsApp görüşmesine yönlendirilirsiniz.',
      is_html: false,
      sort_order: 4,
      is_active: true,
    },
  ],
  contactInfo: {
    phone1: '0 (532) 723 66 48',
    phone2: '0 (532) 603 66 48',
    mail: 'dongusoft@gmail.com',
    instagram: '@dongu.akademi',
    address: 'Gazipaşa Mah. Yavuz Selim Blv. Mustafa Köstereli İş Mrk. Kat:2 No:10 Ortahisar/Trabzon',
  },
}
