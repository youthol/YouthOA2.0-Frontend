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
  LEAVE_TOO_LATE: '距离值班开始不足15分钟，不能申请',
  MAKEUP_REQUIRED: '请选择补班时间',
  REASON_REQUIRED: '请选择申请原因',
  REASON_DETAIL_REQUIRED: '请填写具体原因',
  MAKEUP_SAME_SLOT: '补班不能和原班同一天同一节',
  MAKEUP_PASSED: '不能补已经过去的班',
  MAKEUP_OCCUPIED: '该时间已有值班安排，请选择其他补班时间',
  INVALID_FRAME: '补班节次无效',
  INVALID_DATE: '请选择时间',
  INVALID_RANGE: '截止日期不能早于开始日期',
  INVALID_REASON: '申请原因无效',
  RECORD_NOT_FOUND: '找不到这条请假记录',
  CANCEL_TOO_LATE: '离原值班开始不到15分钟，不能撤销',
  MAKEUP_TOO_LATE: '离补班开始不到15分钟，不能撤销',
  MAKEUP_ALREADY_STARTED: '补班已经开始，不能撤销',
  MAKEUP_IN_USE: '这次补班已再次请假，不能撤销',
  CANCEL_FAILED: '撤销失败，请稍后重试'
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

const SEMESTER_ERROR_TEXT = {
  FORBIDDEN: '没有权限',
  SEMESTER_NOT_CONFIGURED: '请选择学年学期',
  INVALID_DATE: '日期无效',
  INVALID_RANGE: '截止日期不能早于开始日期',
  SEMESTER_DATES_EXISTS: '这个学期的起止日期没有变化',
  SEMESTER_DATE_OVERLAP: '这个日期和另一个学期重叠，请改开',
  ACADEMIC_YEAR_INVALID: '学年须为连续两年，例如 2027-2028',
  ACADEMIC_YEAR_EXISTS: '这个学年已经存在',
  NO_MATCHED_DATE: '当前学期没有可生成的值班'
}

export function setCurrentSemester(payload) {
  const request = useMock ? mock.setCurrentSemester(payload) : real('/SetCurrentSemester/', payload)
  return request.catch(explainMappedError(SEMESTER_ERROR_TEXT))
}

export function getSemesterDutyRange() {
  return useMock ? mock.getSemesterDutyRange() : real('/GetSemesterDutyRange/', {})
}

export function setSemesterDutyRange(payload) {
  const request = useMock ? mock.setSemesterDutyRange(payload) : real('/SetSemesterDutyRange/', payload)
  return request.catch(explainMappedError(SEMESTER_ERROR_TEXT))
}

export function generateSemesterDuty(payload) {
  const request = useMock ? mock.generateSemesterDuty(payload) : real('/GenerateSemesterDuty/', payload)
  return request.catch(explainMappedError(SEMESTER_ERROR_TEXT))
}

export function addAcademicYear(payload) {
  const request = useMock ? mock.addAcademicYear(payload) : real('/AddAcademicYear/', payload)
  return request.catch(explainMappedError(SEMESTER_ERROR_TEXT))
}

const MEMBER_ERROR_TEXT = {
  INVALID_DEPARTMENT: '请选择已有部门',
  FORBIDDEN: '没有权限',
  MEMBER_EXISTS: '该学号已存在',
  MEMBER_NOT_FOUND: '成员不存在',
  SEMESTER_NOT_CONFIGURED: '当前学期未配置'
}

const DEPARTMENT_ERROR_TEXT = {
  FORBIDDEN: '没有权限',
  DEPARTMENT_REQUIRED: '请输入部门名称',
  DEPARTMENT_TOO_LONG: '部门名称不能超过20个字',
  DEPARTMENT_EXISTS: '这个部门已经有了',
  DEPARTMENT_NOT_FOUND: '部门不存在',
  DEPARTMENT_IN_USE: '这个部门还有成员，不能删除'
}

function explainMappedError(map) {
  return (err) => {
    const code = err?.response?.data?.error
    if (typeof code === 'string' && map[code]) {
      const error = new Error(map[code])
      error.code = code
      return Promise.reject(error)
    }
    return Promise.reject(err)
  }
}

export function getAllYoutholer() {
  return useMock ? mock.getAllYoutholer() : real('/GetAllYoutholer/', {})
}

export function getDepartments() {
  return useMock ? mock.getDepartments() : real('/GetDepartmentList/', {})
}

export function addDepartment(name) {
  const request = useMock ? mock.addDepartment({ name }) : real('/AddDepartment/', { name })
  return request.catch(explainMappedError(DEPARTMENT_ERROR_TEXT))
}

export function deleteDepartment(name) {
  const request = useMock ? mock.deleteDepartment({ name }) : real('/DeleteDepartment/', { name })
  return request.catch(explainMappedError(DEPARTMENT_ERROR_TEXT))
}

export function addOneYoutholer(payload) {
  const request = useMock ? mock.addOneYoutholer(payload) : real('/AddOneYoutholer/', payload)
  return request.catch(explainMappedError(MEMBER_ERROR_TEXT))
}

export function modifySingleYoutholInfo(payload) {
  const request = useMock ? mock.modifySingleYoutholInfo(payload) : real('/ModifySingleYoutholInfo/', payload)
  return request.catch(explainMappedError(MEMBER_ERROR_TEXT))
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

export function getMyLeaveRecords(payload) {
  return useMock ? mock.getMyLeaveRecords(payload) : real('/GetMyLeaveRecords/', payload).catch(explainLeaveError)
}

export function cancelLeaveAdjust(payload) {
  return useMock ? mock.cancelLeaveAdjust(payload) : real('/CancelLeaveAdjust/', payload).catch(explainLeaveError)
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

