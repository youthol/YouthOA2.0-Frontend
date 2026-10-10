import { getFrameTime } from './dutyFrame.js'

const MIN_LEAD_MS = 15 * 60 * 1000
const BEIJING_TZ = 'Asia/Shanghai'

export function beijingTodayKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: BEIJING_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(now)
}

export function beijingDateKey(input) {
  if (!input) return ''
  if (typeof input === 'string' && /^\d{4}-\d{2}-\d{2}/.test(input)) {
    return input.slice(0, 10)
  }
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return ''
  return beijingTodayKey(date)
}

export function frameStartMs(dateKey, frame) {
  const time = getFrameTime(frame)
  if (!dateKey || !time) return NaN
  const start = time.start || '00:00'
  return new Date(`${dateKey}T${start}:00+08:00`).getTime()
}

export function isMakeupStartPassed(dateKey, frame, now = Date.now()) {
  const start = frameStartMs(dateKey, frame)
  if (Number.isNaN(start)) return true
  return start <= now
}

export function canApplyLeave(slot) {
  if (!slot) return { ok: false, reason: '请选择原值班时间' }
  if (!slot.date || !slot.start_time) return { ok: false, reason: '原值班时间无效' }
  const start = new Date(`${slot.date}T${slot.start_time}:00+08:00`).getTime()
  if (Number.isNaN(start)) return { ok: false, reason: '原值班时间无效' }
  if (Date.now() > start - MIN_LEAD_MS) {
    return { ok: false, reason: '距离值班开始不足15分钟，不能申请' }
  }
  return { ok: true }
}

export function canApplyMakeup({ makeup_date, makeup_frame, original_date, original_frame }, now = Date.now()) {
  if (!makeup_date || !makeup_frame) return { ok: false, reason: '请选择补班时间' }
  if (makeup_date === original_date && String(makeup_frame) === String(original_frame)) {
    return { ok: false, reason: '补班不能和原班同一天同一节' }
  }
  if (isMakeupStartPassed(makeup_date, makeup_frame, now)) {
    return { ok: false, reason: '不能补已经过去的班' }
  }
  return { ok: true }
}

export function canCancelLeave(record, now = Date.now()) {
  const original = record?.original
  if (!original?.date || !original?.start_time) return { ok: false, reason: '原值班时间无效' }
  const start = new Date(`${original.date}T${original.start_time}:00+08:00`).getTime()
  if (Number.isNaN(start)) return { ok: false, reason: '原值班时间无效' }
  if (now > start - MIN_LEAD_MS) {
    return { ok: false, reason: '离原值班开始不到15分钟，不能撤销' }
  }
  const makeup = record?.makeup
  if (makeup?.date && makeup?.start_time) {
    const makeupStart = new Date(`${makeup.date}T${makeup.start_time}:00+08:00`).getTime()
    if (!Number.isNaN(makeupStart) && now >= makeupStart) {
      return { ok: false, reason: '补班已经开始，不能撤销' }
    }
    if (!Number.isNaN(makeupStart) && now > makeupStart - MIN_LEAD_MS) {
      return { ok: false, reason: '离补班开始不到15分钟，不能撤销' }
    }
  }
  return { ok: true }
}
