import { ArrowLeft, Rocket } from 'lucide-react'
import Footer from './Footer.jsx'

function LegalPage({ document, contactInfo }) {
  const Icon = document.icon

  return (
    <div className="orion-page-bg min-h-screen text-[#0B1026]">
      <header className="section-shell flex items-center justify-between gap-4 py-5">
        <a href="#/" className="inline-flex min-w-0 items-center gap-3">
          <span className="orion-gradient grid size-11 shrink-0 place-items-center rounded-2xl text-white shadow-[0_14px_30px_rgba(255,106,42,0.24)]">
            <Rocket size={21} aria-hidden="true" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-black tracking-[0.14em]">ORION</span>
            <span className="block truncate text-xs font-black text-[#FF6A2A]">KAMP 2026</span>
          </span>
        </a>

        <a href="#/" className="landing-soft-button shrink-0">
          <ArrowLeft size={17} aria-hidden="true" />
          Ana Sayfa
        </a>
      </header>

      <main className="section-shell pb-12 pt-4 sm:pb-16 sm:pt-8">
        <article className="soft-card-strong mx-auto max-w-4xl overflow-hidden">
          <div className="border-b border-[#FFE0CC] bg-[#FFF8F0] p-5 sm:p-8">
            <div className="orion-gradient mb-5 grid size-13 place-items-center rounded-2xl text-white shadow-[0_16px_34px_rgba(255,106,42,0.24)]">
              <Icon size={27} aria-hidden="true" />
            </div>
            <p className="section-eyebrow">{document.eyebrow}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight sm:text-5xl">{document.title}</h1>
            <p className="mt-4 max-w-2xl text-base font-semibold leading-7 text-[#0B1026]/68">
              {document.description}
            </p>
            <p className="mt-4 text-sm font-bold text-[#0B1026]/46">Son güncelleme: 8 Haziran 2026</p>
          </div>

          <div className="grid gap-5 p-5 sm:p-8">
            {document.sections.map((section) => (
              <section key={section.heading} className="rounded-2xl border border-[#FFE0CC] bg-white p-4 sm:p-5">
                <h2 className="text-lg font-black text-[#0B1026]">{section.heading}</h2>
                <div className="mt-3 grid gap-3 text-sm font-semibold leading-7 text-[#0B1026]/66 sm:text-base">
                  {section.body.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </main>

      <Footer contactInfo={contactInfo} />
    </div>
  )
}

export default LegalPage
