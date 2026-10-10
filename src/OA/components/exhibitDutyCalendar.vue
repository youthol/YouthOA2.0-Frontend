<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { less768 } from 'assets/js/screen'
import { errorAlert } from 'assets/js/message.js'
import { useUserStore } from 'store/store.js'
import { getDutyStatusInRange, getSemesterDutyRange, getSingleDutyCalendar, listFrom, objectFrom } from 'assets/js/oaApi.js'
import { WEEKDAY_LABEL, frameLabelWithTime } from 'assets/js/dutyFrame.js'
import { isAdminIdentity } from '../session.js'
import dutyCalendar from './dutyCalendar.vue'
import dutyStatusDots from './dutyStatusDots.vue'

defineProps(['drawer'])
const emit = defineEmits(['displayRecord'])
const userStore = useUserStore()
const slots = ref([])
const allRows = ref([])
const loading = ref(false)
const statusLoading = ref(false)
const allLoaded = ref(false)
const showStatus = ref(false)
const viewScope = ref('self')
const keyword = ref('')
const _size = ref('80%')
const isAdmin = computed(() => isAdminIdentity(userStore.identity))

const detailRows = computed(() => {
  const ownOnly = !isAdmin.value || viewScope.value === 'self'
  let rows = ownOnly ? slots.value : allRows.value
  if (isAdmin.value && viewScope.value === 'search') {
    const text = keyword.value.trim().toLowerCase()
    if (!text) return []
    rows = rows.filter(
      (row) =>
        String(row.name || '').toLowerCase().includes(text) ||
        String(row.sdut_id || '').toLowerCase().includes(text)
    )
  }
  return rows.slice().sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time) || String(a.sdut_id).localeCompare(String(b.sdut_id)))
})

const emptyText = computed(() => {
  if (isAdmin.value && viewScope.value === 'search' && !keyword.value.trim()) return '请输入姓名或学号'
  if (isAdmin.value && viewScope.value === 'search') return '没有找到该成员的值班情况'
  return '暂无值班详情'
})

const tableLoading = computed(() => (isAdmin.value && viewScope.value !== 'self' ? statusLoading.value : loading.value))
const showMemberColumns = computed(() => isAdmin.value && showStatus.value && viewScope.value !== 'self')

function dateText(slot) {
  const [year, month, day] = String(slot?.date || '').split('-')
  if (!year || !month || !day) return slot?.date || ''
  const weekday = WEEKDAY_LABEL[Number(slot.weekday)] || ''
  return `${Number(year)}/${Number(month)}/${Number(day)}${weekday ? ' ' + weekday : ''}`
}

function handleClose(done) {
  emit('displayRecord', false)
  done()
}

function loadAllMembers() {
  if (allLoaded.value || statusLoading.value) return
  statusLoading.value = true
  getSemesterDutyRange()
    .then((res) => {
      const info = objectFrom(res)
      const start = info.semester_start || info.default_start
      const end = info.duty_end || info.default_end
      if (!start || !end) {
        errorAlert('当前学期未配置')
        return null
      }
      return getDutyStatusInRange({
        start_date: String(start).slice(0, 10),
        end_date: String(end).slice(0, 10)
      })
    })
    .then((res) => {
      if (!res) return
      allRows.value = listFrom(res)
      allLoaded.value = true
    })
    .catch((err) => {
      errorAlert(err.message || '查询值班情况失败')
    })
    .finally(() => {
      statusLoading.value = false
    })
}

watch(viewScope, (value) => {
  if (isAdmin.value && (value === 'all' || value === 'search')) loadAllMembers()
})

onMounted(() => {
  if (less768()) _size.value = '95%'
  loading.value = true
  getSingleDutyCalendar({ sdut_id: userStore.sdut_id })
    .then((res) => {
      slots.value = listFrom(res)
      loading.value = false
    })
    .catch((err) => {
      loading.value = false
      errorAlert(err.message || '获取值班记录失败')
    })
})
</script>
<template>
  <el-drawer :size="_size" :modelValue="drawer" title="值班记录" direction="rtl" :before-close="handleClose">
    <div class="drawer-toolbar">
      <div v-if="showStatus && isAdmin" class="scope-box">
        <el-select v-model="viewScope" class="scope-select">
          <el-option label="本人" value="self" />
          <el-option label="全体成员" value="all" />
          <el-option label="查找其他人" value="search" />
        </el-select>
        <el-input
          v-if="viewScope === 'search'"
          v-model="keyword"
          class="keyword"
          placeholder="输入姓名或学号"
          clearable
        />
      </div>
      <button type="button" class="status-btn" @click="showStatus = !showStatus">
        {{ showStatus ? '返回日历' : '值班情况' }}
      </button>
    </div>
    <dutyCalendar v-if="!showStatus" :slots="slots" :loading="loading" />
    <el-table
      v-else
      v-loading="tableLoading"
      :data="detailRows"
      :empty-text="emptyText"
      class="detail-table"
    >
      <el-table-column v-if="showMemberColumns" prop="name" label="姓名" min-width="100" />
      <el-table-column v-if="showMemberColumns" prop="sdut_id" label="学号" min-width="130" />
      <el-table-column label="日期" min-width="160">
        <template #default="scope">{{ dateText(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="节次" min-width="180">
        <template #default="scope">{{ frameLabelWithTime(scope.row.frame) }}</template>
      </el-table-column>
      <el-table-column label="状态" min-width="160">
        <template #default="scope">
          <dutyStatusDots
            :status="scope.row.status"
            :flags="scope.row.flags || []"
            :source="scope.row.source"
            show-label
          />
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<style scoped>
.drawer-toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.scope-box {
  display: flex;
  flex: 1;
  gap: 8px;
  min-width: 0;
}
.scope-select {
  width: 148px;
  flex: none;
}
.keyword {
  max-width: 220px;
}
.status-btn {
  height: 32px;
  padding: 0 12px;
  border: 0;
  border-radius: 8px;
  background: #008aff;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  flex: none;
}
.status-btn:hover {
  background: #1a96ff;
}
.detail-table {
  width: 100%;
}
</style>
