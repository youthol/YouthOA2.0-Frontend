import axios from 'axios'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/yout-42/api'
})

http.interceptors.request.use((config) => {
  const accessToken = localStorage.getItem('YoutholAccessToken')

  if (accessToken && !config.headers?.Authorization) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  return config
})
