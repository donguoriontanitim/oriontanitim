import { trackedSections } from './analytics.js'

export const landingSectionIds = trackedSections.map((section) => section.id)

export const isLandingSectionId = (sectionId = '') => landingSectionIds.includes(sectionId)

export const getLandingSectionHref = (sectionId = 'hero') => `#/${sectionId}`

export const getLandingSectionPath = (sectionId = 'hero') => `/${sectionId}`

export const scrollToLandingSection = (sectionId = 'hero', options = {}) => {
  if (typeof document === 'undefined' || !isLandingSectionId(sectionId)) {
    return false
  }

  const element = document.getElementById(sectionId)

  if (!element) {
    return false
  }

  element.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
    ...options,
  })

  return true
}

export const replaceLandingSectionUrl = (sectionId = 'hero') => {
  if (typeof window === 'undefined' || !isLandingSectionId(sectionId)) {
    return
  }

  const nextHash = getLandingSectionHref(sectionId)

  if (window.location.hash === nextHash) {
    return
  }

  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${window.location.search}${nextHash}`,
  )
}
