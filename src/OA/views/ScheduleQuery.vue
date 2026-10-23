<script setup>
import { computed, ref, onMounted } from 'vue'
import { errorAlert } from 'assets/js/message.js'
import { formatScheduleLine as formatSlot } from 'assets/js/dutyFrame.js'
import { getDepartments, getDutyStatusInRange, getSemesterDutyRange, listFrom, objectFrom } from 'assets/js/oaApi.js'
import { dutyStatusGroup, dutyStatusGroupText } from 'assets/js/dutyStatus.js'
import dutyStatusDots from '../components/dutyStatusDots.vue'

const personKeyword = ref('')
const queryRange = ref([])
const department = ref('')
const departments = ref([])
const departmentLoading = ref(false)
const semesterRange = ref([])
const resultRows = ref([])
const resultState = ref('loading')
const resultMessage = ref('')
const statusGroup = ref('all')
const statusFilters = [
  { key: 'all', label: '全部' },
  { key: 'done', label: '值班' },
  { key: 'missed', label: '未值班' },
  { key: 'irregular', label: '不规范' }
]
const departmentOptions = computed(() => [...new Set([
  ...departments.value,
  ...resultRows.value.map((row) => row.department).filter(Boolean)
])])
const matchingRows = computed(() => {
  const keyword = personKeyword.value.trim().toLowerCase()
  const [start, end] = queryRange.value || []
  return resultRows.value.filter((row) => {
    const matchesPerson = !keyword || [row.name, row.sdut_id].some((value) =>
      String(value ?? '').toLowerCase().includes(keyword)
    )
    return matchesPerson &&
      (!department.value || row.department === department.value) &&
      (!start || row.date >= start) && (!end || row.date <= end)
  })
})
const groupCounts = computed(() => {
  const counts = { done: 0, missed: 0, irregular: 0, pending: 0 }
  matchingRows.value.forEach((row) => {
    const group = dutyStatusGroup(row)
    counts[group] = (counts[group] || 0) + 1
  })
  return counts
})
const filteredRows = computed(() => {
  if (statusGroup.value === 'all') return matchingRows.value
  return matchingRows.value.filter((row) => dutyStatusGroup(row) === statusGroup.value)
})
const tableEmptyText = computed(() => {
  if (resultState.value === 'loading') return '查询中'
  if (resultState.value === 'fail') return resultMessage.value
  if (statusGroup.value !== 'all' && matchingRows.value.length && !filteredRows.value.length) return '没有符合该状态的记录'
  return '没有符合当前筛选条件的排班'
})
let resultToken = 0

function beginResult() {
  resultToken += 1
  resultRows.value = []
  resultState.value = 'loading'
  resultMessage.value = ''
  return resultToken
}

function isCurrent(token) {
  return token === resultToken
}

function queryErrorText(err) {
  const code = err?.response?.data?.error
  if (code === 'SEMESTER_NOT_CONFIGURED') return '当前学期未配置'
  if (code === 'FORBIDDEN') return '没有权限'
  return err?.message || '查询排班失败'
}

function queryPerson() {
  const keyword = personKeyword.value.trim()
  if (!keyword) {
    errorAlert('请输入姓名或学号')
    return
  }
  return querySchedule()
}

async function querySchedule() {
  const selectedRange = [...(queryRange.value || [])]
  if (selectedRange.length && (selectedRange.length !== 2 || !selectedRange[0] || !selectedRange[1] || selectedRange[0] > selectedRange[1])) {
    errorAlert('请选择有效的日期区间')
    return
  }
  const token = beginResult()
  try {
    if (!selectedRange.length && !semesterRange.value.length) {
      const semester = await getSemesterDutyRange()
      if (!isCurrent(token)) return
      const info = objectFrom(semester)
      const start = info.semester_start || info.default_start || info.start_date
      const end = info.duty_end || info.default_end || info.end_date
      if (!start || !end) {
        resultState.value = 'empty'
        resultMessage.value = '当前学期暂无排班'
        return
      }
      semesterRange.value = [start, end]
    }
    const [start, end] = selectedRange.length ? selectedRange : semesterRange.value
    const res = await getDutyStatusInRange({
      start_date: `${start} 00:00:00`,
      end_date: `${end} 23:59:59`
    })
    if (!isCurrent(token)) return
    resultRows.value = listFrom(res).sort(
      (first, second) => (first.date + first.start_time).localeCompare(second.date + second.start_time) || String(first.sdut_id).localeCompare(String(second.sdut_id))
    )
    resultState.value = resultRows.value.length ? 'ok' : 'empty'
    resultMessage.value = resultRows.value.length ? '' : '没有符合当前筛选条件的排班'
  } catch (err) {
    if (!isCurrent(token)) return
    resultState.value = 'fail'
    resultMessage.value = '查询失败，请稍后重试'
    errorAlert(queryErrorText(err))
  }
}

