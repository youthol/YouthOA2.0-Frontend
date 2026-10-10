import { createRouter, createWebHashHistory } from 'vue-router'
import { ensureSession, isAdminIdentity } from '../session.js'

const adminRoutes = [
  '/duty-status',
  '/DutyRecord',
  '/MemberManage',
  '/MachineManage',
  '/RoomManage',
  '/leave-record',
  '/schedule-query',
  '/pause-duty',
  '/room'
]

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      components: {
        MainComponment: () => import('../views/MemberDuty.vue')
      }
    },
    {
      path: '/duty',
      name: 'oa-duty',
      components: {
        MainComponment: () => import('../views/MemberDuty.vue')
      }
    },
    {
      path: '/borrow',
      name: 'oa-borrow',
      components: {
        MainComponment: () => import('../views/MachineBorrow.vue')
      }
    },
    {
      path: '/study',
      name: 'oa-home',
      components: {
        MainComponment: () => import('../views/StudyPlan.vue')
      }
    },
    {
      path: '/room',
      name: 'oa-room',
      components: {
        MainComponment: () => import('../views/RoomPlan.vue')
      }
    },
    {
      path: '/duty-status',
      name: 'oa-duty-status',
      components: {
        MainComponment: () => import('../views/DutyStatusQuery.vue')
      }
    },
    {
      path: '/DutyRecord',
      name: 'oa-duty-record',
      components: {
        MainComponment: () => import('../views/DutyRecord.vue')
      }
    },
    {
      path: '/MemberManage',
      name: 'oa-member-manage',
      components: {
        MainComponment: () => import('../views/MemberManage.vue')
      }
    },
    {
      path: '/MachineManage',
      name: 'oa-machine-manage',
      components: {
        MainComponment: () => import('../views/MachineManage.vue')
      }
    },
    {
      path: '/RoomManage',
      name: 'oa-room-manage',
      components: {
        MainComponment: () => import('../views/RoomManage.vue')
      }
    },
    {
      path: '/leave-adjust',
      name: 'oa-leave-adjust',
      components: {
        MainComponment: () => import('../views/LeaveAdjust.vue')
      }
    },
    {
      path: '/leave-record',
      name: 'oa-leave-record',
      components: {
        MainComponment: () => import('../views/LeaveRecord.vue')
      }
    },
    {
      path: '/pause-duty',
      name: 'oa-pause-duty',
      components: {
        MainComponment: () => import('../views/PauseDuty.vue')
      }
    },
    {
      path: '/schedule-query',
      name: 'oa-schedule-query',
      components: {
        MainComponment: () => import('../views/ScheduleQuery.vue')
      }
    },
    {
      path: '/test',
      name: 'oa-test',
      components: {
        MainComponment: () => import('../views/TestPage.vue')
      }
    }
  ]
})

router.beforeEach(async (to) => {
  let store
  try {
    store = await ensureSession()
  } catch {
    return true
  }
  const admin = isAdminIdentity(store.identity, store.position)
  if (admin && to.path === '/') {
    return { path: '/MemberManage', replace: true }
  }
  if (adminRoutes.includes(to.path) && !admin) {
    return { path: '/duty', replace: true }
  }
  return true
})

//   if (to.matched.some((record) => record.meta.requiresAuth) && !isAuthenticated) {
//     // 如果需要身份验证且用户未登录，则重定向到登录页
//     next({ path: '/' })
//   } else if (isAuthenticated && to.path === '/') {
//     // 如果用户已登录且尝试访问登录页，则重定向到仪表板页
//     next({ path: '/' })
//   } else {
//     // 其他情况允许导航
//     next()
//   }
// })

export default router
