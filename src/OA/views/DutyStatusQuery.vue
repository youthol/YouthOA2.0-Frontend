<script setup>
import { ref, computed } from 'vue'
import { errorAlert } from 'assets/js/message.js'
import { getDutyStatusInRange, listFrom } from 'assets/js/oaApi.js'
import dutyStatusDots from '../components/dutyStatusDots.vue'

const range = ref([])
const rows = ref([])
const state = ref('idle')
const keyword = ref('')

const defaultRange = computed(() => {
  if (range.value.length === 2) return range.value
  return []
})

const filteredRows = computed(() => {
  const text = keyword.value.trim().toLowerCase()
  if (!text) return rows.value
  return rows.value.filter(
    (row) => row.name.toLowerCase().includes(text) || String(row.sdut_id).toLowerCase().includes(text)
  )
})

function loadDutyStatus() {
  const [start, end] = defaultRange.value
  if (!start || !end) return
  state.value = 'loading'
      getDutyStatusInRange({ start_date: start, end_date: end })
    .then((res) => {
      rows.value = listFrom(res).sort(
        (a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time) || String(a.sdut_id).localeCompare(String(b.sdut_id))
      )
      state.value = rows.value.length ? 'ok' : 'empty'
    })
    .catch((err) => {
      state.value = 'fail'
      errorAlert(err.message || '查询值班情况失败')
    })
}
</script>

<template>
  <div class="page">
    <h2 class="title">值班情况查询</h2>
    <div class="toolbar">
      <el-date-picker
        v-model="range"
        type="daterange"
        value-format="YYYY-MM-DD"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        clearable
      />
      <el-input v-model="keyword" placeholder="按姓名或学号筛选" clearable />
      <div class="btn" @click="loadDutyStatus">查询</div>
    </div>
    <el-table
      v-loading="state === 'loading'"
      :data="filteredRows"
      empty-text="暂无值班情况"
      class="table"
    >
      <el-table-column prop="date" label="日期" width="120" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="sdut_id" label="学号" />
      <el-table-column prop="department" label="部门" />
      <el-table-column label="状态">
        <template #default="scope">
          <dutyStatusDots
            :status="scope.row.status"
            :flags="scope.row.flags"
            :source="scope.row.source"
            show-label
          />
        </template>
      </el-table-column>
    </el-table>
    <p v-if="state === 'empty'" class="state-text">所选时间没有值班安排</p>
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
  width: 260px;
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
