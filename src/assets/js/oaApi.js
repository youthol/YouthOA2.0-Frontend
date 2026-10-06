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
  return useMock ? mock.applyLeaveAdjust(payload) : real('/ApplyLeaveAdjust/', payload)
}

export function getLeaveRecords(payload) {
  return useMock ? mock.getLeaveRecords(payload) : real('/GetLeaveRecords/', payload)
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
