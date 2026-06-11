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
import { fallbackContent } from '../fallbackContent.js'
import { createSectionBackgroundStyle } from '../lib/siteImages.js'

const defaultContent = fallbackContent.dailyFlowContent

const flowStepSets = {
  groupA: {
    morning: [
      { title: 'Döngü’ye Geliş', icon: Home },
      { title: 'Bilişim Eğitimi', icon: Laptop },
      { title: 'Atölye Çalışmaları', icon: Wrench },
      { title: 'Yemek ve Hazırlık', icon: Utensils },
    ],
    afternoon: [
      { title: 'Servis ile Spor', icon: Bus },
      { title: 'Spor Aktivitesi', icon: Trophy },
      { title: 'Döngü’ye Dönüş', icon: RotateCcw },
      { title: '17:30 Veli Teslimi', icon: Users },
    ],
  },
  groupB: {
    morning: [
      { title: 'Döngü’ye Geliş', icon: Home },
      { title: 'Servis ile Spor', icon: Bus },
      { title: 'Spor Aktivitesi', icon: Trophy },
      { title: 'Döngü’ye Dönüş', icon: RotateCcw },
    ],
    afternoon: [
      { title: 'Öğle Yemeği', icon: Utensils },
      { title: 'Bilişim Eğitimi', icon: Laptop },
      { title: 'Atölye Çalışmaları', icon: Wrench },
      { title: '17:30 Veli Teslimi', icon: Users },
    ],
  },
}

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

const mergeContent = (content = {}) => ({
  ...defaultContent,
  ...Object.fromEntries(
    Object.entries(content).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  ),
})

const getFlowGroups = (content) => [
  {
    label: content.groupALabel,
    title: content.groupATitle,
    tone: 'orange',
    morningTitle: content.morningTitle,
    morning: flowStepSets.groupA.morning,
    afternoonTitle: content.afternoonTitle,
    afternoon: flowStepSets.groupA.afternoon,
  },
  {
    label: content.groupBLabel,
    title: content.groupBTitle,
    tone: 'blue',
    morningTitle: content.morningTitle,
    morning: flowStepSets.groupB.morning,
    afternoonTitle: content.afternoonTitle,
    afternoon: flowStepSets.groupB.afternoon,
  },
]

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

function SwitchPill({ label }) {
  return (
    <div className="flex justify-center">
      <span className="orion-gradient inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white shadow-[0_16px_34px_rgba(255,106,42,0.24)]">
        <ArrowLeftRight size={17} strokeWidth={2.6} aria-hidden="true" />
        {label}
      </span>
    </div>
  )
}

function FlowGroupCard({ group, switchLabel }) {
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
        <SwitchPill label={switchLabel} />
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

function DailyFlowSection({ backgroundImage, content }) {
  const sectionContent = mergeContent(content)
  const backgroundStyle = createSectionBackgroundStyle(backgroundImage)
  const flowGroups = getFlowGroups(sectionContent)

  return (
    <section
      id="akis"
      className="section-background-frame bg-[linear-gradient(180deg,#FFFBF5_0%,#FFFFFF_100%)] py-12 text-[#222222] sm:py-14 lg:py-16"
      style={backgroundStyle}
    >
      <div className="section-shell">
        <div className="overflow-hidden rounded-[2rem] border border-[#FFE0CC] bg-[radial-gradient(circle_at_10%_20%,rgba(255,106,42,0.08),transparent_18rem),radial-gradient(circle_at_92%_84%,rgba(22,138,203,0.12),transparent_20rem),linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(255,248,240,0.92)_100%)] px-4 py-8 shadow-[0_28px_90px_rgba(255,106,42,0.1)] sm:rounded-[2.35rem] sm:px-6 sm:py-10 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <p className="section-eyebrow">{sectionContent.eyebrow}</p>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black leading-[1.08] text-[#222222] min-[390px]:text-4xl sm:text-5xl lg:text-6xl">
              {sectionContent.title}
            </h2>
            <p className="mx-auto mt-4 max-w-3xl text-sm font-semibold leading-7 text-[#222222]/62 sm:text-base sm:leading-8">
              {sectionContent.description}
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2 lg:gap-6">
            {flowGroups.map((group) => (
              <FlowGroupCard
                key={group.tone}
                group={group}
                switchLabel={sectionContent.switchLabel}
              />
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-[#FFE0CC] bg-white/94 px-5 py-4 text-center shadow-[0_18px_44px_rgba(34,34,34,0.06)]">
            <p className="text-sm font-black leading-6 text-[#222222] sm:text-base">
              {sectionContent.footerNote}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default DailyFlowSection
