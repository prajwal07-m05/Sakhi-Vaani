import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// The client imports the shared domain code from ../core, ../database, ../ai-services etc.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { port: 5173, fs: { allow: [path.resolve(__dirname, '..')] } },
})
