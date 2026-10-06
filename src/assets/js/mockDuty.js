import { eachDate, toDateKey, todayKey, weekdayIndex } from './datetime.js'
import { getFrameTime } from './dutyFrame.js'
import { canApplyLeave, canApplyMakeup } from './leaveRule.js'

const STORAGE_KEY = 'YoutholMockDutyState'
const ROOM_ID = '302'
function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function ok(data) {
  return Promise.resolve({ data })
}

function fail(message) {
  return Promise.reject(new Error(message))
}

function seedMembers() {
  return [
    {
      sdut_id: '23110301001',
      name: '张三',
      college: '计算机科学与技术学院',
      grade: '软件2301',
      department: '程序部',
      identity: '正式',
      duty: [
        { day: 1, frame: 1 },
        { day: 3, frame: 3 }
      ]
    },
    {
      sdut_id: '23110301002',
      name: '李四',
      college: '计算机科学与技术学院',
      grade: '计科2302',
      department: '媒体中心',
      identity: '正式',
      duty: [
        { day: 2, frame: 2 },
        { day: 4, frame: 4 }
      ]
    },
    {
      sdut_id: '23110301003',
      name: '王五',
      college: '文学与新闻传播学院',
      grade: '广电2301',
      department: '摄影部',
      identity: '试用',
      duty: [{ day: 5, frame: 5 }]
    },
    {
      sdut_id: '23110301004',
      name: '赵六',
      college: '管理学院',
      grade: '工商2303',
      department: '综合部',
      identity: '正式',
      duty: [
        { day: 1, frame: 2 },
        { day: 6, frame: 1 }
      ]
    },
    {
      sdut_id: '22110301999',
      name: '管理员',
      college: '计算机科学与技术学院',
      grade: '管理组',
      department: '管理组',
      identity: '管理员',
      duty: [{ day: 3, frame: 1 }]
    }
  ]
}

function seedAlumni() {
  return [
    {
      sdut_id: '22110301011',
      name: '周八',
      college: '计算机科学与技术学院',
      grade: '软件2201',
      department: '程序部',
      identity: '正式',
      duty: [
        { day: 2, frame: 1 },
        { day: 4, frame: 3 }
      ]
    },
    {
      sdut_id: '22110301012',
      name: '吴九',
      college: '艺术学院',
      grade: '视传2202',
      department: '美工部',
      identity: '正式',
      duty: [{ day: 3, frame: 2 }]
    },
    {
      sdut_id: '22110301013',
      name: '郑十',
      college: '文学与新闻传播学院',
      grade: '新闻2201',
      department: '视频编辑部',
      identity: '试用',
      duty: [{ day: 5, frame: 4 }]
    }
  ]
}

function seedSemesterCatalog() {
  return [
    {
      id: '2025-2026-1',
      academic_year: '2025-2026',
      term: 1,
      label: '2025-2026学年第一学期',
      default_start: '2025-09-01',
      default_end: '2026-01-16',
      semester_start: '',
      duty_end: '',
      is_current: false
    },
    {
      id: '2025-2026-2',
      academic_year: '2025-2026',
      term: 2,
      label: '2025-2026学年第二学期',
      default_start: '2026-02-24',
      default_end: '2026-07-10',
      semester_start: '',
      duty_end: '',
      is_current: false
    },
    {
      id: '2026-2027-1',
      academic_year: '2026-2027',
      term: 1,
      label: '2026-2027学年第一学期',
      default_start: '2026-09-01',
      default_end: '2027-01-15',
      semester_start: '2026-09-01',
      duty_end: '2027-01-15',
      is_current: true
    },
    {
      id: '2026-2027-2',
      academic_year: '2026-2027',
      term: 2,
      label: '2026-2027学年第二学期',
      default_start: '2027-03-01',
      default_end: '2027-07-09',
      semester_start: '',
      duty_end: '',
      is_current: false
    }
  ]
}

