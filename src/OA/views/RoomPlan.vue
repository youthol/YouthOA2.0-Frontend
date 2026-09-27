<script setup>
import { ref, reactive } from 'vue'
import { http } from 'assets/js/http'
import ExhibitRoomBorrow from '../components/exhibitRoomBorrow.vue'
import { useUserStore } from 'store/store.js'
import { errorAlert, successAlert } from 'assets/js/message.js'
import exhibitMyBorrowRecord from '../components/exhibitMyBorrowRecord.vue'
import { BORROW_ROOM_ID, isBorrowDateAllowed, isEmptyValue, toIsoDate } from 'assets/js/roomBorrow'

let userStore = useUserStore()

let borrowInfo = reactive({
  dateValue: null,
  startTime: null,
  endTime: null
})
let chartRef = ref()
let borrowFormRef = ref()

const verifyBorrowInfo = (rule, value, callback) => {
  if (
    !isEmptyValue(borrowInfo.dateValue) &&
    !isEmptyValue(borrowInfo.startTime) &&
    !isEmptyValue(borrowInfo.endTime)
  ) {
    chartRef.value?.add(borrowInfo.dateValue, borrowInfo.startTime, borrowInfo.endTime)
  }
  callback()
}

function disabledBorrowDate(date) {
  return !isBorrowDateAllowed(toIsoDate(date))
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

let applying = false
function applyRoom() {
  if (
    isEmptyValue(borrowInfo.dateValue) ||
    isEmptyValue(borrowInfo.startTime) ||
    isEmptyValue(borrowInfo.endTime)
  ) {
    errorAlert('请完善信息')
    return
  }
  if (!isBorrowDateAllowed(borrowInfo.dateValue)) {
    errorAlert('日期超出可借用范围')
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
      room_id: BORROW_ROOM_ID
    })
    .then((res) => {
      applying = false
      if (res.data == 'success') {
        successAlert('借用成功')
      } else if (res.data == 'busy') {
        errorAlert('借用失败')
      } else if (typeof res.data == 'string' && res.data.length > 0) {
        errorAlert(res.data)
      } else {
        errorAlert('未知错误')
      }
    })
    .then(() => {
      chartRef.value?.GetNewData()
    })
    .catch(() => {
      applying = false
    })
}

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
          placeholder="选择日期"
          :disabled-date="disabledBorrowDate"
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
