<script setup>
import { onMounted, ref, watch } from 'vue'
import { RouterView } from 'vue-router'
import { less768 } from 'assets/js/screen.js' //配置了基本的设置
import { useUserStore } from 'store/store.js'
import { errorAlert } from 'assets/js/message.js'
import { getDutyPauseState, pausedFrom, checkDuty as fetchCheckDuty } from 'assets/js/oaApi.js'
import { ensureSession } from './session.js'

import { Expand, Fold } from '@element-plus/icons-vue'
import navList from './components/navList.vue'

let userStore = useUserStore()

function loadPauseState() {
  getDutyPauseState()
    .then((res) => {
      userStore.$patch({ duty_paused: pausedFrom(res) })
    })
    .catch(() => {})
}

function checkDuty() {
  fetchCheckDuty({
      sdut_id: userStore.sdut_id
    })
    .then((res) => {
      console.log(res.data)
      let data = res.data
      if (data.duty_state == '未值班') return

      userStore.$patch({
        is_login: true,
        duty_start_time: data.start_time,
        duty_state: data.duty_state
      })
    })
    .catch(function (error) {
      console.log(error)
      errorAlert('检查签到状态失败')
    })
}

let handleClose = (done) => {
  done()
}

let drawer = ref(false)
function displayHeaderNav(res) {
  drawer.value = res
}


const collapsed = ref(localStorage.getItem('oa-menu-collapse') === '1')
const isPhone = ref(false)
watch(collapsed, (value) => localStorage.setItem('oa-menu-collapse', value ? '1' : '0'))

let _size = ref('0%')
onMounted(() => {
  isPhone.value = less768()
  if (isPhone.value) {
    _size.value = '90%'
  }
  ensureSession()
    .then(() => {
      loadPauseState()
      checkDuty()
    })
    .catch(() => {})
})
</script>

<template>
  <div class="main-layout">
    <el-container>
      <el-header class="header-nav">
        <div class="top-nav">
          <img
            src="../assets/img/youthol.png"
            alt=""
            class="youthol-logo"
            @click="displayHeaderNav(true)"
          />
          <div class="top-nav-btn" @click="displayHeaderNav(true)">菜单</div>
        </div>
      </el-header>

      <el-container>
        <el-aside class="aside-nav" :class="{ 'is-collapse': collapsed && !isPhone }">
          <div class="user-info">
            <!-- <el-image class="profile" :src="userInfo.profileSrc" fit="cover" /> -->
            <div class="user-info-detail">
              <div class="user-name">{{ userStore.name }}</div>
              <div class="department">{{ userStore.department }}</div>
              <div class="department">{{ userStore.identity }}</div>
            </div>
          </div>
          <button v-if="!isPhone" type="button" class="collapse-btn" @click="collapsed = !collapsed">
            <el-icon><Fold v-if="!collapsed" /><Expand v-else /></el-icon>
            <span class="collapse-label">{{ collapsed ? '展开' : '收起' }}</span>
          </button>
          <navList
            :collapsed="collapsed"
            :collapsible="!isPhone"
            @expand="collapsed = false"
          />

          <!-- <img src="../assets/img/youthol.png" alt="" class="youthol-logo" /> -->
        </el-aside>
        <el-main>
          <el-scrollbar>
            <router-view name="MainComponment"></router-view>
          </el-scrollbar>
        </el-main>
      </el-container>

      <!-- <el-footer class="state-bar">
        <div class="all-duty">累计值班：{{ stateBar.allDuty }}小时</div>
        <div class="duty-state">{{ userStore.duty_state }}</div>
        <div class="now-brorrow">正在借用设备：{{ stateBar.nowBrorrow }}</div>
      </el-footer> -->
    </el-container>
    <el-drawer
      :size="_size"
      v-model="drawer"
      :with-header="false"
      direction="ttb"
      :before-close="handleClose"
    >
      <template #default>
        <div class="header-nav-drawer">
          <div class="nav-item" @click="displayHeaderNav(false)">关闭菜单</div>
          <navList :collapsible="false" @display-header-nav="displayHeaderNav" />
        </div>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.user-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-height: 220px;
  margin: 12px 0;
  overflow: hidden;
  opacity: 1;
  transition:
    max-height 0.28s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.2s ease,
    margin 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.user-info-detail {
  padding: 10px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-family: 'SmileySans';
  font-size: 30px;
}
.user-info-detail > div {
  color: white;
  padding: 5px;
}

