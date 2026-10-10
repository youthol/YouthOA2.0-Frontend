<script setup>
import { onMounted, ref } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { getDutyPauseState, pausedFrom, setDutyPauseState } from 'assets/js/oaApi.js'
import { useUserStore } from 'store/store.js'

const paused = ref(false)
const loading = ref(false)
const userStore = useUserStore()

function load() {
  loading.value = true
  getDutyPauseState()
    .then((res) => {
      paused.value = pausedFrom(res)
      userStore.$patch({ duty_paused: paused.value })
      loading.value = false
    })
    .catch((err) => {
      loading.value = false
      errorAlert(err.message || '获取暂停状态失败')
    })
}

function change(value) {
  loading.value = true
  setDutyPauseState({ paused: value })
    .then((res) => {
      paused.value = pausedFrom(res)
      userStore.$patch({ duty_paused: paused.value })
      loading.value = false
      successAlert(paused.value ? '已暂停值班，成员将无法签到' : '已恢复值班')
    })
    .catch((err) => {
      loading.value = false
      paused.value = !value
      errorAlert(err.message || '设置失败')
    })
}

onMounted(load)
</script>
<template>
  <div class="main-layout">
    <h2>暂停值班</h2>
    <p class="desc">法定假期可停止值班。打开后，成员端无法进行正常签到。</p>
    <div class="switch-row" v-loading="loading">
      <span>当前状态：{{ paused ? '已暂停' : '正常值班' }}</span>
      <el-switch v-model="paused" active-text="暂停" inactive-text="开启" @change="change" />
    </div>
  </div>
</template>

<style scoped>
.main-layout {
  width: 100%;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
}
.desc {
  color: #666;
}
.switch-row {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 18px;
}
</style>
