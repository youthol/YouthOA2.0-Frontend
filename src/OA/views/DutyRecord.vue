<script setup>
import { http } from 'assets/js/http'
import { getDutyStatusInRange, useMock } from 'assets/js/oaApi.js'
import { combineDateTime } from 'assets/js/datetime.js'
import { formatScheduleLine } from 'assets/js/dutyFrame.js'
import dutyStatusDots from '../components/dutyStatusDots.vue'
import { less768 } from 'assets/js/screen'
import { ref, reactive, onMounted } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { departmentFilter, identityFilter } from 'assets/js/filter.js'

const tableRef = ref()

let tableData = reactive([])
let dateRange = ref(null)
let loading = ref(false)

const filterHandler = (value, row, column) => {
  const property = column['property']
  return row[property] === value
}

function fillLegacy(data) {
  tableData.length = 0
  for (let i = 0; i < data.length; i++) {
    tableData.push({
      sdut_id: data[i].sdut_id,
      unique_id: data[i].sdut_id + data[i].department,
      name: data[i].name,
      department: data[i].department,
      identity: data[i].identity,
      total_time: (data[i].total_time / 3600).toFixed(2),
      absence: data[i].absence,
      leave: data[i].leave,
      date: '',
      start_time: '',
      status: data[i].absence ? 'absent' : 'normal',
      flags: [],
      legacy: true
    })
  }
}

function fillSlots(data) {
  tableData.length = 0
  for (let i = 0; i < data.length; i++) {
    tableData.push({
      ...data[i],
      unique_id: data[i].id || data[i].sdut_id + data[i].date + data[i].start_time,
      legacy: false
    })
  }
}

function getDutyInfo() {
  if (loading.value == true) {
    errorAlert('正在获取数据，请稍后')
    return
  }

  if (
    dateRange.value == null ||
    !Array.isArray(dateRange.value) ||
    dateRange.value.length < 2 ||
    dateRange.value[0] == null ||
    dateRange.value[1] == null
  ) {
    errorAlert('请选择时间')
    return
  }

  loading.value = true
  getDutyStatusInRange({
    start_time: dateRange.value[0],
    end_time: dateRange.value[1]
  })
    .then((res) => {
      fillSlots(res.data || [])
      successAlert('共找到' + tableData.length + '条值班信息')
      loading.value = false
    })
    .catch(function (error) {
      if (useMock) {
        console.log(error)
        errorAlert('获取值班信息失败')
        loading.value = false
        return
      }
      http
        .post('/GetTotalDutyInRange/', {
          start_time: dateRange.value[0],
          end_time: dateRange.value[1]
        })
        .then((res) => {
          fillLegacy(res.data || [])
          successAlert('共找到' + tableData.length + '条值班信息')
          loading.value = false
        })
        .catch(function (legacyError) {
          console.log(legacyError)
          errorAlert('获取值班信息失败')
          loading.value = false
        })
    })
}

let _date_picker_size = ref('large')
let _table_size = ref('large')
onMounted(() => {
  // getAllYoutholer()
  if (less768()) {
    _date_picker_size.value = 'small'
    _table_size.value = 'small'
  }
})

const shortcuts = [
  {
    text: '今天',
    value: () => {
      const end = new Date()
      const start = new Date()
      // start.setTime(start.getTime() - 3600 * 1000 * 24 * 6)
      return [start, end]
    }
  },
  {
    text: '昨天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      end.setTime(end.getTime() - 3600 * 1000 * 24)
      return [start, end]
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
</script>
<template>
  <div class="main-layout">
    <div class="options">
      <div class="date-picker">
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
      </div>
      <div class="btn" @click="getDutyInfo">查询</div>
    </div>
    <el-divider />
    <el-table
      ref="tableRef"
      class="table"
      row-key="unique_id"
      key="unique_id"
      :data="tableData"
      v-loading="loading"
      :size="_table_size"
    >
      <el-table-column prop="name" label="姓名" sortable />
      <el-table-column prop="sdut_id" label="学号" sortable />
      <el-table-column
        prop="department"
        label="部门"
        :filters="departmentFilter"
        :filter-method="filterHandler"
        sortable
      />
      <el-table-column label="值班时间">
        <template #default="scope">
          {{ scope.row.legacy ? ('累计 ' + scope.row.total_time + ' 小时') : formatScheduleLine(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="完整时间">
        <template #default="scope">
          {{ scope.row.legacy ? '-' : combineDateTime(scope.row.date, scope.row.start_time) }}
        </template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="scope">
          <dutyStatusDots :status="scope.row.status" :flags="scope.row.flags || []" :source="scope.row.source" show-label />
        </template>
      </el-table-column>
      <el-table-column
        prop="identity"
        label="类别"
        :filters="identityFilter"
        :filter-method="filterHandler"
        sortable
      />
    </el-table>
  </div>
</template>

<style scoped>
.main-layout {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.options {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.btn {
  font-size: 20px;
  margin: 8px 20px;
  padding: 8px 20px;
  border-radius: 10px;
  font-weight: 700;
  color: #008aff;
  background-color: white;
  border: 3px #008aff solid;
}

.btn:hover {
  color: white;
  background-color: #008aff;
}
@media only screen and (min-width: 768px) {
  .table {
    width: 80%;
  }
}

@media only screen and (max-width: 768px) {
  .date-picker {
    margin: 20px 0;
  }

  .table {
    width: 98%;
  }
  .options {
    flex-direction: column;
  }
}
</style>
