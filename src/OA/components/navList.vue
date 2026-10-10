<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Calendar, Checked, EditPen, OfficeBuilding, SwitchButton, User } from '@element-plus/icons-vue'
import { useUserStore } from 'store/store.js'
import { clearToken } from 'assets/js/token.js'
import { isAdminIdentity, resetSession } from '../session.js'
import { adminMenus, memberMenus, openedGroup } from './menuConfig.js'

const emit = defineEmits(['displayHeaderNav', 'expand'])
const props = defineProps({
  collapsed: { type: Boolean, default: false },
  collapsible: { type: Boolean, default: true }
})

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const icons = { Calendar, Checked, EditPen, OfficeBuilding, SwitchButton, User }
const isAdmin = computed(() => isAdminIdentity(userStore.identity))
const menus = computed(() => (isAdmin.value ? adminMenus : memberMenus))
const opened = computed(() => (isAdmin.value ? openedGroup(route.path) : []))
const showCollapsed = computed(() => props.collapsible && props.collapsed)

function onSelect(index) {
  if (index.startsWith('/')) router.push(index)
  emit('displayHeaderNav', false)
}

function onCollapsedClick(event) {
  if (!showCollapsed.value) return
  const target = event.target
  if (!(target instanceof Element) || !target.closest('.el-sub-menu__title')) return
  event.preventDefault()
  event.stopPropagation()
  emit('expand')
}

function logout() {
  resetSession()
  clearToken()
  userStore.$patch({ sdut_id: '', is_login: false })
  window.location.href = import.meta.env.BASE_URL
}
</script>

<template>
  <div class="side-menu" :class="{ 'is-collapse': showCollapsed }" @click.capture="onCollapsedClick">
    <el-menu
      :key="opened.join()"
      :default-active="route.path"
      :default-openeds="opened"
      :collapse="false"
      :collapse-transition="false"
      unique-opened
      background-color="#008aff"
      text-color="#ffffff"
      active-text-color="#008aff"
      @select="onSelect"
    >
      <template v-for="item in menus" :key="item.index">
        <el-sub-menu v-if="item.children" :index="item.index">
          <template #title>
            <el-icon><component :is="icons[item.icon]" /></el-icon>
            <span class="menu-label">{{ item.title }}</span>
          </template>
          <el-menu-item v-for="child in item.children" :key="child.index" :index="child.index">
            <span class="menu-label">{{ child.title }}</span>
          </el-menu-item>
        </el-sub-menu>
        <el-menu-item v-else :index="item.index">
          <el-icon v-if="item.icon"><component :is="icons[item.icon]" /></el-icon>
          <template #title><span class="menu-label">{{ item.title }}</span></template>
        </el-menu-item>
      </template>
    </el-menu>
    <button type="button" class="logout" @click="logout">
      <el-icon><SwitchButton /></el-icon>
      <span class="menu-label">退出登录</span>
    </button>
  </div>
</template>

<style scoped>
.side-menu {
  width: 100%;
  min-height: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #008aff;
}
.el-menu {
  border-right: none;
  flex: 1;
  overflow: auto;
}
.logout {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex: none;
  width: 100%;
  height: 48px;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  background: transparent;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
}
.menu-label {
  display: inline-block;
  overflow: hidden;
  white-space: nowrap;
  max-width: 140px;
  opacity: 1;
  vertical-align: middle;
  transition:
    max-width 0.28s cubic-bezier(0.22, 0.61, 0.36, 1),
    opacity 0.18s ease;
}
.side-menu.is-collapse .menu-label {
  max-width: 0;
  opacity: 0;
}
.side-menu :deep(.el-menu--inline) {
  max-height: 320px;
  overflow: hidden;
  transition: max-height 0.28s cubic-bezier(0.22, 0.61, 0.36, 1);
}
.side-menu.is-collapse :deep(.el-menu--inline) {
  max-height: 0;
}
.side-menu.is-collapse :deep(.el-sub-menu__icon-arrow) {
  opacity: 0;
}
.side-menu.is-collapse :deep(.el-menu-item .el-icon),
.side-menu.is-collapse :deep(.el-sub-menu__title .el-icon),
.side-menu.is-collapse .logout .el-icon {
  margin-right: 0;
}
.side-menu.is-collapse :deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  background-color: #ffffff !important;
  color: #008aff !important;
}
.side-menu :deep(.el-menu-item:hover),
.side-menu :deep(.el-sub-menu__title:hover) {
  background-color: #1a96ff !important;
}
.side-menu :deep(.el-menu-item.is-active) {
  background-color: #ffffff !important;
  color: #008aff !important;
}
</style>
