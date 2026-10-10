import { defineConfig, mergeConfig } from 'vite'
import base from './vite.config.js'

function bypass(req) {
  const url = String(req.url || '').split('?')[0]
  if (!url.startsWith('/youthol')) return url
  const rest = url.slice('/youthol'.length)
  if (
    rest === '' ||
    rest === '/' ||
    rest.startsWith('/OA') ||
    rest.startsWith('/login') ||
    rest.startsWith('/src') ||
    rest.startsWith('/@') ||
    rest.startsWith('/node_modules') ||
    rest.startsWith('/assets') ||
    /\.[a-zA-Z0-9]+$/.test(rest)
  ) {
    return url
  }
  return null
}

export default mergeConfig(
  base,
  defineConfig({
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      proxy: {
        '/youthol': {
          target: 'http://127.0.0.1:8001',
          changeOrigin: true,
          bypass
        }
      }
    }
  })
)
