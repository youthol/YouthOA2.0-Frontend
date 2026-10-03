const DARK_GREEN = '#0b6e4f'
const LIGHT_GREEN = '#8fd4a8'
const DARK_RED = '#d32f2f'
const LIGHT_RED = '#f5b7b8'
const LIGHT_GRAY = '#cfd3d7'
const WHITE = '#ffffff'

function paint(fill, border, label, kind, ring = false) {
  return { color: fill, fill, border, label, kind, ring }
}

export const STATUS_META = {
  upcoming: paint(LIGHT_GRAY, LIGHT_GRAY, '未到值班日', 'original'),
  normal: paint(DARK_GREEN, DARK_GREEN, '正常值班', 'original'),
  absent: paint(DARK_RED, DARK_RED, '未请假未值班', 'original'),
  makeup_upcoming: paint(WHITE, DARK_GREEN, '补班还未到', 'makeup'),
  leave_normal: paint(LIGHT_GREEN, DARK_GREEN, '请假后正常', 'makeup'),
  adjust_normal: paint(LIGHT_GREEN, DARK_GREEN, '调班后正常', 'makeup'),
  leave_absent: paint(LIGHT_RED, DARK_RED, '请假后未值班', 'makeup'),
  adjust_absent: paint(LIGHT_RED, DARK_RED, '调班后未值班', 'makeup')
}

export const FLAG_COLOR = '#f5c518'
export const FLAG_LABEL = {
  late: '迟到',
  early: '早退',
  no_checkout: '未签退'
}

export const CALENDAR_LEGEND = [
  { label: '未到值班日', colorCode: 'hollow', appendYellow: false },
  { label: '正常值班', colorCode: 'dark_green', appendYellow: false },
  { label: '正常但迟到/早退/未签退', colorCode: 'dark_green', appendYellow: true },
  { label: '未请假未值班', colorCode: 'dark_red', appendYellow: false }
]

export function visualFromColor(colorCode, appendYellow) {
  const yellow = appendYellow === true || appendYellow === 'true'
  if (colorCode === 'dark_green') {
    return paint(
      DARK_GREEN,
      yellow ? FLAG_COLOR : DARK_GREEN,
      yellow ? '正常但迟到/早退/未签退' : '正常值班',
      'original',
      yellow
    )
  }
  if (colorCode === 'dark_red') {
    return paint(DARK_RED, DARK_RED, '未请假未值班', 'original', false)
  }
  return paint(LIGHT_GRAY, LIGHT_GRAY, '未到值班日', 'original', false)
}

export function readDutyItems(body) {
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.data?.items)) return body.data.items
  if (Array.isArray(body?.items)) return body.items
  return null
}

export function resolveSlotVisual(slot = {}) {
  const source = slot.source
  const status = slot.status || 'upcoming'
  if (source === 'makeup') {
    if (status === 'upcoming' || status === 'makeup_upcoming') return STATUS_META.makeup_upcoming
    if (status === 'adjust_normal') return STATUS_META.adjust_normal
    if (status === 'adjust_absent') return STATUS_META.adjust_absent
    if (status === 'absent' || status === 'leave_absent') return STATUS_META.leave_absent
    return STATUS_META.leave_normal
  }
  return STATUS_META[status] || STATUS_META.upcoming
}

export function getStatusMeta(status, source) {
  return resolveSlotVisual({ status, source })
}

export function statusLabel(status, source) {
  return getStatusMeta(status, source).label
}

export function isCalendarVisible(slot) {
  if (!slot) return false
  if (slot.source === 'makeup-cancelled') return false
  if (slot.makeup_slot_id && slot.source !== 'makeup') return false
  return true
}

export function getDotStyle(meta, size) {
  const kind = meta?.kind || 'original'
  const ring = !!meta?.ring
  const borderWidth = ring || kind === 'makeup' ? Math.max(2, Math.round(size / 7)) : 0
  return {
    width: size + 'px',
    height: size + 'px',
    background: meta?.fill || meta?.color || LIGHT_GRAY,
    border: borderWidth ? `${borderWidth}px solid ${meta?.border || FLAG_COLOR}` : 'none',
    boxSizing: 'border-box'
  }
}