function currentRangeFromCatalog(catalog) {
  const current = (catalog || []).find((item) => item.is_current) || (catalog || [])[0]
  if (!current) {
    return { semester_id: '', start_date: '', end_date: '' }
  }
  return {
    semester_id: current.id,
    start_date: current.semester_start || current.default_start || '',
    end_date: current.duty_end || current.default_end || ''
  }
}

function migrateState(parsed) {
  if (!Array.isArray(parsed.semesterCatalog) || !parsed.semesterCatalog.length) {
    const catalog = seedSemesterCatalog()
    const oldStart = parsed.semester?.start_date
    const oldEnd = parsed.semester?.end_date
    catalog.forEach((item) => {
      if (item.is_current) {
        item.semester_start = oldStart || item.default_start
        item.duty_end = oldEnd || item.default_end
      }
    })
    parsed.semesterCatalog = catalog
  }
  parsed.semester = currentRangeFromCatalog(parsed.semesterCatalog)
  if (!Array.isArray(parsed.borrows)) parsed.borrows = seedRoomBorrows()
  return parsed
}

function emptyState() {
  const semesterCatalog = seedSemesterCatalog()
  return {
    semesterCatalog,
    semester: currentRangeFromCatalog(semesterCatalog),
    paused: false,
    members: seedMembers(),
    alumni: seedAlumni(),
    slots: [],
    leaves: [],
    borrows: seedRoomBorrows(),
    seq: 1
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && (parsed.semester || parsed.semesterCatalog) && Array.isArray(parsed.members)) {
        return migrateState(parsed)
      }
    }
  } catch (error) {
    console.log(error)
  }
  return emptyState()
}

let state = loadState()

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function nextId(prefix) {
  state.seq += 1
  return `${prefix}-${state.seq}`
}

function normalizeDuty(duty) {
  const list = Array.isArray(duty) ? duty.slice(0, 2) : []
  while (list.length < 2) list.push({ day: 0, frame: 0 })
  return list.map((item) => ({
    day: Number(item.day || 0),
    frame: Number(item.frame || 0)
  }))
}

function findMember(sdut_id) {
  return state.members.find((item) => item.sdut_id == sdut_id)
}

function slotKey(sdut_id, date, frame) {
  return `${sdut_id}|${date}|${frame}`
}

function decorateStatus(slot) {
  const today = todayKey()
  if (slot.makeup_slot_id && slot.source !== 'makeup') {
    return slot
  }
  if (slot.date > today) {
    slot.status = 'upcoming'
    slot.flags = []
    return slot
  }
  if (slot.status && slot.status !== 'upcoming') return slot
  const seed = Number(String(slot.sdut_id).slice(-2)) + Number(slot.date.replace(/-/g, ''))
  if (slot.source === 'makeup') {
    const mode = seed % 4
    if (mode === 0) {
      slot.status = 'leave_absent'
      slot.flags = []
    } else if (mode === 1) {
      slot.status = 'leave_normal'
      slot.flags = ['late']
    } else if (mode === 2) {
      slot.status = 'adjust_normal'
      slot.flags = []
    } else {
      slot.status = 'leave_normal'
      slot.flags = []
    }
    return slot
  }
  const mode = seed % 5
  if (mode === 0) {
    slot.status = 'absent'
    slot.flags = []
  } else if (mode === 1) {
    slot.status = 'normal'
    slot.flags = ['late']
  } else if (mode === 2) {
    slot.status = 'normal'
    slot.flags = ['early']
  } else if (mode === 3) {
    slot.status = 'normal'
    slot.flags = slot.date === today ? ['no_checkout'] : []
  } else {
    slot.status = 'normal'
    slot.flags = []
  }
  return slot
}

