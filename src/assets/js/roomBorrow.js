export const BORROW_ROOM_ID = '302'
export const BORROW_WINDOW_DAYS = 14

export function isEmptyValue(value) {
  return value == null || String(value).length === 0
}

export function toIsoDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function parseIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null
  }
  return date
}

export function isBorrowDateAllowed(value, today = new Date()) {
  const day = parseIsoDate(value)
  if (!day || !(today instanceof Date) || Number.isNaN(today.getTime())) return false
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const end = new Date(start)
  end.setDate(end.getDate() + BORROW_WINDOW_DAYS - 1)
  return day >= start && day <= end
}

export function rowIndexForBorrowDate(rows, isoDate) {
  if (!Array.isArray(rows) || isEmptyValue(isoDate)) return -1
  return rows.findIndex((row) => Array.isArray(row) && row[1] === isoDate)
}

export function hasBorrowRange(range) {
  return (
    Array.isArray(range) && range.length >= 2 && !isEmptyValue(range[0]) && !isEmptyValue(range[1])
  )
}
