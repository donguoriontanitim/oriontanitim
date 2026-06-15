import { useEffect } from 'react'
import { insertAnalyticsEvent, trackedSections } from '../lib/analytics.js'
import { replaceLandingSectionUrl } from '../lib/sectionNavigation.js'

function useLandingAnalytics() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined
    }

    insertAnalyticsEvent({ event_type: 'page_view' })

    const sectionRatios = new Map()
    const activeSectionRef = { current: null }
    const activeStartedAtRef = { current: Date.now() }

    const recordActiveSection = () => {
      const activeSection = activeSectionRef.current

      if (!activeSection) {
        return
      }

      const now = Date.now()
      const durationMs = now - activeStartedAtRef.current
      activeStartedAtRef.current = now

      if (durationMs >= 1000) {
        insertAnalyticsEvent({
          event_type: 'section_view',
          section_id: activeSection,
          duration_ms: durationMs,
        })
      }
    }

    const setActiveSection = (sectionId) => {
      if (!sectionId || sectionId === activeSectionRef.current) {
        return
      }

      recordActiveSection()
      activeSectionRef.current = sectionId
      activeStartedAtRef.current = Date.now()
      replaceLandingSectionUrl(sectionId)
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          sectionRatios.set(entry.target.id, entry.intersectionRatio)
        })

        const [mostVisibleSectionId, mostVisibleRatio] = [...sectionRatios.entries()].sort(
          (a, b) => b[1] - a[1],
        )[0] || []

        if (mostVisibleRatio >= 0.32) {
          setActiveSection(mostVisibleSectionId)
        }
      },
      {
        root: null,
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )

    trackedSections.forEach((section) => {
      const element = document.getElementById(section.id)

      if (element) {
        observer.observe(element)
      }
    })

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordActiveSection()
      }
    }

    window.addEventListener('beforeunload', recordActiveSection)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      recordActiveSection()
      observer.disconnect()
      window.removeEventListener('beforeunload', recordActiveSection)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}

export default useLandingAnalytics
