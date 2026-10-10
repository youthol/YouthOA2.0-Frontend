export const adminMenus = [
  { index: '/duty', title: '值班', icon: 'Calendar' },
  {
    index: 'attendance',
    title: '考勤',
    icon: 'Checked',
    children: [
      { index: '/DutyRecord', title: '签到记录' },
      { index: '/schedule-query', title: '排班查询' },
      { index: '/pause-duty', title: '暂停值班' }
    ]
  },
  {
    index: 'leave',
    title: '请假',
    icon: 'EditPen',
    children: [
      { index: '/leave-adjust', title: '请假调班' },
      { index: '/leave-record', title: '请假记录' }
    ]
  },
  {
    index: 'room',
    title: '房间',
    icon: 'OfficeBuilding',
    children: [
      { index: '/room', title: '房间借用' },
      { index: '/RoomManage', title: '房间借用记录' }
    ]
  },
  { index: '/MemberManage', title: '成员管理', icon: 'User' }
]

export const memberMenus = [
  { index: '/duty', title: '值班', icon: 'Calendar' },
  { index: '/leave-adjust', title: '请假调班', icon: 'EditPen' }
]

export function openedGroup(path) {
  const group = adminMenus.find((item) => item.children?.some((child) => child.index === path))
  return group ? [group.index] : []
}