function buildSlot(member, date, frame) {
  const time = getFrameTime(frame)
  return decorateStatus({
    id: nextId('slot'),
    sdut_id: member.sdut_id,
    name: member.name,
    department: member.department,
    identity: member.identity,
    date,
    weekday: weekdayIndex(date),
    frame: Number(frame),
    start_time: time.start,
    end_time: time.end,
    status: 'upcoming',
    flags: [],
    source: 'schedule'
  })
}

function generateForMember(member, dutyList) {
  const start = state.semester.start_date
  const end = state.semester.end_date
  if (!start || !end) return 0
  const existing = new Map()
  state.slots
    .filter((slot) => slot.sdut_id == member.sdut_id)
    .forEach((slot) => existing.set(slotKey(slot.sdut_id, slot.date, slot.frame), slot))

  let created = 0
  const options = normalizeDuty(dutyList).filter((item) => item.day && item.frame)
  eachDate(start, end).forEach((date) => {
    const weekday = weekdayIndex(date)
    options.forEach((option) => {
      if (option.day !== weekday) return
      const key = slotKey(member.sdut_id, date, option.frame)
      if (existing.has(key)) return
      const slot = buildSlot(member, date, option.frame)
      state.slots.push(slot)
      existing.set(key, slot)
      created += 1
    })
  })
  return created
}

function ensureGenerated() {
  if (state.slots.length) return
  state.members.forEach((member) => generateForMember(member, member.duty))
  save()
}

ensureGenerated()

function publicMember(member) {
  return {
    ...member,
    unique_id: `${member.sdut_id}${member.department}`,
    duty: normalizeDuty(member.duty)
  }
}

export function getSemesterCatalog() {
  return ok({
    list: clone(state.semesterCatalog),
    current: clone(state.semesterCatalog.find((item) => item.is_current) || null)
  })
}

export function setCurrentSemester(payload) {
  const id = payload?.semester_id
  const item = state.semesterCatalog.find((row) => row.id === id)
  if (!item) return fail('请选择学年学期')
  state.semesterCatalog.forEach((row) => {
    row.is_current = row.id === id
  })
  if (!item.semester_start) item.semester_start = item.default_start
  if (!item.duty_end) item.duty_end = item.default_end
  state.semester = currentRangeFromCatalog(state.semesterCatalog)
  save()
  return ok(clone(item))
}

export function getSemesterDutyRange() {
  state.semester = currentRangeFromCatalog(state.semesterCatalog)
  return ok(clone(state.semester))
}

export function setSemesterDutyRange(payload) {
  const id = payload?.semester_id || state.semester?.semester_id
  const start = payload?.start_date || payload?.semester_start
  const end = payload?.end_date || payload?.duty_end
  if (!id) return fail('请选择学年学期')
  if (!start || !end) {
    return fail('请选择学期开始日期和值班截止日')
  }
  if (start > end) {
    return fail('截止日期不能早于开始日期')
  }
  const item = state.semesterCatalog.find((row) => row.id === id)
  if (!item) return fail('学期不存在')
  const overlap = state.semesterCatalog.some((other) => {
    if (other.id === id) return false
    if (!other.semester_start || !other.duty_end) return false
    return other.semester_start <= end && start <= other.duty_end
  })
  if (overlap) return fail('该日期区间与其他学期重叠')
  item.semester_start = start
  item.duty_end = end
  state.semesterCatalog.forEach((row) => {
    row.is_current = row.id === id
  })
  state.semester = currentRangeFromCatalog(state.semesterCatalog)
  let created = 0
  state.members.forEach((member) => {
    created += generateForMember(member, member.duty)
  })
  save()
  return ok({ ...clone(item), created })
}

export function getAllYoutholer() {
  return ok(state.members.map(publicMember))
}

export function addOneYoutholer(payload) {
  if (!payload?.sdut_id || !payload?.name) return fail('请完善成员信息')
  if (findMember(payload.sdut_id)) return fail('该学号已存在')
  const member = {
    sdut_id: String(payload.sdut_id),
    name: payload.name,
    college: payload.college || '',
    grade: payload.grade || '',
    department: payload.department,
    identity: payload.identity,
    duty: normalizeDuty(payload.duty)
  }
  state.members.push(member)
  const created = generateForMember(member, member.duty)
  save()
  return ok({ message: '添加成功', created })
}

