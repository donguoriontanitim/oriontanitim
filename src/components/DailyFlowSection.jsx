import {
  ArrowLeftRight,
  Bus,
  Home,
  Laptop,
  RotateCcw,
  Trophy,
  Users,
  Utensils,
  Wrench,
} from 'lucide-react'
import { createSectionBackgroundStyle } from '../lib/siteImages.js'

const flowGroups = [
  {
    label: 'SABAH DÖNGÜ, ÖĞLEDEN SONRA SPOR',
    title: 'A Grubu',
    tone: 'orange',
    morningTitle: 'Sabah Programı',
    morning: [
      { title: 'Döngü’ye Geliş', icon: Home },
      { title: 'Bilişim Eğitimi', icon: Laptop },
      { title: 'Atölye Çalışmaları', icon: Wrench },
      { title: 'Yemek ve Hazırlık', icon: Utensils },
    ],
    afternoonTitle: 'Öğleden Sonra Programı',
    afternoon: [
      { title: 'Servis ile Spor', icon: Bus },
      { title: 'Spor Aktivitesi', icon: Trophy },
      { title: 'Döngü’ye Dönüş', icon: RotateCcw },
      { title: '17:30 Veli Teslimi', icon: Users },
    ],
  },
  {
    label: 'SABAH SPOR, ÖĞLEDEN SONRA DÖNGÜ',
    title: 'B Grubu',
    tone: 'blue',
    morningTitle: 'Sabah Programı',
    morning: [
      { title: 'Döngü’ye Geliş', icon: Home },
      { title: 'Servis ile Spor', icon: Bus },
      { title: 'Spor Aktivitesi', icon: Trophy },
      { title: 'Döngü’ye Dönüş', icon: RotateCcw },
    ],
    afternoonTitle: 'Öğleden Sonra Programı',
    afternoon: [
      { title: 'Öğle Yemeği', icon: Utensils },
      { title: 'Bilişim Eğitimi', icon: Laptop },
      { title: 'Atölye Çalışmaları', icon: Wrench },
      { title: '17:30 Veli Teslimi', icon: Users },
    ],
  },
]

const toneClasses = {
  orange: {
    label: 'text-[#FF6A2A]',
    icon: 'bg-[#FFF1E8] text-[#FF6A2A]',
  },
  blue: {
    label: 'text-[#168ACB]',
    icon: 'bg-[#E8F7FF] text-[#168ACB]',
  },
}

function StepItem({ step, tone }) {
  const Icon = step.icon
  const classes = toneClasses[tone] || toneClasses.orange

  return (
    <li className="group flex min-w-0 items-center gap-3 rounded-2xl border border-[#FFE0CC] bg-white px-3 py-3 text-left shadow-[0_10px_24px_rgba(34,34,34,0.04)] transition hover:-translate-y-0.5 hover:border-[#FFB58F] hover:shadow-[0_16px_34px_rgba(255,106,42,0.1)]">
      <span className={`grid size-10 shrink-0 place-items-center rounded-2xl ${classes.icon}`}>
        <Icon size={21} strokeWidth={2.4} aria-hidden="true" />
      </span>
      <span className="min-w-0 break-words text-sm font-black leading-snug text-[#222222]">
        {step.title}
      </span>
    </li>
  )
}

function ProgramBlock({ title, steps, tone, variant = 'morning' }) {
  const blockClass =
    variant === 'afternoon'
      ? 'border-[#D5F0FF] bg-[#F0FAFF]'
      : 'border-[#FFE0CC] bg-[#FFF8F0]'

  return (
    <div className={`rounded-[1.45rem] border p-4 sm:p-5 ${blockClass}`}>
      <h4 className="text-base font-black text-[#222222]">{title}</h4>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <StepItem key={step.title} step={step} tone={tone} />
        ))}
      </ul>
    </div>
  )
}

function SwitchPill() {
  return (
    <div className="flex justify-center">
      <span className="orion-gradient inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,42,0.24)]">
        <ArrowLeftRight size={17} strokeWidth={2.6} aria-hidden="true" />
        Gruplar Yer Değiştirir
      </span>
    </div>
  )
}

function FlowGroupCard({ group }) {
  const classes = toneClasses[group.tone] || toneClasses.orange

  return (
    <article className="min-w-0 rounded-[1.75rem] border border-[#FFE0CC] bg-white/94 p-4 shadow-[0_24px_70px_rgba(34,34,34,0.07)] sm:p-5 lg:p-6">
      <p className={`text-[0.72rem] font-black uppercase tracking-[0.2em] ${classes.label}`}>
        {group.label}
      </p>
      <h3 className="mt-3 text-2xl font-black leading-tight text-[#222222] sm:text-3xl">
        {group.title}
      </h3>

      <div className="mt-5 grid gap-5">
        <ProgramBlock title={group.morningTitle} steps={group.morning} tone={group.tone} />
        <SwitchPill />
        <ProgramBlock
          title={group.afternoonTitle}
          steps={group.afternoon}
          tone={group.tone}
          variant="afternoon"
        />
      </div>
    </article>
  )
}

function DailyFlowSection({ backgroundImage }) {
  const backgroundStyle = createSectionBackgroundStyle(backgroundImage)

  return (
    <section
      id="akis"
      className="section-background-frame bg-[linear-gradient(180deg,#FFFBF5_0%,#FFFFFF_100%)] py-12 text-[#222222] sm:py-14 lg:py-16"
      style={backgroundStyle}
    >
      <div className="section-shell">
        <div className="overflow-hidden rounded-[2rem] border border-[#FFE0CC] bg-[radial-gradient(circle_at_10%_20%,rgba(255,106,42,0.08),transparent_18rem),radial-gradient(circle_at_92%_84%,rgba(22,138,203,0.12),transparent_20rem),linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,248,240,0.92)_100%)] px-4 py-8 shadow-[0_28px_90px_rgba(255,106,42,0.1)] sm:rounded-[2.35rem] sm:px-6 sm:py-10 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="section-eyebrow">GÜNLÜK AKIŞ</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black leading-[1.08] text-[#222222] min-[390px]:text-4xl sm:text-5xl lg:text-6xl">
              Gün Boyunca Dengeli Bir Kamp Deneyimi
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm font-semibold leading-7 text-[#222222]/62 sm:text-base sm:leading-8">
              Öğrenciler A ve B grubu olarak planlı şekilde ilerler. Sabah ve öğleden sonra gruplar yer
              değiştirerek hem bilişim hem spor etkinliklerine katılır.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2 lg:gap-6">
            {flowGroups.map((group) => (
              <FlowGroupCard key={group.title} group={group} />
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-[#FFE0CC] bg-white/94 px-5 py-4 text-center shadow-[0_18px_44px_rgba(34,34,34,0.06)]">
            <p className="text-sm font-black leading-6 text-[#222222] sm:text-base">
              Gün sonunda iki grup da 17:30’da Döngü’den velilerine teslim edilir.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DailyFlowSection
