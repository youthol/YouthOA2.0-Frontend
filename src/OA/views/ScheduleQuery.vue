<script setup>
import { ref, computed, onMounted } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { combineDateTime } from 'assets/js/datetime.js'
import { WEEKDAY_LABEL, formatScheduleLine as formatSlot } from 'assets/js/dutyFrame.js'
import { getDutyStatusInRange, getDaySemesterDuty, getMemberSemesterDuty, getSemesterDutyRange, listFrom, objectFrom } from 'assets/js/oaApi.js'
import dutyStatusDots from '../components/dutyStatusDots.vue'

const range = ref([])
const rows = ref([])
const keyword = ref('')
const personKeyword = ref('')
const personRows = ref([])
const personState = ref('idle')
const exportDate = ref('')
const state = ref('loading')
const exporting = ref(false)

const filteredRows = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return rows.value
  return rows.value.filter(
    (row) => row.name.toLowerCase().includes(text) || String(row.sdut_id).toLowerCase().includes(text)
  )
})

function memberErrorText(err) {
  const code = err?.response?.data?.error
  if (code === 'MEMBER_NOT_FOUND') return '成员不存在'
  if (code === 'SEMESTER_NOT_CONFIGURED') return '当前学期未配置'
  if (code === 'FORBIDDEN') return '没有权限'
  return err?.message || '按人查询失败'
}

function queryPerson() {
  const keyword = personKeyword.value.trim()
  if (!keyword) {
    errorAlert('请输入姓名或学号')
    return
  }
  personState.value = 'loading'
  getMemberSemesterDuty({ keyword })
    .then((res) => {
      personRows.value = listFrom(res)
      personState.value = personRows.value.length ? 'ok' : 'empty'
      if (personRows.value.length) successAlert(`共找到 ${personRows.value.length} 条有效排班`)
    })
    .catch((err) => {
      personRows.value = []
      personState.value = 'fail'
      errorAlert(memberErrorText(err))
    })
}

function loadSemesterSchedule() {
  state.value = 'loading'
  getSemesterDutyRange()
    .then((semester) => {
      const semesterInfo = objectFrom(semester)
      const start = semesterInfo.semester_start || semesterInfo.default_start || semesterInfo.start_date
      const end = semesterInfo.duty_end || semesterInfo.default_end || semesterInfo.end_date
      range.value = start && end ? [start, end] : []
      if (!start || !end) {
        rows.value = []
        state.value = 'empty'
        return null
      }
      return getDutyStatusInRange({ start_date: `${start} 00:00:00`, end_date: `${end} 23:59:59` })
    })
    .then((res) => {
      if (!res) return
      rows.value = listFrom(res).sort(
        (a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time) || String(a.sdut_id).localeCompare(String(b.sdut_id))
      )
      state.value = rows.value.length ? 'ok' : 'empty'
    })
    .catch((err) => {
      state.value = 'fail'
      errorAlert(err.message || '查询排班失败')
    })
}


const FRAME_PERIOD = {
  1: '一二节（8：00~9：40）',
  2: '三四节（10：05~11：45）',
  3: '五六节（14：00~15：40）',
  4: '七八节（16：05~17：45）',
  5: '九十节（19：00~20：40）'
}

function dutyDateLabel(row) {
  const [year, month, day] = String(row.date || '').split('-')
  if (!year || !month || !day) return row.date || ''
  const date = new Date(`${row.date}T00:00:00`)
  const weekday = WEEKDAY_LABEL[row.weekday] || WEEKDAY_LABEL[(((date.getDay() + 6) % 7) + 1)] || ''
  return `${Number(year)}/${Number(month)}/${Number(day)}（${weekday}）`
}

function periodLabel(row) {
  return FRAME_PERIOD[Number(row.frame)] || ''
}

function escapeCsv(value) {
  const text = String(value ?? '')
  return `"${text.replaceAll('"', '""')}"`
}

function downloadCsv(filename, content) {
  const blob = new Blob([`\ufeff${content}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function exportDayRoster() {
  if (!exportDate.value) {
    errorAlert('请选择导出日期')
    return
  }
  exporting.value = true
  getDaySemesterDuty({ date: exportDate.value })
    .then((res) => {
      const dayRows = res.data || []
      if (!dayRows.length) {
        errorAlert('当天没有值班人员')
        return
      }
      const header = ['姓名', '学号', '部门', '值班日期', '节次']
      const body = dayRows.map((row) => [
        row.name,
        row.sdut_id,
        row.department,
        dutyDateLabel(row),
        periodLabel(row)
      ])
      const csv = [header, ...body].map((item) => item.map(escapeCsv).join(',')).join('\r\n')
      downloadCsv(`值班名单-${exportDate.value}.csv`, csv)
      successAlert(`已导出 ${dayRows.length} 名值班人员`)
    })
    .catch((err) => {
      errorAlert(err.message || '导出失败')
    })
    .finally(() => {
      exporting.value = false
    })
}

onMounted(loadSemesterSchedule)
</script>

<template>
  <div class="page">
    <h2 class="title">排班查询</h2>
    <div class="toolbar">
      <el-input v-model="personKeyword" placeholder="按人查询：姓名或学号" clearable @keyup.enter="queryPerson" />
      <div class="btn" @click="queryPerson">按人查询</div>
    </div>
    <el-table v-loading="personState === 'loading'" :data="personRows" empty-text="输入姓名或学号后查询" class="table">
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="sdut_id" label="学号" />
      <el-table-column prop="department" label="部门" />
      <el-table-column label="值班时间">
        <template #default="scope">{{ formatSlot(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="状态" min-width="160">
        <template #default="scope">
          <dutyStatusDots :status="scope.row.status" :flags="scope.row.flags || []" :source="scope.row.source" show-label />
        </template>
      </el-table-column>
    </el-table>
    <p v-if="personState === 'empty'" class="state-text">该成员本学期没有有效排班</p>
    <p v-if="personState === 'fail'" class="state-text fail">按人查询失败，请稍后重试</p>
    <div class="toolbar">
      <el-input v-model="keyword" placeholder="按姓名或学号快速定位" clearable />
      <el-date-picker v-model="exportDate" type="date" value-format="YYYY-MM-DD" placeholder="选择导出日期" />
      <div class="btn" :class="{ disabled: exporting }" @click="exporting ? null : exportDayRoster()">
        {{ exporting ? '导出中...' : '导出当天名单' }}
      </div>
    </div>
    <el-table v-loading="state === 'loading'" :data="filteredRows" empty-text="暂无排班" class="table">
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="sdut_id" label="学号" />
      <el-table-column prop="department" label="部门" />
      <el-table-column label="值班时间">
        <template #default="scope">{{ formatSlot(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="完整时间">
        <template #default="scope">{{ combineDateTime(scope.row.date, scope.row.start_time) }}</template>
      </el-table-column>
    </el-table>
    <p v-if="state === 'empty'" class="state-text">当前学期暂无排班</p>
    <p v-if="state === 'fail'" class="state-text fail">查询失败，请稍后重试</p>
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
  width: 280px;
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
  cursor: pointer;
}
.btn:hover {
  color: #fff;
  background: #008aff;
}
.btn.disabled {
  opacity: 0.6;
  cursor: not-allowed;
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
}
</style>
