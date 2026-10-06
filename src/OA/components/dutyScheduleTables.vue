<script setup>
import { ref } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { combineDateTime } from 'assets/js/datetime.js'
import { formatScheduleLine as formatSlot } from 'assets/js/dutyFrame.js'
import { getMemberSemesterDuty, getDaySemesterDuty, listFrom } from 'assets/js/oaApi.js'
import dutyStatusDots from './dutyStatusDots.vue'

const memberKeyword = ref('')
const dayValue = ref('')
const memberRows = ref([])
const dayRows = ref([])
const memberState = ref('idle')
const dayState = ref('idle')

function queryMember() {
  if (!memberKeyword.value.trim()) {
    errorAlert('请输入成员姓名或学号')
    return
  }
  memberState.value = 'loading'
  getMemberSemesterDuty({ keyword: memberKeyword.value.trim() })
    .then((res) => {
      memberRows.value = listFrom(res)
      memberState.value = memberRows.value.length ? 'ok' : 'empty'
      if (memberRows.value.length) successAlert(`共找到 ${memberRows.value.length} 条排班`)
    })
    .catch((err) => {
      memberState.value = 'fail'
      errorAlert(err.message || '查询失败')
    })
}

function queryDay() {
  if (!dayValue.value) {
    errorAlert('请选择日期')
    return
  }
  dayState.value = 'loading'
  getDaySemesterDuty({ date: dayValue.value })
    .then((res) => {
      dayRows.value = listFrom(res)
      dayState.value = dayRows.value.length ? 'ok' : 'empty'
      if (dayRows.value.length) successAlert(`当天共 ${dayRows.value.length} 人值班`)
    })
    .catch((err) => {
      dayState.value = 'fail'
      errorAlert(err.message || '查询失败')
    })
}

function line(row) {
  return formatSlot(row)
}
</script>
<template>
  <div class="schedule-box">
    <h3 class="title">排班查询</h3>
    <div class="query-row">
      <el-input v-model="memberKeyword" placeholder="搜某成员（姓名或学号）" class="query-input" />
      <div class="btn" @click="queryMember">按人查询</div>
    </div>
    <el-table :data="memberRows" v-loading="memberState === 'loading'" empty-text="暂无数据" class="table">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="sdut_id" label="学号" />
      <el-table-column prop="department" label="部门" />
      <el-table-column label="值班时间">
        <template #default="scope">{{ line(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="完整时间">
        <template #default="scope">{{ combineDateTime(scope.row.date, scope.row.start_time) }}</template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="scope">
          <dutyStatusDots :status="scope.row.status" :flags="scope.row.flags" :source="scope.row.source" show-label />
        </template>
      </el-table-column>
    </el-table>
    <p v-if="memberState === 'empty'" class="state-text">未找到该成员本学期排班</p>
    <p v-if="memberState === 'fail'" class="state-text fail">查询失败，请稍后重试</p>

    <div class="query-row">
      <el-date-picker v-model="dayValue" type="date" value-format="YYYY-MM-DD" placeholder="查看某日所有成员" />
      <div class="btn" @click="queryDay">按日查询</div>
    </div>
    <el-table :data="dayRows" v-loading="dayState === 'loading'" empty-text="暂无数据" class="table">
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="sdut_id" label="学号" />
      <el-table-column prop="department" label="部门" />
      <el-table-column label="值班时间">
        <template #default="scope">{{ line(scope.row) }}</template>
      </el-table-column>
      <el-table-column label="完整时间">
        <template #default="scope">{{ combineDateTime(scope.row.date, scope.row.start_time) }}</template>
      </el-table-column>
      <el-table-column label="状态">
        <template #default="scope">
          <dutyStatusDots :status="scope.row.status" :flags="scope.row.flags" :source="scope.row.source" show-label />
        </template>
      </el-table-column>
    </el-table>
    <p v-if="dayState === 'empty'" class="state-text">当天没有排班</p>
    <p v-if="dayState === 'fail'" class="state-text fail">查询失败，请稍后重试</p>
  </div>
</template>

<style scoped>
.schedule-box {
  width: 80%;
  margin: 24px 0 40px;
}
.title {
  width: 100%;
  text-align: center;
  margin-bottom: 12px;
}
.query-row {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  margin: 16px 0;
}
.query-input {
  max-width: 280px;
}
.table {
  width: 100%;
}
.btn {
  font-size: 16px;
  padding: 8px 18px;
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
.state-text {
  text-align: center;
  color: #666;
}
.state-text.fail {
  color: #c0392b;
}
@media only screen and (max-width: 768px) {
  .schedule-box {
    width: 98%;
  }
  .query-row {
    flex-direction: column;
  }
}
</style>
