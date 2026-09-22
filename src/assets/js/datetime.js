const WEEKDAY_NAMES = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

function toDate(input) {
  if (!input && input !== 0) return null
  if (input instanceof Date) {
    return Number.isNaN(input.getTime()) ? null : input
  }
  if (typeof input?.toDate === 'function') {
    const converted = input.toDate()
    if (converted instanceof Date) {
      return Number.isNaN(converted.getTime()) ? null : converted
    }
  }
  if (input?.$d instanceof Date) {
    return Number.isNaN(input.$d.getTime()) ? null : input.$d
  }
  if (typeof input === 'number') {
    const date = new Date(input)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (typeof input !== 'string' && typeof input !== 'number') {
    if (input?.year && input?.month && input?.date) {
      return new Date(input.year, input.month - 1, input.date)
    }
  }
  const text = String(input).trim()
  if (!text) return null
  const normalized = text.includes('T') ? text : text.replace(' ', 'T')
  const date = new Date(normalized)
  if (!Number.isNaN(date.getTime())) return date
  const match = text.match(
    /(\d{4})[-年/](\d{1,2})[-月/](\d{1,2})[日]?\s*(\d{1,2})?:?(\d{1,2})?/
  )
  if (!match) return null
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4] || 0),
    Number(match[5] || 0)
  )
}

function pad(value) {
  return String(value).padStart(2, '0')
}

export function toDateKey(input) {
  const date = toDate(input)
  if (!date) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function weekdayIndex(input) {
  const date = toDate(input)
  if (!date) return 0
  return ((date.getDay() + 6) % 7) + 1
}

export function weekdayName(input) {
  const date = toDate(input)
  if (!date) return ''
  return WEEKDAY_NAMES[date.getDay()]
}

export function formatDateTime(input) {
  const date = toDate(input)
  if (!date) return ''
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${pad(date.getHours())}:${pad(date.getMinutes())}（${WEEKDAY_NAMES[date.getDay()]}）`
}

export function formatDateWeek(input) {
  const date = toDate(input)
  if (!date) return ''
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAY_NAMES[date.getDay()]}）`
}

export function formatMonthDayWeek(input) {
  const date = toDate(input)
  if (!date) return ''
  return `${date.getMonth() + 1}月${date.getDate()}日，${WEEKDAY_NAMES[date.getDay()]}`
}

export function stripLeadingZeroTime(time) {
  if (!time) return ''
  const [hour, minute] = String(time).split(':')
  return `${Number(hour)}:${pad(minute || '00')}`
}

export function combineDateTime(dateKey, time) {
  if (!dateKey) return ''
  const clock = time || '00:00'
  return formatDateTime(`${dateKey} ${clock}`)
}

export function todayKey() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

export function eachDate(start, end) {
  const from = toDate(start)
  const to = toDate(end)
  if (!from || !to || from > to) return []
  const list = []
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate())
  const last = new Date(to.getFullYear(), to.getMonth(), to.getDate())
  while (cursor <= last) {
    list.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
  }
  return list
}
