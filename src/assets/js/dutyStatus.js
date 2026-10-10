const DARK_GREEN = '#0b6e4f'
const LIGHT_GREEN = '#8fd4a8'
const DARK_RED = '#d32f2f'
const LIGHT_RED = '#f5b7b8'
const LIGHT_GRAY = '#cfd3d7'
const WHITE = '#ffffff'

function paint(fill, border, label, kind) {
  return { color: fill, fill, border, label, kind }
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
  { label: '未到值班日', status: 'upcoming', source: 'schedule', flags: [] },
  { label: '正常值班', status: 'normal', source: 'schedule', flags: [] },
  { label: '正常但迟到/早退/未签退', status: 'normal', source: 'schedule', flags: ['late'] },
  { label: '未请假未值班', status: 'absent', source: 'schedule', flags: [] },
  { label: '补班还未到', status: 'upcoming', source: 'makeup', flags: [] },
  { label: '请假后正常 / 调班后正常', status: 'leave_normal', source: 'makeup', flags: [] },
  { label: '补班来了但不规范', status: 'leave_normal', source: 'makeup', flags: ['late'] },
  { label: '请假后未值班 / 调班后未值班', status: 'leave_absent', source: 'makeup', flags: [] }
]

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
  const borderWidth = kind === 'makeup' ? Math.max(2, Math.round(size / 7)) : 0
  return {
    width: size + 'px',
    height: size + 'px',
    background: meta?.fill || meta?.color || LIGHT_GRAY,
    border: borderWidth ? `${borderWidth}px solid ${meta.border}` : 'none',
    boxSizing: 'border-box'
  }
}

const MISSED_STATUS = new Set(['absent', 'leave_absent', 'adjust_absent'])
const DONE_STATUS = new Set(['normal', 'leave_normal', 'adjust_normal'])
const PENDING_STATUS = new Set(['upcoming', 'makeup_upcoming'])
const IRREGULAR_FLAGS = new Set(['late', 'early', 'no_checkout'])

export const DUTY_STATUS_GROUP_LABEL = {
  done: '值班',
  missed: '未值班',
  irregular: '不规范',
  pending: '未到值班日'
}

function resolvedStatus(slot = {}) {
  const status = slot.status || 'upcoming'
  if (slot.source !== 'makeup') return status
  if (status === 'upcoming' || status === 'makeup_upcoming') return 'makeup_upcoming'
  if (status === 'adjust_normal') return 'adjust_normal'
  if (status === 'adjust_absent') return 'adjust_absent'
  if (status === 'absent' || status === 'leave_absent') return 'leave_absent'
  return 'leave_normal'
}

export function dutyStatusGroup(slot = {}) {
  const status = resolvedStatus(slot)
  if (MISSED_STATUS.has(status)) return 'missed'
  const flags = Array.isArray(slot.flags) ? slot.flags : []
  if (flags.some((flag) => IRREGULAR_FLAGS.has(flag))) return 'irregular'
  if (DONE_STATUS.has(status)) return 'done'
  if (PENDING_STATUS.has(status)) return 'pending'
  return 'pending'
}

export function dutyStatusGroupText(slot = {}) {
  const group = dutyStatusGroup(slot)
  if (group !== 'irregular') return DUTY_STATUS_GROUP_LABEL[group]
  const names = (Array.isArray(slot.flags) ? slot.flags : [])
    .filter((flag) => IRREGULAR_FLAGS.has(flag))
    .map((flag) => FLAG_LABEL[flag] || flag)
  return names.length ? `不规范（${names.join('、')}）` : '不规范'
}
