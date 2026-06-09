const demoSessionKey = 'orion-admin-demo-session'
const usernameDomain = (import.meta.env.VITE_ADMIN_USERNAME_DOMAIN || 'orionkamp.local').trim().toLowerCase()
const demoUsername = import.meta.env.VITE_DEMO_ADMIN_USERNAME || 'admin'
const demoPassword = import.meta.env.VITE_DEMO_ADMIN_PASSWORD || 'orion2026'

export const getAdminEmailFromUsername = (username) => {
  const normalizedUsername = username.trim().toLowerCase()

  if (normalizedUsername.includes('@')) {
    return normalizedUsername
  }

  return `${normalizedUsername}@${usernameDomain}`
}

export const validateDemoAdminLogin = ({ username, password }) =>
  username.trim().toLowerCase() === demoUsername.toLowerCase() &&
  password === demoPassword

export const hasDemoAdminSession = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return window.localStorage.getItem(demoSessionKey) === 'active'
}

export const startDemoAdminSession = () => {
  window.localStorage.setItem(demoSessionKey, 'active')
}

export const clearDemoAdminSession = () => {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(demoSessionKey)
  }
}
