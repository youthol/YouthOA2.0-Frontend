import { reactive } from 'vue'

// export const departmentOption = [
//   { label: '程序部', value: '程序部' },
//   { label: '媒体中心', value: '媒体中心' },
//   { label: '共建中心', value: '共建中心' },
//   { label: '美工部', value: '美工部' },
//   { label: '综合部', value: '综合部' },
//   { label: '闪客部', value: '闪客部' },
//   { label: '视频推广部', value: '视频推广部' },
//   { label: '摄影部', value: '摄影部' },
//   { label: '管理组', value: '管理组' }
// ]

export const DEFAULT_DEPARTMENTS = [
  '程序部',
  '媒体中心',
  '共建中心',
  '美工部',
  '综合部',
  '闪客部',
  '视频推广部',
  '视频编辑部',
  '摄影部',
  '管理组'
]

export const departmentOption = reactive(DEFAULT_DEPARTMENTS.map((name) => ({ label: name, value: name })))

export function replaceDepartments(names) {
  const clean = []
  const seen = new Set()
  for (const raw of names || []) {
    const name = String(raw ?? '').trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    clean.push(name)
  }
  const next = clean.length ? clean : DEFAULT_DEPARTMENTS
  departmentOption.splice(0, departmentOption.length, ...next.map((name) => ({ label: name, value: name })))
  departmentFilter.splice(0, departmentFilter.length, ...next.map((name) => ({ text: name, value: name })))
}

export const identityOption = [
  { label: '试用', value: '试用' },
  { label: '正式', value: '正式' },
  { label: '管理员', value: '管理员' }
]

export const dutyDayOption = [
  { label: '未安排', value: '0' },
  { label: '周一', value: '1' },
  { label: '周二', value: '2' },
  { label: '周三', value: '3' },
  { label: '周四', value: '4' },
  { label: '周五', value: '5' },
  { label: '周六', value: '6' },
  { label: '周日', value: '7' }
]
export const dutyFrameOption = [
  { label: '未安排', value: '0' },
  { label: '第1-2节（08:00-09:40）', value: '1' },
  { label: '第3-4节（10:00-11:40）', value: '2' },
  { label: '第5-6节（14:00-15:40）', value: '3' },
  { label: '第7-8节（16:00-17:40）', value: '4' },
  { label: '第9-10节（19:00-20:40）', value: '5' }
]

// export const departmentFilter = [
//   { text: '程序部', value: '程序部' },
//   { text: '媒体中心', value: '媒体中心' },
//   { text: '共建中心', value: '共建中心' },
//   { text: '美工部', value: '美工部' },
//   { text: '综合部', value: '综合部' },
//   { text: '闪客部', value: '闪客部' },
//   { text: '视频推广部', value: '视频推广部' },
//   { text: '摄影部', value: '摄影部' },
//   { text: '管理组', value: '管理组' }
// ]

export const departmentFilter = reactive(DEFAULT_DEPARTMENTS.map((name) => ({ text: name, value: name })))

export const stateFilter = [
  { text: '正在值班', value: '正在值班' },
  { text: '正常值班', value: '正常值班' },
  { text: '值班时间不足', value: '值班时间不足' },
  { text: '早退', value: '早退' },
  { text: '迟到', value: '迟到' }
]

export const identityFilter = [
  { text: '试用', value: '试用' },
  { text: '正式', value: '正式' },
  { text: '管理员', value: '管理员' }
]

export const formatterDay = (data) => {
  let res = ''
  res += '周'
  switch (data.day) {
    case 1:
      res += '一'
      break
    case 2:
      res += '二'
      break
    case 3:
      res += '三'
      break
    case 4:
      res += '四'
      break
    case 5:
      res += '五'
      break
    case 6:
      res += '六'
      break
    case 7:
      res += '日'
      break
  }
  return res
}

export const formatterFrame = (data) => {
  let res = ''
  res += '第'
  switch (data.frame) {
    case 1:
      res += '12节'
      break
    case 2:
      res += '34节'
      break
    case 3:
      res += '56节'
      break
    case 4:
      res += '78节'
      break
    case 5:
      res += '910节'
  }
  return res
}
