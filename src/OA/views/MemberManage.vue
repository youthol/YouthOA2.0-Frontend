<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import modifyMemberInfo from '../components/modifyMemberInfo.vue'
import addNewYoutholer from '../components/addNewYoutholer.vue'
import importOldMembers from '../components/importOldMembers.vue'
import dutyScheduleTables from '../components/dutyScheduleTables.vue'
import { departmentFilter } from 'assets/js/filter.js'
import { formatDutyOption } from 'assets/js/dutyFrame.js'
import {
  getAllYoutholer as fetchAllYoutholer,
  getSemesterCatalog,
  setCurrentSemester,
  setSemesterDutyRange,
  initPassword
} from 'assets/js/oaApi.js'

let tableRef = ref()
let tableData = reactive([])
let modifyDrawer = ref(false)
let addMemberDrawer = ref(false)
let importDrawer = ref(false)
let loading = ref(true)
let savingSemester = ref(false)
let switchingSemester = ref(false)
const catalog = ref([])
const currentSemesterId = ref('')
let semester = reactive({
  start_date: '',
  end_date: ''
})
const currentSemester = computed(() => catalog.value.find((item) => item.id === currentSemesterId.value) || null)
const datesDirty = computed(() => {
  const item = currentSemester.value
  if (!item || !semester.start_date || !semester.end_date) return false
  return semester.start_date !== item.default_start || semester.end_date !== item.default_end
})
const semesterReady = computed(
  () =>
    !!currentSemesterId.value &&
    !!semester.start_date &&
    !!semester.end_date &&
    semester.start_date <= semester.end_date
)
let editInfo = reactive({
  sdut_id: 0,
  name: '',
  department: '',
  identity: '',
  duty: []
})
const formatter = (data) => {
  let duty_list = data.duty || []
  return duty_list
    .map((item) => formatDutyOption(item))
    .filter(Boolean)
    .join('；')
}
const filterHandler = (value, row, column) => {
  const property = column['property']
  return row[property] === value
}
const filterDutyHandler = (value, row, column) => {
  const property = column['property']
  let duty = row[property] || []
  for (let i = 0; i < duty.length; i++) {
    if (duty[i].day == value) {
      return true
    }
  }
  return false
}

function getAllYoutholer() {
  loading.value = true
  fetchAllYoutholer()
    .then((res) => {
      let data = res.data || []
      tableData.length = 0
      for (let i = 0; i < data.length; i++) {
        tableData.push({
          sdut_id: data[i].sdut_id,
          unique_id: data[i].sdut_id + data[i].department,
          name: data[i].name,
          department: data[i].department,
          identity: data[i].identity,
          duty: data[i].duty
        })
      }
      loading.value = false
    })
    .catch(function (error) {
      console.log(error)
      errorAlert('获取成员信息失败')
      loading.value = false
    })
}

function applySemesterDates(item, useActual) {
  if (!item) {
    semester.start_date = ''
    semester.end_date = ''
    return
  }
  if (useActual && (item.semester_start || item.duty_end)) {
    semester.start_date = item.semester_start || item.default_start || ''
    semester.end_date = item.duty_end || item.default_end || ''
    return
  }
  semester.start_date = item.default_start || ''
  semester.end_date = item.default_end || ''
}

function patchCatalogItem(item) {
  if (!item?.id) return
  const index = catalog.value.findIndex((row) => row.id === item.id)
  if (index >= 0) {
    catalog.value[index] = { ...catalog.value[index], ...item }
  }
  catalog.value.forEach((row) => {
    row.is_current = row.id === item.id
  })
}

function loadSemester() {
  getSemesterCatalog()
    .then((res) => {
      const list = res.data?.list || res.data || []
      catalog.value = Array.isArray(list) ? list : []
      const current = catalog.value.find((item) => item.is_current) || catalog.value[0] || null
      currentSemesterId.value = current?.id || ''
      applySemesterDates(current, true)
    })
    .catch((err) => {
      errorAlert(err.message || '获取学期配置失败')
    })
}

function onSemesterChange(id) {
  if (!id) return
  switchingSemester.value = true
  setCurrentSemester({ semester_id: id })
    .then((res) => {
      switchingSemester.value = false
      const item = res.data || catalog.value.find((row) => row.id === id)
      patchCatalogItem(item)
      applySemesterDates(catalog.value.find((row) => row.id === id), false)
      ElMessage.info('可按实际情况修改')
    })
    .catch((err) => {
      switchingSemester.value = false
      const current = catalog.value.find((item) => item.is_current)
      currentSemesterId.value = current?.id || ''
      errorAlert(err.message || '切换学期失败')
    })
}

function saveSemester() {
  if (savingSemester.value) return
  if (!currentSemesterId.value) {
    errorAlert('请选择学年学期')
    return
  }
  if (!semester.start_date || !semester.end_date) {
    errorAlert('请选择学期开始日期和值班截止日')
    return
  }
  if (semester.start_date > semester.end_date) {
    errorAlert('截止日期不能早于开始日期')
    return
  }
  savingSemester.value = true
  setSemesterDutyRange({
    semester_id: currentSemesterId.value,
    start_date: semester.start_date,
    end_date: semester.end_date
  })
    .then((res) => {
      savingSemester.value = false
      const item = { ...(res.data || {}) }
      delete item.created
      patchCatalogItem(item)
      successAlert('学期值班区间已保存，将按新区间补齐班次，对全部值班成员生效')
    })
    .catch((err) => {
      savingSemester.value = false
      errorAlert(err.message || '保存失败')
    })
}

function guardSemesterAction(action) {
  if (!semesterReady.value) {
    errorAlert('请先选择学年学期并保存有效日期')
    return
  }
  action()
}

