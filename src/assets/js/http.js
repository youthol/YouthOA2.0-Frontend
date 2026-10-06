import axios from 'axios'
import { getToken } from './token.js'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/youthol'
})

http.interceptors.request.use((config) => {
  const accessToken = getToken()
  const url = String(config.url || '')
  if (accessToken && !config.headers?.Authorization && !url.includes('/SignIn/')) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})
