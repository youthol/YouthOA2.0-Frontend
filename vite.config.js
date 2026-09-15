import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import { resolve } from 'path'

// let __dirname = fileURLToPath(new URL('.', import.meta.url))
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  base: process.env.VITE_APP_BASE || '/youthol/',
  build: {
    rollupOptions: {
      input: {
        main: '/index.html',
        login: '/login/index.html',
        oa: '/OA/index.html'
        // main: resolve(__dirname, 'index.html'),
        // login: resolve(__dirname, '/login/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      assets: fileURLToPath(new URL('./src/assets', import.meta.url)),
      store: fileURLToPath(new URL('./src/store', import.meta.url)),
      router: fileURLToPath(new URL('./src/router', import.meta.url)),
      components: fileURLToPath(new URL('./src/components', import.meta.url)),
      OA: fileURLToPath(new URL('./src/OA', import.meta.url))
    }
  }
})