export function modifySingleYoutholInfo(payload) {
  const member = findMember(payload.sdut_id)
  if (!member) return fail('成员不存在')
  member.name = payload.name
  member.department = payload.department
  member.identity = payload.identity
  member.duty = normalizeDuty(payload.duty)
  const created = generateForMember(member, member.duty)
  save()
  return ok({ message: '修改成功', created })
}

export function deleteYoutholer(payload) {
  const index = state.members.findIndex((item) => item.sdut_id == payload.sdut_id)
  if (index < 0) return fail('成员不存在')
  state.members.splice(index, 1)
  save()
  return ok({ message: '删除成功' })
}

export function initPassword() {
  return ok({ message: '密码已经被重置为youthol' })
}

export function getOldYoutholerCandidates(payload = {}) {
  const keyword = (payload.name || '').trim()
  const list = state.alumni.filter((item) => {
    if (keyword && !item.name.includes(keyword)) return false
    if (payload.department && item.department !== payload.department) return false
    if (payload.identity && item.identity !== payload.identity) return false
    return true
  })
  return ok(clone(list))
}

export function importOldYoutholers(payload) {
  const ids = payload?.sdut_ids || []
  const result = { success: [], skipped: [], failed: [] }
  ids.forEach((id) => {
    const source = state.alumni.find((item) => item.sdut_id == id)
    if (!source) {
      result.failed.push({ sdut_id: id, reason: '候选不存在' })
      return
    }
    if (findMember(id)) {
      result.skipped.push({ sdut_id: id, name: source.name, reason: '已在本学期名单中' })
      return
    }
    const member = { ...clone(source), duty: normalizeDuty(source.duty) }
    state.members.push(member)
    generateForMember(member, member.duty)
    result.success.push({ sdut_id: member.sdut_id, name: member.name })
  })
  save()
  return ok(result)
}

export function setMemberDutyOptions(payload) {
  if (!state.semester.start_date || !state.semester.end_date) {
    return fail('请先选择学期开始日期和值班截止日')
  }
  const member = findMember(payload.sdut_id)
  if (!member) return fail('成员不存在')
  const duty = normalizeDuty(payload.duty)
  if (!duty.some((item) => item.day && item.frame)) {
    return fail('请至少配置一个值班时段')
  }
  if (duty.some((item) => Boolean(Number(item.day)) !== Boolean(Number(item.frame)))) {
    return fail('请完善值班信息')
  }
  member.duty = duty
  const created = generateForMember(member, duty)
  save()
  return ok({ created, total: state.slots.filter((slot) => slot.sdut_id == member.sdut_id).length })
}

export function getMemberSemesterDuty(payload) {
  const keyword = (payload?.keyword || payload?.name || payload?.sdut_id || '').trim()
  if (!keyword) return fail('请输入成员姓名或学号')
  const list = state.slots
    .filter((slot) => slot.name.includes(keyword) || String(slot.sdut_id).includes(keyword))
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
  return ok(clone(list))
}

export function getDaySemesterDuty(payload) {
  if (!payload?.date) return fail('请选择日期')
  const list = state.slots
    .filter((slot) => slot.date === payload.date)
    .sort((a, b) => a.start_time.localeCompare(b.start_time) || a.name.localeCompare(b.name))
  return ok(clone(list))
}

export function getSingleDutyCalendar(payload) {
  const sdut_id = payload?.sdut_id
  const list = state.slots
    .filter((slot) => String(slot.sdut_id) === String(sdut_id))
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
  return ok(clone(list))
}

function dateOnly(value) {
  return String(value || '').slice(0, 10)
}

