import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import process from 'node:process'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const publicBasePath = process.env.VITE_PUBLIC_BASE_PATH || env.VITE_PUBLIC_BASE_PATH || '/oriontanitim/'

  return {
    base: publicBasePath,
    plugins: [react(), tailwindcss()],
  }
})
