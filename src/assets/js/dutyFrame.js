export const FRAME_TIMES = {
  1: { label: '第1-2节', start: '08:00', end: '09:40' },
  2: { label: '第3-4节', start: '10:00', end: '11:40' },
  3: { label: '第5-6节', start: '14:00', end: '15:40' },
  4: { label: '第7-8节', start: '16:00', end: '17:40' },
  5: { label: '第9-10节', start: '19:00', end: '20:40' }
}

export const WEEKDAY_LABEL = {
  1: '星期一',
  2: '星期二',
  3: '星期三',
  4: '星期四',
  5: '星期五',
  6: '星期六',
  7: '星期日'
}

export const WEEKDAY_SHORT = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
  5: '五',
  6: '六',
  7: '日'
}

export function getFrameTime(frame) {
  return FRAME_TIMES[Number(frame)] || null
}

export function frameLabelWithTime(frame) {
  const item = getFrameTime(frame)
  if (!item) return '未安排'
  return `${item.label}（${item.start}-${item.end}）`
}

export function formatDutyOption(duty) {
  if (!duty || !Number(duty.day) || !Number(duty.frame)) return ''
  const frame = getFrameTime(duty.frame)
  return `${WEEKDAY_LABEL[Number(duty.day)]} ${frame.label} ${frame.start}-${frame.end}`
}

export function formatScheduleLine(slot) {
  if (!slot) return ''
  const date = new Date(`${slot.date}T00:00:00`)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekday = WEEKDAY_LABEL[slot.weekday] || WEEKDAY_LABEL[(((date.getDay() + 6) % 7) + 1)]
  const start = String(slot.start_time || '').replace(/^0/, '') || slot.start_time
  return `${month}月${day}日，${weekday}，${start}-${slot.end_time}值班`
}

export const dutyFrameSelectOption = [
  { label: '未安排', value: '0' },
  { label: frameLabelWithTime(1), value: '1' },
  { label: frameLabelWithTime(2), value: '2' },
  { label: frameLabelWithTime(3), value: '3' },
  { label: frameLabelWithTime(4), value: '4' },
  { label: frameLabelWithTime(5), value: '5' }
]
