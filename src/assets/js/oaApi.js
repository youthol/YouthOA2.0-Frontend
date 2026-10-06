import { http } from './http.js'
import * as mock from './mockDuty.js'

export const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

function real(path, payload, method = 'post') {
  if (method === 'get') {
    return http.get(path, { params: payload })
  }
  return http.post(path, payload || {})
}


export function listFrom(res) {
  const body = res?.data
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.items)) return body.items
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.data?.items)) return body.data.items
  if (Array.isArray(body?.list)) return body.list
  return []
}

export function objectFrom(res) {
  const body = res?.data
  if (body && typeof body === 'object' && !Array.isArray(body) && body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
    return body.data
  }
  return body && typeof body === 'object' ? body : {}
}


const LEAVE_ERROR_TEXT = {
  SEMESTER_NOT_CONFIGURED: '当前学期未配置',
  SDUT_ID_REQUIRED: '缺少学号',
  FORBIDDEN: '没有权限',
  MEMBER_NOT_FOUND: '成员不存在',
  SLOT_NOT_FOUND: '请选择原值班时间',
  LEAVE_TOO_LATE: '值班开始前半小时内不可申请请假',
  MAKEUP_REQUIRED: '请选择补班时间',
  REASON_REQUIRED: '请选择申请原因',
  REASON_DETAIL_REQUIRED: '请填写具体原因',
  MAKEUP_SAME_SLOT: '补班不能和原班同一天同一节',
  MAKEUP_PASSED: '不能补已经过去的班',
  MAKEUP_OCCUPIED: '该时间已有值班安排，请选择其他补班时间',
  INVALID_FRAME: '补班节次无效',
  INVALID_DATE: '请选择时间',
  INVALID_RANGE: '截止日期不能早于开始日期',
  INVALID_REASON: '申请原因无效'
}

function explainLeaveError(err) {
  const code = err?.response?.data?.error
  if (typeof code === 'string' && LEAVE_ERROR_TEXT[code]) {
    return Promise.reject(new Error(LEAVE_ERROR_TEXT[code]))
  }
  return Promise.reject(err)
}

export function pausedFrom(res) {
  const body = res?.data
  if (body && typeof body.paused === 'boolean') return body.paused
  if (body?.data && typeof body.data.paused === 'boolean') return body.data.paused
  return false
}

export function bindCurrentUser(user) {
  if (!useMock) return Promise.resolve({ data: { bound: false } })
  return mock.bindCurrentUser(user)
}

export function getSemesterCatalog() {
  return useMock ? mock.getSemesterCatalog() : real('/GetSemesterCatalog/', {})
}

export function setCurrentSemester(payload) {
  return useMock ? mock.setCurrentSemester(payload) : real('/SetCurrentSemester/', payload)
}

export function getSemesterDutyRange() {
  return useMock ? mock.getSemesterDutyRange() : real('/GetSemesterDutyRange/', {})
}

export function setSemesterDutyRange(payload) {
  return useMock ? mock.setSemesterDutyRange(payload) : real('/SetSemesterDutyRange/', payload)
}

export function getAllYoutholer() {
  return useMock ? mock.getAllYoutholer() : real('/GetAllYoutholer/', {})
}

export function addOneYoutholer(payload) {
  return useMock ? mock.addOneYoutholer(payload) : real('/AddOneYoutholer/', payload)
}

export function modifySingleYoutholInfo(payload) {
  return useMock ? mock.modifySingleYoutholInfo(payload) : real('/ModifySingleYoutholInfo/', payload)
}

export function deleteYoutholer(payload) {
  return useMock ? mock.deleteYoutholer(payload) : real('/DeletYoutholer/', payload)
}

export function initPassword(username) {
  return useMock ? mock.initPassword() : http.get('/initPassword/', { params: { username } })
}

export function getOldYoutholerCandidates(payload) {
  return useMock ? mock.getOldYoutholerCandidates(payload) : real('/GetOldYoutholerCandidates/', payload)
}

export function importOldYoutholers(payload) {
  return useMock ? mock.importOldYoutholers(payload) : real('/ImportOldYoutholers/', payload)
}

export function setMemberDutyOptions(payload) {
  return useMock ? mock.setMemberDutyOptions(payload) : real('/SetMemberDutyOptions/', payload)
}

export function getMemberSemesterDuty(payload) {
  return useMock ? mock.getMemberSemesterDuty(payload) : real('/GetMemberSemesterDuty/', payload)
}

export function getDaySemesterDuty(payload) {
  return useMock ? mock.getDaySemesterDuty(payload) : real('/GetDaySemesterDuty/', payload)
}

export function getSingleDutyCalendar(payload) {
  return useMock ? mock.getSingleDutyCalendar(payload) : real('/GetSingleDutyCalendar/', payload)
}

export function getDutyStatusInRange(payload) {
  return useMock ? mock.getDutyStatusInRange(payload) : real('/GetDutyStatusInRange/', payload)
}

export function getMemberUpcomingSlots(payload) {
  return useMock ? mock.getMemberUpcomingSlots(payload) : real('/GetMemberUpcomingSlots/', payload)
}

export function applyLeaveAdjust(payload) {
  return useMock ? mock.applyLeaveAdjust(payload) : real('/ApplyLeaveAdjust/', payload).catch(explainLeaveError)
}

export function getLeaveRecords(payload) {
  return useMock ? mock.getLeaveRecords(payload) : real('/GetLeaveRecords/', payload).catch(explainLeaveError)
}

export function getDutyPauseState() {
  return useMock ? mock.getDutyPauseState() : real('/GetDutyPauseState/', {})
}

export function setDutyPauseState(payload) {
  return useMock ? mock.setDutyPauseState(payload) : real('/SetDutyPauseState/', payload)
}

export { canApplyLeave, canApplyMakeup } from './leaveRule.js'

export function signIn(payload) {
  return useMock ? mock.signIn(payload) : real('/SignIn/', payload)
}

export function getYoutholerInfo() {
  return useMock ? mock.getYoutholerInfo() : real('/GetYoutholerInfo/', {})
}

export function checkDuty(payload) {
  return useMock ? mock.checkDuty(payload) : real('/CheckDuty/', payload)
}

export const ROOM_ID = '302'

export function getRoomBorrow() {
  return useMock ? mock.getRoomBorrow() : real('/GetRoomBorrow/', {})
}

function legacyBorrowIndex(isoDate) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const picked = new Date(`${isoDate}T00:00:00`)
  const offset = Math.round((picked.getTime() - today.getTime()) / 86400000)
  return 13 - offset
}

export function applyRoomBorrow(payload) {
  if (useMock) return mock.applyRoomBorrow(payload)
  return real('/ApplyRoomBorrow/', {
    ...payload,
    date: legacyBorrowIndex(payload?.borrow_date)
  })
}

export function getRoomBorrowRecordInRange(payload) {
  return useMock ? mock.getRoomBorrowRecordInRange(payload) : real('/GetRoomBorrowRecordInRange/', payload)
}

export function getSingleBorrowRecord(payload) {
  return useMock ? mock.getSingleBorrowRecord(payload) : real('/GetSingleBorrowRecord/', payload)
}

export function cancelRoomBorrow(payload) {
  return useMock ? mock.cancelRoomBorrow(payload) : real('/CancelRoomBorrow/', payload)
}

