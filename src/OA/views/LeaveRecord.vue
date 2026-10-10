<script setup>
import { less768 } from 'assets/js/screen'
import { ref, onMounted } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { WEEKDAY_SHORT } from 'assets/js/dutyFrame.js'
import { getLeaveRecords, listFrom } from 'assets/js/oaApi.js'
import { departmentFilter } from 'assets/js/filter.js'

const FRAME_PERIOD = {
  1: '一二节（8：00~9：40）',
  2: '三四节（10：05~11：45）',
  3: '五六节（14：00~15：40）',
  4: '七八节（16：05~17：45）',
  5: '九十节（19：00~20：40）'
}

const tableData = ref([])
const dateRange = ref('')
const loading = ref(false)
const _date_picker_size = ref('large')
const _table_size = ref('large')

const filterHandler = (value, row, column) => row[column.property] === value

const shortcuts = [
  {
    text: '今天',
    value: () => {
      const day = new Date()
      return [day, day]
    }
  },
  {
    text: '过去一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 6)
      return [start, end]
    }
  },
  {
    text: '过去一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 29)
      return [start, end]
    }
  }
]

function query() {
  if (!dateRange.value || !dateRange.value[0] || !dateRange.value[1]) {
    errorAlert('请选择时间')
    return
  }
  loading.value = true
  getLeaveRecords({
    start_time: dateRange.value[0],
    end_time: dateRange.value[1]
  })
    .then((res) => {
      tableData.value = listFrom(res)
      loading.value = false
      successAlert('共找到' + tableData.value.length + '条请假记录')
    })
    .catch((err) => {
      loading.value = false
      errorAlert(err.message || '获取请假记录失败')
    })
}

function reasonText(row) {
  const reason = row?.reason || ''
  const detail = String(row?.reason_detail || '').trim()
  if (reason === '其他' && detail) return `其他（${detail}）`
  return reason
}

function slotLabel(slot) {
  if (!slot?.date) return { date: '', period: '' }
  const [year, month, day] = String(slot.date).split('-')
  if (!year || !month || !day) return { date: '', period: '' }
  const date = new Date(`${slot.date}T00:00:00`)
  const weekdayIndex = Number(slot.weekday) || ((date.getDay() + 6) % 7) + 1
  const weekday = WEEKDAY_SHORT[weekdayIndex] || ''
  return {
    date: `${Number(year)}/${Number(month)}/${Number(day)}（周${weekday}）`,
    period: FRAME_PERIOD[Number(slot.frame)] || ''
  }
}

onMounted(() => {
  if (less768()) {
    _date_picker_size.value = 'small'
    _table_size.value = 'small'
  }
})
</script>
<template>
  <div class="main-layout">
    <div class="options">
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        unlink-panels
        range-separator="到"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        value-format="YYYY-MM-DD"
        :size="_date_picker_size"
        :shortcuts="shortcuts"
      />
      <div class="btn" @click="query">查询</div>
    </div>
    <el-divider />
    <el-table class="table" :data="tableData" v-loading="loading" :size="_table_size">
      <el-table-column prop="name" label="姓名" sortable />
      <el-table-column prop="sdut_id" label="学号" sortable />
      <el-table-column
        prop="department"
        label="部门"
        :filters="departmentFilter"
        :filter-method="filterHandler"
        sortable
      />
      <el-table-column label="原始值班时间" min-width="180">
        <template #default="scope">
          <div class="slot-time">
            <span>{{ slotLabel(scope.row.original).date }}</span>
            <span>{{ slotLabel(scope.row.original).period }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="补班时间" min-width="180">
        <template #default="scope">
          <div class="slot-time">
            <span>{{ slotLabel(scope.row.makeup).date }}</span>
            <span>{{ slotLabel(scope.row.makeup).period }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="请假原因" min-width="160">
        <template #default="scope">
          <span>{{ reasonText(scope.row) }}</span>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style scoped>
.main-layout {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.options {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
}
.table {
  width: 80%;
}
.slot-time {
  display: flex;
  flex-direction: column;
  line-height: 1.5;
}
.btn {
  font-size: 20px;
  padding: 8px 20px;
  border-radius: 10px;
  font-weight: 700;
  color: #008aff;
  background-color: white;
  border: 3px #008aff solid;
  cursor: pointer;
}
.btn:hover {
  color: white;
  background-color: #008aff;
}
@media only screen and (max-width: 768px) {
  .table {
    width: 98%;
  }
  .options {
    flex-direction: column;
  }
}
</style>