.el-scrollbar {
  width: 100%;
}

.aside-nav {
  height: 100%;
  background-color: #008aff;
  font-size: 18px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  overflow: hidden;
}
.header-nav {
  height: 50px;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  position: fixed;
  top: 0;
}
.nav-item {
  margin: 3px 0;
  width: 100%;
  padding: 20px 0px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.nav-item:hover {
  opacity: 1;
  box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.7);
  transform: scale(1.05, 1.05);
}

.el-footer {
  height: 30px;
  width: 100%;
  display: flex;
  background-color: #008aff;
  justify-content: space-between;
  align-items: center;
  position: fixed;
  bottom: 0;
}

.main-layout {
  height: 100%;
}
.el-container {
  height: 100%;
}

.state-bar {
  z-index: 100;
  color: white;
}

@media only screen and (min-width: 768px) {
  /* for desktop */
  .youthol-logo {
    display: none;
  }

  .header-nav {
    /* height: 0px; */
    display: none;
  }

  .aside-nav {
    width: 200px;
    transition: width 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
  }

  .aside-nav.is-collapse {
    width: 64px;
  }

  .aside-nav.is-collapse .user-info {
    max-height: 0;
    margin: 0;
    opacity: 0;
  }

  .collapse-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: none;
    gap: 6px;
    width: calc(100% - 24px);
    height: 36px;
    margin: 0 12px 12px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: #ffffff;
    color: #008aff;
    font-size: 14px;
    font-weight: 600;
    line-height: 1;
    cursor: pointer;
    box-shadow: 0 1px 3px rgba(0, 40, 90, 0.18);
    overflow: hidden;
  }

  .collapse-btn:hover {
    background: #eaf5ff;
  }

  .collapse-label {
    overflow: hidden;
    white-space: nowrap;
    max-width: 42px;
    opacity: 1;
    transition:
      max-width 0.28s cubic-bezier(0.22, 0.61, 0.36, 1),
      opacity 0.18s ease;
  }

  .aside-nav.is-collapse .collapse-btn {
    gap: 0;
  }

  .aside-nav.is-collapse .collapse-label {
    max-width: 0;
    opacity: 0;
  }

  .nav-item {
    color: white;
  }
}

@media only screen and (max-width: 768px) {
  /* for phone */
  .youthol-logo {
    height: 40px;
    /* width: 105px; */
    width: auto;
  }
  .top-nav {
    padding: 0 10px;
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .top-nav-btn {
    color: #f68512;
    font-weight: 700;
    font-size: 18px;
    padding: 4px 8px;
    border-radius: 10px;
    border: 3px solid #f68512;
  }

  .top-nav-btn:hover {
    background-color: #f68512;
    color: white;
    border: 3px solid #f68512;
  }
  .header-nav-drawer {
    width: 100%;
    height: 100%;
    /* background-color: #008aff; */
  }

  .el-main {
    padding: 50px 10px 10px;
  }

  .header-nav {
    width: 100%;
  }

  .aside-nav {
    /* width: 0px; */
    display: none;
  }

  .nav-item {
    color: #f68512;
    font-weight: 800;
    font-size: 20px;
  }
  .nav-item:hover {
    opacity: 1;
    box-shadow: inset 0 0 20px #57b1ff6f;
    transform: scale(1.05, 1.05);
  }
}
</style>
