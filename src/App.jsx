import { useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminLayout from './admin/AdminLayout.jsx'
import AdminLogin from './admin/AdminLogin.jsx'
import ContactRequests from './admin/ContactRequests.jsx'
import ContentManager from './admin/ContentManager.jsx'
import Dashboard from './admin/Dashboard.jsx'
import FaqManager from './admin/FaqManager.jsx'
import GalleryManager from './admin/GalleryManager.jsx'
import ImageManager from './admin/ImageManager.jsx'
import ProgramManager from './admin/ProgramManager.jsx'
import CampSummary from './components/CampSummary.jsx'
import ContactSection from './components/ContactSection.jsx'
import DailyFlowSection from './components/DailyFlowSection.jsx'
import FaqSection from './components/FaqSection.jsx'
import Footer from './components/Footer.jsx'
import GallerySection from './components/GallerySection.jsx'
import HeroSection from './components/HeroSection.jsx'
import LegalPage from './components/LegalPage.jsx'
import Navbar from './components/Navbar.jsx'
import ProgramSection from './components/ProgramSection.jsx'
import WhyOrionSection from './components/WhyOrionSection.jsx'
import { fallbackContent } from './fallbackContent.js'
import { legalDocuments } from './legalDocuments.js'
import {
  filterImagesByUsageArea,
  getActiveSiteImages,
  getFirstImageByUsageArea,
  mapImagesByRelatedKey,
} from './lib/siteImages.js'
import { getLandingData } from './lib/landingData.js'

function LandingPage() {
  const [siteImages, setSiteImages] = useState([])
  const [landingData, setLandingData] = useState(() => ({
    contact: null,
    contactInfo: fallbackContent.contactInfo,
    faqs: fallbackContent.faqs,
    hero: fallbackContent.hero,
    programs: fallbackContent.programs,
    summary: fallbackContent.summary,
  }))
  const location = useLocation()

  useEffect(() => {
    let isMounted = true

    getLandingData().then((data) => {
      if (isMounted) {
        setLandingData(data)
      }
    })

    getActiveSiteImages().then((images) => {
      if (isMounted) {
        setSiteImages(images)
      }
    })

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    const sectionId = new URLSearchParams(location.search).get('section')

    if (!sectionId) {
      return undefined
    }

    const frameId = window.requestAnimationFrame(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [location.search])

  const imageSlots = useMemo(() => {
    const programImages = filterImagesByUsageArea(siteImages, 'program_card')
    const whyOrionImages = filterImagesByUsageArea(siteImages, 'why_orion_card')
    const dailyFlowImages = filterImagesByUsageArea(siteImages, 'daily_flow')
    const summaryImages = filterImagesByUsageArea(siteImages, 'summary_card')
    const partnerLogoImages = filterImagesByUsageArea(siteImages, 'partner_logo')
    const contactPanelImages = filterImagesByUsageArea(siteImages, 'contact_panel_image')

    return {
      contactPanelByKey: mapImagesByRelatedKey(contactPanelImages),
      contactRobot: getFirstImageByUsageArea(siteImages, 'contact_robot'),
      footerDecoration: getFirstImageByUsageArea(siteImages, 'footer_decoration'),
      gallery: filterImagesByUsageArea(siteImages, 'gallery'),
      heroDesktop: getFirstImageByUsageArea(siteImages, 'hero_desktop'),
      heroMobile: getFirstImageByUsageArea(siteImages, 'hero_mobile'),
      partnerLogosByKey: mapImagesByRelatedKey(partnerLogoImages),
      programByKey: mapImagesByRelatedKey(programImages),
      dailyFlowByKey: mapImagesByRelatedKey(dailyFlowImages),
      summaryByKey: mapImagesByRelatedKey(summaryImages),
      whyOrionByKey: mapImagesByRelatedKey(whyOrionImages),
    }
  }, [siteImages])

  return (
    <div className="orion-page-bg text-[#0B1026]">
      <Navbar contactInfo={landingData.contactInfo} />
      <main>
        <HeroSection
          content={landingData.hero}
          desktopImage={imageSlots.heroDesktop}
          mobileImage={imageSlots.heroMobile}
          partnerLogosByKey={imageSlots.partnerLogosByKey}
        />
        <CampSummary
          content={landingData.summary}
          stats={fallbackContent.stats}
          imagesByRelatedKey={imageSlots.summaryByKey}
        />
        <ProgramSection programs={landingData.programs} imagesByRelatedKey={imageSlots.programByKey} />
        <WhyOrionSection items={fallbackContent.whyOrion} imagesByRelatedKey={imageSlots.whyOrionByKey} />
        <DailyFlowSection items={fallbackContent.dailyFlow} imagesByRelatedKey={imageSlots.dailyFlowByKey} />
        <GallerySection images={fallbackContent.gallery} siteImages={imageSlots.gallery} />
        <FaqSection faqs={landingData.faqs} />
        <ContactSection
          programs={landingData.programs}
          contactInfo={landingData.contactInfo}
          content={landingData.contact}
          contactQuickImage={imageSlots.contactPanelByKey?.['quick-contact']}
          contactSideImage={imageSlots.contactPanelByKey?.['right-panel']}
          contactImage={imageSlots.contactRobot}
        />
      </main>
      <Footer contactInfo={landingData.contactInfo} decorationImage={imageSlots.footerDecoration} />
    </div>
  )
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route
        path="/kvkk"
        element={<LegalPage document={legalDocuments.kvkk} contactInfo={fallbackContent.contactInfo} />}
      />
      <Route
        path="/gizlilik-politikasi"
        element={<LegalPage document={legalDocuments.privacy} contactInfo={fallbackContent.contactInfo} />}
      />
      <Route
        path="/kullanim-sartlari"
        element={<LegalPage document={legalDocuments.terms} contactInfo={fallbackContent.contactInfo} />}
      />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="contents" element={<ContentManager />} />
        <Route path="programs" element={<ProgramManager />} />
        <Route path="gallery" element={<GalleryManager />} />
        <Route path="images" element={<ImageManager />} />
        <Route path="faqs" element={<FaqManager />} />
        <Route path="contacts" element={<ContactRequests />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