function refreshSlotStatus() {
  let changed = false
  state.slots.forEach((slot) => {
    const before = `${slot.status}|${JSON.stringify(slot.flags || [])}`
    decorateStatus(slot)
    const after = `${slot.status}|${JSON.stringify(slot.flags || [])}`
    if (before !== after) changed = true
  })
  if (changed) save()
}

export function getDutyStatusInRange(payload) {
  const start = dateOnly(payload?.start_time || payload?.start_date)
  const end = dateOnly(payload?.end_time || payload?.end_date)
  if (!start || !end) return fail('请选择时间')
  refreshSlotStatus()
  const list = state.slots
    .filter((slot) => slot.date >= start && slot.date <= end && slot.source !== 'makeup-cancelled')
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
  return ok(clone(list))
}

export function getMemberUpcomingSlots(payload) {
  const today = todayKey()
  const list = state.slots
    .filter((slot) => slot.sdut_id == payload.sdut_id && slot.date >= today && slot.source !== 'makeup-cancelled')
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
  return ok(clone(list))
}

export function applyLeaveAdjust(payload) {
  const member = findMember(payload.sdut_id)
  if (!member) return fail('成员不存在')
  const original = state.slots.find((slot) => slot.id === payload.original_slot_id)
  if (!original) return fail('请选择原值班时间')
  const check = canApplyLeave(original)
  if (!check.ok) return fail(check.reason)
  if (!payload.makeup_date || !payload.makeup_frame) return fail('请选择补班时间')
  if (!payload.reason) return fail('请选择申请原因')
  if (payload.reason === '其他' && !String(payload.reason_detail || '').trim()) {
    return fail('请填写具体原因')
  }
  const makeupCheck = canApplyMakeup({
    makeup_date: payload.makeup_date,
    makeup_frame: payload.makeup_frame,
    original_date: original.date,
    original_frame: original.frame
  })
  if (!makeupCheck.ok) return fail(makeupCheck.reason)
  const occupied = state.slots.some(
    (slot) =>
      String(slot.sdut_id) === String(member.sdut_id) &&
      slot.date === payload.makeup_date &&
      String(slot.frame) === String(payload.makeup_frame) &&
      slot.source !== 'makeup-cancelled'
  )
  if (occupied) return fail('该时间已有值班安排，请选择其他补班时间')

  const time = getFrameTime(payload.makeup_frame)
  const makeup = buildSlot(member, payload.makeup_date, payload.makeup_frame)
  makeup.source = 'makeup'
  makeup.status = 'upcoming'
  makeup.flags = []
  makeup.start_time = time.start
  makeup.end_time = time.end
  state.slots.push(makeup)

  original.status = 'leave_absent'
  original.flags = []
  original.makeup_slot_id = makeup.id

  const record = {
    id: nextId('leave'),
    sdut_id: member.sdut_id,
    name: member.name,
    department: member.department,
    reason: payload.reason,
    reason_detail: payload.reason === '其他' ? String(payload.reason_detail).trim() : '',
    original_slot_id: original.id,
    makeup_slot_id: makeup.id,
    original: clone(original),
    makeup: clone(makeup),
    has_makeup: true,
    apply_time: new Date().toISOString()
  }
  state.leaves.unshift(record)
  save()
  return ok({ message: '申请已通过', record })
}

export function getLeaveRecords(payload = {}) {
  const start = payload.start_time || payload.start_date
  const end = payload.end_time || payload.end_date
  let list = state.leaves.slice()
  if (start && end) {
    list = list.filter((item) => {
      const day = toDateKey(item.apply_time) || item.original?.date
      return day >= start && day <= end
    })
  }
  return ok(clone(list))
}

export function getDutyPauseState() {
  return ok({ paused: !!state.paused })
}

export function setDutyPauseState(payload) {
  state.paused = !!payload?.paused
  save()
  return ok({ paused: state.paused })
}