const editMember = (index, row) => {
  editInfo.sdut_id = row.sdut_id
  editInfo.department = row.department
  editInfo.name = row.name
  editInfo.identity = row.identity
  let duty_list = []
  for (let i = 0; i < (row.duty || []).length; i++) {
    duty_list.push({ day: row.duty[i].day, frame: row.duty[i].frame })
  }
  while (duty_list.length < 2) {
    duty_list.push({ day: '0', frame: '0' })
  }
  editInfo.duty = duty_list
  displayMemberEdit(true)
}

function displayMemberEdit(res) {
  modifyDrawer.value = res
}

function displayMemberAdd(res) {
  addMemberDrawer.value = res
}

function addOneYouthol() {
  displayMemberAdd(true)
}

const resetPassword = (row) => {
  ElMessageBox.confirm(`确认要重置 ${row.name}（${row.sdut_id}）的密码吗？`, '重置密码', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => {
      initPassword(row.sdut_id)
        .then(() => {
          ElMessage({
            type: 'success',
            message: '密码已经被重置为youthol'
          })
        })
        .catch((error) => {
          console.log(error)
          errorAlert('重置密码失败')
        })
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: '已取消重置'
      })
    })
}

onMounted(() => {
  loadSemester()
  getAllYoutholer()
})
</script>
<template>
  <div class="main-layout">
    <div class="options">
      <div class="semester-box">
        <el-select
          v-model="currentSemesterId"
          placeholder="学年学期"
          :loading="switchingSemester"
          class="semester-select"
          @change="onSemesterChange"
        >
          <el-option v-for="item in catalog" :key="item.id" :label="item.label" :value="item.id" />
        </el-select>
        <el-date-picker
          v-model="semester.start_date"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="学期开始日期"
        />
        <el-date-picker
          v-model="semester.end_date"
          type="date"
          value-format="YYYY-MM-DD"
          placeholder="值班截止日"
        />
        <span v-if="datesDirty" class="dirty-tag">已手改</span>
        <div class="add-btn" :class="{ disabled: savingSemester || !semesterReady }" @click="saveSemester">保存学期</div>
      </div>
      <div class="action-box">
        <div class="add-btn" :class="{ disabled: !semesterReady }" @click="guardSemesterAction(addOneYouthol)">添加新成员</div>
        <div class="add-btn" :class="{ disabled: !semesterReady }" @click="guardSemesterAction(() => (importDrawer = true))">导入老成员</div>
      </div>
    </div>
    <p class="semester-hint">选中学年学期后会填入默认起止日，可按实际情况修改；保存后的实际日期对当前学期全体值班成员生效。</p>

    <el-table
      ref="tableRef"
      class="table"
      row-key="unique_id"
      v-loading="loading"
      :data="tableData"
      size="large"
    >
      <el-table-column align="center" prop="name" label="姓名" sortable />
      <el-table-column align="center" prop="sdut_id" label="学号" sortable />
      <el-table-column
        align="center"
        prop="department"
        label="部门"
        :filters="departmentFilter"
        :filter-method="filterHandler"
        sortable
      />
      <el-table-column
        align="center"
        prop="identity"
        label="类别"
        :filters="[
          { text: '试用', value: '试用' },
          { text: '正式', value: '正式' },
          { text: '管理员', value: '管理员' }
        ]"
        :filter-method="filterHandler"
        sortable
      />
      <el-table-column
        align="center"
        prop="duty"
        label="值班安排"
        :formatter="formatter"
        :filters="[
          { text: '周一', value: '1' },
          { text: '周二', value: '2' },
          { text: '周三', value: '3' },
          { text: '周四', value: '4' },
          { text: '周五', value: '5' },
          { text: '周六', value: '6' },
          { text: '周日', value: '7' }
        ]"
        :filter-method="filterDutyHandler"
      />
      <el-table-column align="center" prop="option" label="操作" width="220">
        <template #default="scope">
          <el-button @click="editMember(scope.$index, scope.row)">编辑</el-button>
          <el-button type="warning" plain @click="resetPassword(scope.row)">重置密码</el-button>
        </template>
      </el-table-column>
    </el-table>

    <dutyScheduleTables />

    <modifyMemberInfo
      @displayMemberEdit="displayMemberEdit"
      @getInfo="getAllYoutholer"
      :drawer="modifyDrawer"
      :info="editInfo"
    ></modifyMemberInfo>

    <addNewYoutholer
      @displayMemberAdd="displayMemberAdd"
      @getInfo="getAllYoutholer"
      :drawer="addMemberDrawer"
    >
    </addNewYoutholer>

    <importOldMembers
      :drawer="importDrawer"
      @displayImport="(val) => (importDrawer = val)"
      @imported="getAllYoutholer"
    />

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
.table {
  width: 80%;
}
.semester-hint {
  width: 80%;
  margin: 0 0 12px;
  color: #666;
  font-size: 13px;
}
.options {
  width: 80%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.semester-box,
.action-box {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.semester-select {
  width: 240px;
}
.dirty-tag {
  font-size: 13px;
  color: #d48806;
  background: #fff7e6;
  border: 1px solid #ffd591;
  border-radius: 6px;
  padding: 4px 8px;
  white-space: nowrap;
}

.add-btn {
  font-size: 18px;
  margin: 10px 0;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 700;
  color: #008aff;
  background-color: white;
  border: 3px #008aff solid;
  cursor: pointer;
}

.add-btn:hover {
  color: white;
  background-color: #008aff;
}
.add-btn.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}
.add-btn.disabled:hover {
  color: #008aff;
  background-color: white;
}
@media only screen and (max-width: 768px) {
  .table,
  .options,
  .semester-hint {
    width: 90%;
  }
  .options {
    flex-direction: column;
  }
}
</style>
