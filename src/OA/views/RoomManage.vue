<script setup>
import { ref, onMounted, reactive } from 'vue'
import { less768 } from 'assets/js/screen'
import { http } from 'assets/js/http'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { departmentFilter } from 'assets/js/filter.js'

const tableRef = ref()

let tableData = reactive([])
let dateRange = ref(null)
let roomId = ref('')
let loading = ref(false)
let _date_picker_size = ref('large')
let _table_size = ref('large')

const filterHandler = (value, row, column) => {
  const property = column['property']
  return row[property] === value
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

  const room = String(roomId.value || '').trim()
  const payload = {
    start_time: dateRange.value[0],
    end_time: dateRange.value[1]
  }
  if (room) payload.room_id = room

  loading.value = true
  http
    .post('/GetRoomBorrowRecordInRange/', payload)
    .then((res) => {
      console.log(res)
      let data = res.data
      if (!Array.isArray(data)) data = []
      tableData.length = 0
      for (let i = 0; i < data.length; i++) {
        let item = {
          sdut_id: data[i].sdut_id,
          room_id: data[i].room_id,
          unique_id: data[i].sdut_id + data[i].room_id + data[i].borrow_date + data[i].start_time,
          name: data[i].name,
          department: data[i].department,
          apply_time: data[i].apply_time,
          borrow_date: data[i].borrow_date,
          start_time: data[i].start_time,
          end_time: data[i].end_time
        }
        tableData.push(item)
      }

      successAlert('共找到' + tableData.length + '条借用信息')
      loading.value = false
    })
    .catch(function (error) {
      console.log(error)
      errorAlert('获取借用信息失败')
      loading.value = false
    })
}

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
  },
  {
    text: '未来一周',
    value: () => {
      const start = new Date()
      const end = new Date()
      end.setTime(end.getTime() + 3600 * 1000 * 24 * 6) // 未来6天（包括今天）
      return [start, end]
    }
  },
  {
    text: '未来两周',
    value: () => {
      const start = new Date()
      const end = new Date()
      end.setTime(end.getTime() + 3600 * 1000 * 24 * 13) // 未来13天（包括今天）
      return [start, end]
    }
  }
]
</script>
<template>
  <div class="main-layout">
    <div class="options">
      <el-input
        v-model="roomId"
        class="room-input"
        placeholder="房间号，留空查全部"
        clearable
      />
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
      <el-table-column prop="room_id" label="房间号" sortable />
      <el-table-column prop="name" label="借用人" sortable />
      <el-table-column prop="sdut_id" label="学号" sortable />
      <el-table-column
        prop="department"
        label="部门"
        :filters="departmentFilter"
        :filter-method="filterHandler"
        sortable
      />

      <el-table-column prop="apply_time" label="申请时间" sortable />
      <el-table-column prop="borrow_date" label="借用日期" sortable />
      <el-table-column prop="start_time" label="开始时间" sortable />
      <el-table-column prop="end_time" label="结束时间" sortable />
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

.room-input {
  width: 220px;
  margin-right: 12px;
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
  .room-input,
  .date-picker {
    margin: 12px 0;
  }

  .table {
    width: 98%;
  }
  .options {
    flex-direction: column;
  }
}
</style>