async function loadDepartments() {
  departmentLoading.value = true
  try {
    const res = await getDepartments()
    departments.value = listFrom(res)
      .map((item) => typeof item === 'string' ? item : item?.name)
      .filter(Boolean)
  } catch (err) {
    errorAlert(err.message || '加载部门失败，请刷新重试')
  } finally {
    departmentLoading.value = false
  }
}

onMounted(() => {
  querySchedule()
  loadDepartments()
})
</script>

<template>
  <div class="page">
    <h2 class="title">排班查询</h2>
    <div class="toolbar query-bar">
      <el-input v-model="personKeyword" placeholder="按人查询：姓名或学号" clearable @keyup.enter="queryPerson" />
      <button type="button" class="btn" @click="queryPerson">按人查询</button>
      <el-select v-model="department" class="department-select" placeholder="按部门查询：全部部门" aria-label="按部门查询" filterable clearable :loading="departmentLoading">
        <el-option v-for="name in departmentOptions" :key="name" :label="name" :value="name" />
      </el-select>
      <el-date-picker v-model="queryRange" type="daterange" value-format="YYYY-MM-DD" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" @change="querySchedule" />
      <button type="button" class="btn" @click="querySchedule">查看名单</button>
    </div>
    <p class="hint">姓名或学号、部门、日期区间可组合筛选；不选日期时显示当前学期，区间包含起止日期。</p>
    <div class="status-bar">
      <span class="status-label">值班状态</span>
      <div
        v-for="item in statusFilters"
        :key="item.key"
        class="btn"
        :class="{ active: statusGroup === item.key }"
        @click="statusGroup = item.key"
      >
        {{ item.label }}<span v-if="item.key !== 'all'" class="count">{{ groupCounts[item.key] || 0 }}</span>
      </div>
    </div>
    <p class="hint">不规范包括迟到、早退、未签退。还没到的班次只在「全部」里，不算未值班。</p>
    <el-table v-loading="resultState === 'loading'" :data="filteredRows" :empty-text="tableEmptyText" class="table">
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="sdut_id" label="学号" />
      <el-table-column prop="department" label="部门" />
      <el-table-column label="值班时间">
        <template #default="scope">{{ formatSlot(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="类别" min-width="140">
        <template #default="scope">{{ dutyStatusGroupText(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="状态" min-width="160">
        <template #default="scope">
          <dutyStatusDots :status="scope.row.status" :flags="scope.row.flags || []" :source="scope.row.source" show-label />
        </template>
      </el-table-column>
    </el-table>
    <p v-if="resultState === 'empty' || resultState === 'fail'" class="state-text" :class="{ fail: resultState === 'fail' }">{{ resultMessage }}</p>
  </div>
</template>

<style scoped>

.page {
  width: 86%;
  margin: 24px auto 40px;
}
.title {
  text-align: center;
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin: 18px 0;
}
.toolbar :deep(.el-input) {
  width: 220px;
}
.query-bar {
  flex-wrap: wrap;
}
.department-select {
  width: 220px;
}
.toolbar :deep(.el-date-editor) {
  flex: 0 1 320px;
  width: 320px;
  max-width: 100%;
}
.table {
  width: 100%;
}
.btn {
  padding: 8px 18px;
  border: 3px solid #008aff;
  border-radius: 10px;
  color: #008aff;
  background: #fff;
  font-weight: 700;
  font-size: inherit;
  white-space: nowrap;
  cursor: pointer;
}
.btn:hover {
  color: #fff;
  background: #008aff;
}
.btn.active {
  color: #fff;
  background: #008aff;
}
.status-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0 0 8px;
}
.status-label {
  color: #008aff;
  font-weight: 700;
}
.count {
  margin-left: 6px;
}
.hint {
  margin: 0 0 16px;
  text-align: center;
  color: #666;
  font-size: 13px;
}
.state-text {
  text-align: center;
  color: #666;
}
.state-text.fail {
  color: #c0392b;
}
@media only screen and (max-width: 768px) {
  .page {
    width: 98%;
  }
  .toolbar {
    flex-direction: column;
  }
  .toolbar :deep(.el-input) {
    width: 100%;
  }
  .department-select {
    width: 100%;
  }
  .toolbar :deep(.el-date-editor) {
    flex: none;
    width: 100%;
  }
  .query-bar {
    flex-wrap: wrap;
  }
}
</style>
