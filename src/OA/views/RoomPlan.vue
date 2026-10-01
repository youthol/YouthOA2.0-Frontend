<script setup>
import { ref, onMounted, reactive } from 'vue'
import { http } from 'assets/js/http'
import ExhibitRoomBorrow from '../components/exhibitRoomBorrow.vue'
import { useUserStore } from 'store/store.js'
import { errorAlert, successAlert } from 'assets/js/message.js'
import exhibitMyBorrowRecord from '../components/exhibitMyBorrowRecord.vue'

let userStore = useUserStore()

let borrowInfo = reactive({
  dateValue: null,
  startTime: null,
  endTime: null
})
let chartRef = ref()
let borrowFormRef = ref()
function hasValue(value) {
  return value != null && String(value).length > 0
}

function dateKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

function localAllowedDates() {
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const dates = []
  for (let offset = 0; offset < 14; offset += 1) {
    const day = new Date(today)
    day.setDate(today.getDate() + offset)
    dates.push(dateKey(day))
  }
  return dates
}

let allowedDates = ref(localAllowedDates())

function disableBorrowDate(date) {
  return !allowedDates.value.includes(dateKey(date))
}

function rowIndexForDate(isoDate) {
  const rows = roomBorrowData?.recent14Day?.data
  if (!Array.isArray(rows)) return -1
  const found = rows.findIndex((row) => row[1] === isoDate)
  if (found >= 0) return found
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const picked = new Date(`${isoDate}T00:00:00`)
  const offset = Math.round((picked.getTime() - today.getTime()) / 86400000)
  if (offset < 0 || offset > 13 || rows.length !== 14) return -1
  return 13 - offset
}

let roomBorrowData

function previewBorrow() {
  if (!hasValue(borrowInfo.dateValue) || !hasValue(borrowInfo.startTime) || !hasValue(borrowInfo.endTime)) {
    return
  }
  const index = rowIndexForDate(borrowInfo.dateValue)
  if (index < 0 || chartRef.value == null) return
  try {
    chartRef.value.add(index, borrowInfo.startTime, borrowInfo.endTime)
  } catch (err) {
    console.log(err)
  }
}

const verifyBorrowInfo = (rule, value, callback) => {
  previewBorrow()
  callback()
}
const rules = reactive({
  dateValue: [
    { required: true, validator: verifyBorrowInfo, message: '请选择借用日期', trigger: 'change' }
  ],
  startTime: [
    {
      required: true,
      validator: verifyBorrowInfo,
      message: '请选择借用开始时间',
      trigger: 'change'
    }
  ],
  endTime: [
    {
      required: true,
      validator: verifyBorrowInfo,
      message: '请选择借用结束时间',
      trigger: 'change'
    }
  ]
})

function GetRoomBorrow() {
  http
    .post('/GetRoomBorrow/', {})
    .then((res) => {
      roomBorrowData = res.data
      const rows = roomBorrowData?.recent14Day?.data
      const fromApi = Array.isArray(rows)
        ? rows.map((row) => row[1]).filter((value) => value != null && String(value).length > 0)
        : []
      if (fromApi.length) {
        allowedDates.value = fromApi
        return
      }
      allowedDates.value = localAllowedDates()
      errorAlert('获取可借日期失败')
    })
    .catch((err) => {
      console.log(err)
      allowedDates.value = localAllowedDates()
      errorAlert('获取可借日期失败')
    })
}

let applying = false
function applyRoom() {
  if (!hasValue(borrowInfo.dateValue) || !hasValue(borrowInfo.startTime) || !hasValue(borrowInfo.endTime)) {
    errorAlert('请完善信息')
    return
  }
  if (!allowedDates.value.includes(borrowInfo.dateValue)) {
    errorAlert('请选择借用日期')
    return
  }
  if (applying) {
    errorAlert('申请已提交，请稍后')
    return
  }
  applying = true
  http
    .post('/ApplyRoomBorrow/', {
      borrow_date: borrowInfo.dateValue,
      start_time: borrowInfo.startTime,
      end_time: borrowInfo.endTime,
      people: userStore.department,
      room_id: '302'
    })
    .then((res) => {
      applying = false
      if (res.data == 'success') {
        successAlert('借用成功')
        chartRef.value?.GetNewData()
      } else if (res.data == 'busy') {
        errorAlert('借用失败')
      } else {
        errorAlert('未知错误')
      }
    })
    .catch(() => {
      applying = false
      errorAlert('借用失败')
    })
}

onMounted(() => {
  GetRoomBorrow()
})

let borrowRecordDrawer = ref(false)

function displayBorrowRecord(res) {
  borrowRecordDrawer.value = res
}

function openMyBorrowRecord() {
  displayBorrowRecord(true)
}
</script>
<template>
  <div class="options">
    <el-form
      class="date-picker"
      ref="borrowFormRef"
      :rules="rules"
      label-position="left"
      :model="borrowInfo"
      style="max-width: 860px"
    >
      <el-form-item prop="dateValue" label="借用日期" class="form-item">
        <el-date-picker
          v-model="borrowInfo.dateValue"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="选择借用日期"
          :disabled-date="disableBorrowDate"
          clearable
        />
      </el-form-item>
      <el-form-item prop="startTime" label="借用开始时间" class="form-item">
        <el-time-select
          v-model="borrowInfo.startTime"
          :max-time="borrowInfo.endTime"
          class="mr-4"
          placeholder="Start time"
          start="08:00"
          step="00:30"
          end="22:00"
        />
      </el-form-item>
      <el-form-item prop="endTime" label="借用结束时间" class="form-item">
        <el-time-select
          v-model="borrowInfo.endTime"
          :min-time="borrowInfo.startTime"
          placeholder="End time"
          start="08:00"
          step="00:30"
          end="22:00"
        />
      </el-form-item>
    </el-form>
    <div class="btn" @click="applyRoom">借用</div>
    <div class="btn" @click="openMyBorrowRecord">我的记录</div>
  </div>
  <ExhibitRoomBorrow ref="chartRef"></ExhibitRoomBorrow>

  <exhibitMyBorrowRecord
    v-if="borrowRecordDrawer"
    @displayBorrowRecord="displayBorrowRecord"
    :drawer="borrowRecordDrawer"
  >
  </exhibitMyBorrowRecord>
</template>

<style scoped>
.box {
  width: 100%;
  height: 100px;
}
.options {
  width: 100%;
  display: flex;
  /* flex-direction: column; */
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
.date-picker {
  width: 100%;
  display: flex;
  /* flex-direction: column; */
  justify-content: center;
  align-items: center;
}
.form-item {
  margin: 10px;
}

@media only screen and (max-width: 768px) {
  .date-picker {
    margin: 20px 0;
    flex-direction: column;
  }
  .options {
    flex-direction: column;
  }
}
</style>
