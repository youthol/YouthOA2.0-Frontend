import { getYoutholerInfo } from 'assets/js/oaApi.js'
import { clearToken } from 'assets/js/token.js'
import { useUserStore } from 'store/store.js'

let pending = null

export function isAdminIdentity(identity, position) {
  const role = String(identity || '').trim()
  const job = String(position || '').trim()
  return role === '管理员' || job === '管理员'
}

export function applyYoutholer(payload) {
  const info = payload && payload.identity == null && payload.data ? payload.data : payload || {}
  const store = useUserStore()
  store.sdut_id = info.sdut_id || ''
  store.is_login = true
  store.name = info.name || ''
  store.department = info.department || ''
  store.identity = String(info.identity || '').trim()
  store.position = String(info.position || '').trim()
  return store
}

export function resetSession() {
  pending = null
}

export function ensureSession() {
  if (!pending) {
    pending = getYoutholerInfo()
      .then((res) => applyYoutholer(res.data))
      .catch((error) => {
        pending = null
        const store = useUserStore()
        store.sdut_id = ''
        store.is_login = false
        store.identity = ''
        store.position = ''
        if (error?.response?.status === 401) {
          clearToken()
          const base = import.meta.env.BASE_URL || '/'
          if (!window.location.pathname.includes('/login')) {
            window.location.replace(`${base}login/`)
          }
        }
        throw error
      })
  }
  return pending
}
