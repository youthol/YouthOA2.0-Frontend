import { describe, expect, it } from 'vitest'
import {
  BORROW_ROOM_ID,
  hasBorrowRange,
  isBorrowDateAllowed,
  isEmptyValue,
  rowIndexForBorrowDate
} from './roomBorrow.js'

const today = new Date(2026, 8, 25)

describe('room borrow date contract', () => {
  it('keeps one room id', () => {
    expect(BORROW_ROOM_ID).toBe('302')
  })

  it('does not treat 0 as empty', () => {
    expect(isEmptyValue(0)).toBe(false)
    expect(isEmptyValue(null)).toBe(true)
    expect(isEmptyValue('')).toBe(true)
  })

  it('allows today, day 7 and day 14, rejects outside the window', () => {
    expect(isBorrowDateAllowed('2026-09-25', today)).toBe(true)
    expect(isBorrowDateAllowed('2026-10-01', today)).toBe(true)
    expect(isBorrowDateAllowed('2026-10-08', today)).toBe(true)
    expect(isBorrowDateAllowed('2026-09-24', today)).toBe(false)
    expect(isBorrowDateAllowed('2026-10-09', today)).toBe(false)
    expect(isBorrowDateAllowed('09-25', today)).toBe(false)
  })

  it('maps YYYY-MM-DD onto the farthest-first chart row', () => {
    const rows = [
      ['10月08日', '2026-10-08'],
      ['10月01日', '2026-10-01'],
      ['09月25日', '2026-09-25']
    ]
    expect(rowIndexForBorrowDate(rows, '2026-10-08')).toBe(0)
    expect(rowIndexForBorrowDate(rows, '2026-09-25')).toBe(2)
    expect(rowIndexForBorrowDate(rows, '2026-09-24')).toBe(-1)
    expect(rowIndexForBorrowDate(null, '2026-09-25')).toBe(-1)
  })

  it('requires a real range before querying records', () => {
    expect(hasBorrowRange(null)).toBe(false)
    expect(hasBorrowRange('')).toBe(false)
    expect(hasBorrowRange(['2026-09-25'])).toBe(false)
    expect(hasBorrowRange(['2026-09-25', '2026-10-08'])).toBe(true)
  })
})