function pad2(value) {
  return String(value).padStart(2, '0')
}

function dateFromOffset(offset) {
  const day = new Date()
  day.setHours(12, 0, 0, 0)
  day.setDate(day.getDate() + offset)
  return day
}

function isoDate(day) {
  return `${day.getFullYear()}-${pad2(day.getMonth() + 1)}-${pad2(day.getDate())}`
}

function clockToMinutes(value) {
  const [hour, minute] = String(value || '').split(':').map((item) => Number(item))
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour * 60 + minute
}

function currentMember() {
  const token = ''
  const sdutId = token.startsWith('mock:') ? token.slice(5) : ''
  return findMember(sdutId)
}

function seedRoomBorrows() {
  return [
    {
      id: 'room-seed-1',
      room_id: ROOM_ID,
      sdut_id: '22110301999',
      name: '管理员',
      department: '管理组',
      people: '管理组',
      borrow_date: isoDate(dateFromOffset(0)),
      start_time: '10:00',
      end_time: '11:30',
      apply_time: `${isoDate(dateFromOffset(-1))} 09:00`,
      cancel_time: ' ',
      cancelled: false
    },
    {
      id: 'room-seed-2',
      room_id: ROOM_ID,
      sdut_id: '23110301001',
      name: '张三',
      department: '程序部',
      people: '程序部',
      borrow_date: isoDate(dateFromOffset(2)),
      start_time: '14:00',
      end_time: '16:00',
      apply_time: `${isoDate(dateFromOffset(-1))} 15:20`,
      cancel_time: ' ',
      cancelled: false
    }
  ]
}

function recentRoomRows() {
  const rows = []
  for (let index = 0; index < 14; index += 1) {
    const day = dateFromOffset(13 - index)
    rows.push({
      index,
      label: `${pad2(day.getMonth() + 1)}月${pad2(day.getDate())}日`,
      iso: isoDate(day)
    })
  }
  return rows
}

function ensureBorrows() {
  if (!Array.isArray(state.borrows)) state.borrows = []
}

export function getRoomBorrow() {
  ensureBorrows()
  const rows = recentRoomRows()
  const indexByDate = new Map(rows.map((row) => [row.iso, row.index]))
  const borrowTime = state.borrows
    .filter((item) => !item.cancelled && indexByDate.has(item.borrow_date))
    .map((item) => [
      indexByDate.get(item.borrow_date),
      `2023/07/08 ${item.start_time}`,
      `2023/07/08 ${item.end_time}`,
      item.people || item.department || item.name || '',
      item.start_time,
      item.end_time
    ])
  return ok({
    recent14Day: {
      dimensions: ['日期'],
      data: rows.map((row) => [row.label, row.iso])
    },
    borrowTime: {
      dimensions: ['借用日期', '开始时间', '结束时间', '借用人', '开始时间', '结束时间'],
      data: borrowTime
    }
  })
}

export function applyRoomBorrow(payload = {}) {
  ensureBorrows()
  const borrowDate = payload.borrow_date
  const start = payload.start_time
  const end = payload.end_time
  const roomId = payload.room_id || ROOM_ID
  if (!borrowDate || !start || !end) return fail('请完善信息')
  const todayKey = isoDate(new Date())
  if (borrowDate < todayKey) return fail('不能选择已经过去的日期')
  const startMinutes = clockToMinutes(start)
  const endMinutes = clockToMinutes(end)
  if (startMinutes == null || endMinutes == null || startMinutes >= endMinutes) {
    return fail('结束时间必须晚于开始时间')
  }
  const conflict = state.borrows.some((item) => {
    if (item.cancelled || item.room_id !== roomId || item.borrow_date !== borrowDate) return false
    const itemStart = clockToMinutes(item.start_time)
    const itemEnd = clockToMinutes(item.end_time)
    return itemStart < endMinutes && startMinutes < itemEnd
  })
  if (conflict) return ok('busy')
  const member = currentMember()
  const now = new Date()
  state.borrows.push({
    id: nextId('room'),
    room_id: roomId,
    sdut_id: member?.sdut_id || '',
    name: member?.name || '',
    department: member?.department || payload.people || '',
    people: payload.people || member?.department || member?.name || '',
    borrow_date: borrowDate,
    start_time: start,
    end_time: end,
    apply_time: `${isoDate(now)} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`,
    cancel_time: ' ',
    cancelled: false
  })
  save()
  return ok('success')
}

