<script setup>
import { less768 } from 'assets/js/screen'
import { ref, onMounted } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { formatDateTime, combineDateTime } from 'assets/js/datetime.js'
import { formatScheduleLine } from 'assets/js/dutyFrame.js'
import { getLeaveRecords } from 'assets/js/oaApi.js'
import { departmentFilter } from 'assets/js/filter.js'

const tableData = ref([])
const dateRange = ref('')
const loading = ref(false)
const detail = ref(null)
const detailVisible = ref(false)
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
      tableData.value = res.data || []
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

function openDetail(row) {
  detail.value = row
  detailVisible.value = true
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
      <el-table-column label="原始值班时间">
        <template #default="scope">{{ formatScheduleLine(scope.row.original) }}</template>
      </el-table-column>
      <el-table-column label="补班时间">
        <template #default="scope">{{ formatScheduleLine(scope.row.makeup) }}</template>
      </el-table-column>
      <el-table-column label="是否补班">
        <template #default="scope">{{ scope.row.has_makeup ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="请假原因" min-width="160">
        <template #default="scope">{{ reasonText(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="操作">
        <template #default="scope">
          <el-button type="primary" plain @click="openDetail(scope.row)">详情</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-drawer v-model="detailVisible" title="请假详情" size="40%">
      <div v-if="detail" class="detail">
        <p>姓名：{{ detail.name }}</p>
        <p>部门：{{ detail.department }}</p>
        <p>申请原因：{{ detail.reason }}</p>
        <p v-if="detail.reason === '其他'">具体原因：{{ detail.reason_detail || '未填写' }}</p>
        <p>申请时间：{{ formatDateTime(detail.apply_time) }}</p>
        <p>原值班时间：{{ formatScheduleLine(detail.original) }}</p>
        <p>原班次完整时间：{{ combineDateTime(detail.original?.date, detail.original?.start_time) }}</p>
        <p>补班时间：{{ formatScheduleLine(detail.makeup) }}</p>
        <p>补班完整时间：{{ combineDateTime(detail.makeup?.date, detail.makeup?.start_time) }}</p>
      </div>
    </el-drawer>
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
.detail p {
  line-height: 2;
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
