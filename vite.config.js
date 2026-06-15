import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const publicBasePath = process.env.VITE_PUBLIC_BASE_PATH || env.VITE_PUBLIC_BASE_PATH || '/oriontanitim/'
  const googleSiteVerification =
    process.env.VITE_GOOGLE_SITE_VERIFICATION || env.VITE_GOOGLE_SITE_VERIFICATION || ''

  return {
    base: publicBasePath,
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'orion-google-site-verification',
        transformIndexHtml() {
          const verificationToken = googleSiteVerification.trim()

          if (!verificationToken) {
            return []
          }

          return [
            {
              tag: 'meta',
              attrs: {
                name: 'google-site-verification',
                content: verificationToken,
              },
              injectTo: 'head',
            },
          ]
        },
      },
    ],
  }
})