export function getRoomBorrowRecordInRange(payload = {}) {
  ensureBorrows()
  const start = dateOnly(payload.start_time)
  const end = dateOnly(payload.end_time)
  const roomId = String(payload.room_id || '').trim()
  if (!start || !end) return fail('请选择时间')
  const list = state.borrows
    .filter((item) => {
      if (item.cancelled || item.borrow_date < start || item.borrow_date > end) return false
      return !roomId || item.room_id === roomId
    })
    .map((item) => ({
      sdut_id: item.sdut_id,
      room_id: item.room_id,
      name: item.name,
      department: item.department,
      apply_time: item.apply_time,
      borrow_date: item.borrow_date,
      start_time: item.start_time,
      end_time: item.end_time
    }))
  return ok(clone(list))
}

export function getSingleBorrowRecord(payload = {}) {
  ensureBorrows()
  const member = currentMember()
  if (!member) return fail('未登录')
  const roomId = payload.room_id || ROOM_ID
  const list = state.borrows
    .filter((item) => item.room_id === roomId && String(item.sdut_id) === String(member.sdut_id))
    .map((item) => ({
      id: item.id,
      room_id: item.room_id,
      apply_time: item.apply_time,
      borrow_date: item.borrow_date,
      start_time: item.start_time,
      end_time: item.end_time,
      cancel_time: item.cancel_time || ' '
    }))
  return ok(clone(list))
}

export function cancelRoomBorrow(payload = {}) {
  ensureBorrows()
  const item = state.borrows.find((borrow) => borrow.id === payload.id)
  if (!item || item.cancelled) return ok('fail')
  const now = new Date()
  item.cancelled = true
  item.cancel_time = `${isoDate(now)} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`
  save()
  return ok('success')
}

const MOCK_PASSWORD = 'youthol'

export function signIn(payload) {
  const username = String(payload?.username || '').trim()
  const password = payload?.password || ''
  const member = findMember(username)
  if (!member || password !== MOCK_PASSWORD) {
    return ok({ SignState: '账号或密码错误' })
  }
  return ok({
    SignState: '登录成功',
    access_token: `mock:${member.sdut_id}`
  })
}

export function getYoutholerInfo() {
  const token = ''
  const sdutId = token.startsWith('mock:') ? token.slice(5) : ''
  const member = findMember(sdutId)
  if (!member) return fail('未登录')
  return ok({
    sdut_id: member.sdut_id,
    name: member.name,
    department: member.department,
    identity: member.identity,
    position: ''
  })
}

export function checkDuty() {
  return ok({ duty_state: '未值班' })
}

export function bindCurrentUser(user) {
  if (!user?.sdut_id || user.sdut_id === 'no id') return ok({ bound: false })
  let member = findMember(user.sdut_id)
  if (!member) {
    member = {
      sdut_id: String(user.sdut_id),
      name: user.name || '当前用户',
      college: user.college || '',
      grade: user.grade || '',
      department: user.department || '程序部',
      identity: user.identity || '正式',
      duty: [
        { day: 1, frame: 1 },
        { day: 3, frame: 3 }
      ]
    }
    state.members.push(member)
    generateForMember(member, member.duty)
    save()
  } else {
    member.name = user.name || member.name
    member.department = user.department || member.department
    member.identity = user.identity || member.identity
    save()
  }
  return ok({ bound: true, member: publicMember(member) })
}
