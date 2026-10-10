<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import modifyMemberInfo from '../components/modifyMemberInfo.vue'
import addNewYoutholer from '../components/addNewYoutholer.vue'
import importOldMembers from '../components/importOldMembers.vue'
import { departmentFilter, replaceDepartments } from 'assets/js/filter.js'
import { formatDutyOption } from 'assets/js/dutyFrame.js'
import {
  getAllYoutholer as fetchAllYoutholer,
  getSemesterCatalog,
  setCurrentSemester,
  setSemesterDutyRange,
  generateSemesterDuty,
  addAcademicYear,
  objectFrom,
  initPassword,
  getDepartments,
  addDepartment,
  deleteDepartment,
  listFrom
} from 'assets/js/oaApi.js'

let tableRef = ref()
let tableData = reactive([])
let modifyDrawer = ref(false)
let addMemberDrawer = ref(false)
let importDrawer = ref(false)
let loading = ref(true)
const activeTab = ref('members')
const departmentName = ref('')
const departmentLoading = ref(false)
const departmentSaving = ref(false)
let savingSemester = ref(false)
let switchingSemester = ref(false)
const addYearVisible = ref(false)
const addingYear = ref(false)
const yearForm = reactive({
  academic_year: '',
  term1_start: '',
  term1_end: '',
  term2_start: '',
  term2_end: ''
})
const catalog = ref([])
const currentSemesterId = ref('')
let semester = reactive({
  start_date: '',
  end_date: ''
})
const currentSemester = computed(
  () => catalog.value.find((item) => String(item.id) === String(currentSemesterId.value)) || null
)
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
  const property = column?.property || column?.['property']
  return String(row?.[property] ?? '').trim() === String(value ?? '').trim()
}
const filterDutyHandler = (value, row) => {
  const duty = Array.isArray(row?.duty) ? row.duty : []
  return duty.some((item) => String(item?.day) === String(value))
}
const departmentColumnFilters = computed(() =>
  departmentFilter.map((item) => ({ text: item.text, value: item.value }))
)
function clearMemberFilters() {
  nextTick(() => {
    tableRef.value?.clearFilter()
  })
}

function getAllYoutholer() {
  loading.value = true
  return fetchAllYoutholer()
    .then((res) => {
      const data = listFrom(res)
      tableData.splice(0, tableData.length)
      data.forEach((item) => {
        tableData.push({
          sdut_id: item.sdut_id,
          unique_id: String(item.sdut_id) + String(item.department || ''),
          name: item.name,
          department: item.department,
          identity: item.identity,
          duty: Array.isArray(item.duty) ? item.duty : []
        })
      })
      loading.value = false
    })
    .catch(function (error) {
      console.log(error)
      loading.value = false
      errorAlert('获取成员信息失败')
      return false
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

function patchCatalogItem(item, makeCurrent = false) {
  if (item?.id === undefined || item?.id === null || item?.id === '') return
  const index = catalog.value.findIndex((row) => String(row.id) === String(item.id))
  if (index >= 0) {
    const previous = catalog.value[index]
    catalog.value[index] = {
      ...previous,
      ...item,
      id: previous.id,
      is_current: makeCurrent ? true : previous.is_current
    }
  }
  if (makeCurrent) {
    catalog.value.forEach((row) => {
      row.is_current = String(row.id) === String(item.id)
    })
  }
}

function semesterListFrom(res) {
  const body = res?.data
  if (Array.isArray(body)) return body
  if (Array.isArray(body?.list)) return body.list
  if (Array.isArray(body?.data)) return body.data
  if (Array.isArray(body?.data?.list)) return body.data.list
  return []
}

function semesterItemFrom(res) {
  const body = res?.data
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null
  if (body.id) return body
  if (body.data && typeof body.data === 'object' && !Array.isArray(body.data) && body.data.id) return body.data
  return null
}

function loadSemester() {
  getSemesterCatalog()
    .then((res) => {
      const list = semesterListFrom(res)
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
  if (!id || switchingSemester.value) return
  const previousId = catalog.value.find((item) => item.is_current)?.id || ''
  switchingSemester.value = true
  setCurrentSemester({ semester_id: id })
    .then((res) => {
      const item = semesterItemFrom(res) || catalog.value.find((row) => String(row.id) === String(id))
      patchCatalogItem(item || { id }, true)
      applySemesterDates(catalog.value.find((row) => String(row.id) === String(id)), false)
      tableData.splice(0, tableData.length)
      clearMemberFilters()
      return getAllYoutholer()
    })
    .then((loaded) => {
      if (loaded === false) return
      ElMessage.info('可按实际情况修改')
    })
    .catch((err) => {
      const switched = catalog.value.some((row) => row.is_current && String(row.id) === String(id))
      if (!switched) {
        currentSemesterId.value = previousId
        clearMemberFilters()
      }
      errorAlert(err.message || '切换学期失败')
    })
    .finally(() => {
      switchingSemester.value = false
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
    semester_start: semester.start_date,
    duty_end: semester.end_date,
    start_date: semester.start_date,
    end_date: semester.end_date
  })
    .catch((err) => {
      if (err.code === 'SEMESTER_DATES_EXISTS') return null
      throw err
    })
    .then((res) => {
      if (res) {
        const item = { ...(semesterItemFrom(res) || {}) }
        delete item.created
        delete item.need_generate
        patchCatalogItem(item, false)
      }
      return generateSemesterDuty({ semester_id: currentSemesterId.value })
    })
    .then((res) => {
      savingSemester.value = false
      const created = Number(objectFrom(res).created_count || 0)
      successAlert(created > 0 ? `学期已保存，新生成 ${created} 条值班` : '学期已保存，没有需要新生成的班次')
    })
    .catch((err) => {
      savingSemester.value = false
      errorAlert(err.message || '保存失败')
    })
}


function parseAcademicYear(value) {
  const match = /^(\d{4})-(\d{4})$/.exec(String(value || '').trim())
  if (!match) return ''
  const start = Number(match[1])
  const end = Number(match[2])
  if (end !== start + 1) return ''
  return `${start}-${end}`
}

function shiftDateByYear(value, years = 1) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!match) return ''
  const year = Number(match[1]) + years
  const month = Number(match[2])
  const day = Number(match[3])
  const lastDay = new Date(year, month, 0).getDate()
  const safeDay = Math.min(day, lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`
}

function latestAcademicYear() {
  let best = ''
  let bestStart = -1
  catalog.value.forEach((item) => {
    const year = parseAcademicYear(item.academic_year)
    if (!year) return
    const start = Number(year.slice(0, 4))
    if (start > bestStart) {
      bestStart = start
      best = year
    }
  })
  return best
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA <= endB && startB <= endA
}

function effectiveRange(item) {
  const start = item?.semester_start || item?.default_start || ''
  const end = item?.duty_end || item?.default_end || ''
  if (!start || !end) return null
  return [start, end]
}

function sortCatalog() {
  catalog.value.sort((a, b) => {
    const yearCompare = String(a.academic_year || '').localeCompare(String(b.academic_year || ''))
    if (yearCompare) return yearCompare
    return Number(a.term) - Number(b.term)
  })
}

function openAddYear() {
  const latest = latestAcademicYear()
  const nextStart = latest ? Number(latest.slice(0, 4)) + 1 : new Date().getFullYear()
  const nextYear = `${nextStart}-${nextStart + 1}`
  const terms = catalog.value.filter((item) => item.academic_year === latest)
  const term1 = terms.find((item) => Number(item.term) === 1)
  const term2 = terms.find((item) => Number(item.term) === 2)
  yearForm.academic_year = nextYear
  yearForm.term1_start = shiftDateByYear(term1?.default_start)
  yearForm.term1_end = shiftDateByYear(term1?.default_end)
  yearForm.term2_start = shiftDateByYear(term2?.default_start)
  yearForm.term2_end = shiftDateByYear(term2?.default_end)
  if (!yearForm.term1_start || !yearForm.term1_end || !yearForm.term2_start || !yearForm.term2_end) {
    yearForm.term1_start = yearForm.term1_start || `${nextStart}-08-29`
    yearForm.term1_end = yearForm.term1_end || `${nextStart + 1}-01-17`
    yearForm.term2_start = yearForm.term2_start || `${nextStart + 1}-02-27`
    yearForm.term2_end = yearForm.term2_end || `${nextStart + 1}-07-18`
  }
  addYearVisible.value = true
}

function validateAcademicYearForm() {
  const year = parseAcademicYear(yearForm.academic_year)
  if (!year) return '学年须为连续两年，例如 2027-2028'
  if (catalog.value.some((item) => item.academic_year === year)) return '这个学年已经存在'
  const dates = [yearForm.term1_start, yearForm.term1_end, yearForm.term2_start, yearForm.term2_end]
  if (dates.some((value) => !/^\d{4}-\d{2}-\d{2}$/.test(value || ''))) return '请选择四个学期日期'
  if (yearForm.term1_end < yearForm.term1_start || yearForm.term2_end < yearForm.term2_start) {
    return '截止日期不能早于开始日期'
  }
  if (!(yearForm.term1_end < yearForm.term2_start)) return '第一学期结束日必须早于第二学期开始日'
  const ranges = [
    [yearForm.term1_start, yearForm.term1_end],
    [yearForm.term2_start, yearForm.term2_end]
  ]
  const overlapped = catalog.value.some((item) => {
    const other = effectiveRange(item)
    if (!other) return false
    return ranges.some(([start, end]) => rangesOverlap(start, end, other[0], other[1]))
  })
  if (overlapped) return '这个日期和另一个学期重叠，请改开'
  return ''
}

function createdYearItems(res) {
  const body = objectFrom(res)
  if (Array.isArray(body?.items)) return body.items
  return []
}

function submitAcademicYear() {
  if (addingYear.value) return
  const message = validateAcademicYearForm()
  if (message) {
    errorAlert(message)
    return
  }
  const selectedId = currentSemesterId.value
  addingYear.value = true
  addAcademicYear({
    academic_year: parseAcademicYear(yearForm.academic_year),
    term1_start: yearForm.term1_start,
    term1_end: yearForm.term1_end,
    term2_start: yearForm.term2_start,
    term2_end: yearForm.term2_end
  })
    .then((res) => {
      const items = createdYearItems(res)
      items.forEach((item) => {
        const index = catalog.value.findIndex((row) => String(row.id) === String(item.id))
        if (index >= 0) catalog.value[index] = { ...catalog.value[index], ...item, is_current: false }
        else catalog.value.push({ ...item, is_current: false })
      })
      sortCatalog()
      currentSemesterId.value = selectedId
      addYearVisible.value = false
      successAlert('已新增学年，当前学期没有切换')
    })
    .catch((err) => {
      errorAlert(err.message || '新增学年失败')
    })
    .finally(() => {
      addingYear.value = false
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

function departmentRows() {
  return departmentFilter.map((item) => ({ name: item.value }))
}

function loadDepartments() {
  departmentLoading.value = true
  getDepartments()
    .then((res) => {
      const names = listFrom(res)
        .map((item) => (typeof item === 'string' ? item : item?.name))
        .filter(Boolean)
      if (names.length) replaceDepartments(names)
      departmentLoading.value = false
    })
    .catch((err) => {
      departmentLoading.value = false
      errorAlert(err.message || '获取部门失败')
    })
}

function submitDepartment() {
  const name = departmentName.value.trim()
  if (departmentSaving.value) return
  if (!name) {
    errorAlert('请输入部门名称')
    return
  }
  if (name.length > 20) {
    errorAlert('部门名称不能超过20个字')
    return
  }
  departmentSaving.value = true
  addDepartment(name)
    .then(() => {
      departmentName.value = ''
      successAlert('已添加部门')
      return loadDepartments()
    })
    .catch((err) => {
      errorAlert(err.message || '添加部门失败')
    })
    .finally(() => {
      departmentSaving.value = false
    })
}

function removeDepartment(name) {
  ElMessageBox.confirm(`确定删除部门「${name}」？删除后不能再选这个部门。`, '删除部门', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
    .then(() => deleteDepartment(name))
    .then(() => {
      successAlert('已删除部门')
      return loadDepartments()
    })
    .catch((err) => {
      if (err === 'cancel' || err === 'close') return
      errorAlert(err?.message || '删除部门失败')
    })
}

onMounted(() => {
  loadSemester()
  getAllYoutholer()
  loadDepartments()
})
</script>
<template>
  <div class="main-layout">
    <el-tabs v-model="activeTab" class="member-tabs">
    <el-tab-pane label="成员" name="members">
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
        <div class="add-btn" @click="openAddYear">新增学年</div>
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
        :key="departmentColumnFilters.map((item) => item.value).join('|')"
        column-key="department"
        align="center"
        prop="department"
        label="部门"
        :filters="departmentColumnFilters"
        :filter-method="filterHandler"
        sortable
      />
      <el-table-column
        column-key="identity"
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
        column-key="duty"
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

    </el-tab-pane>
    <el-tab-pane label="部门" name="departments">
      <p class="dept-hint">可以新增部门，也可以删除没有成员的部门。删除后，添加和编辑成员时不能再选它。</p>
      <div class="dept-bar">
        <el-input v-model="departmentName" class="dept-input" maxlength="20" placeholder="输入新部门名称" clearable @keyup.enter="submitDepartment" />
        <div class="add-btn" :class="{ disabled: departmentSaving }" @click="submitDepartment">添加部门</div>
      </div>
      <el-table v-loading="departmentLoading" :data="departmentRows()" class="table" empty-text="还没有部门">
        <el-table-column prop="name" label="部门" />
        <el-table-column label="操作" width="140" align="center">
          <template #default="scope">
            <el-button type="danger" plain @click="removeDepartment(scope.row.name)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-tab-pane>
    </el-tabs>

    <importOldMembers
      :drawer="importDrawer"
      @displayImport="(val) => (importDrawer = val)"
      @imported="getAllYoutholer"
    />

  
    <el-dialog v-model="addYearVisible" title="新增学年" width="560px" :close-on-click-modal="false">
      <p class="semester-hint">一次新增这一学年的两个学期。不会切换当前学期，也不会改动已有成员、值班和请假记录。</p>
      <div class="year-form">
        <span>学年</span>
        <el-input v-model="yearForm.academic_year" maxlength="9" placeholder="例如 2027-2028" />
        <span>第一学期</span>
        <div class="year-dates">
          <el-date-picker v-model="yearForm.term1_start" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" />
          <el-date-picker v-model="yearForm.term1_end" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" />
        </div>
        <span>第二学期</span>
        <div class="year-dates">
          <el-date-picker v-model="yearForm.term2_start" type="date" value-format="YYYY-MM-DD" placeholder="开始日期" />
          <el-date-picker v-model="yearForm.term2_end" type="date" value-format="YYYY-MM-DD" placeholder="结束日期" />
        </div>
      </div>
      <template #footer>
        <div class="dialog-actions">
          <div class="add-btn" :class="{ disabled: addingYear }" @click="addYearVisible = false">取消</div>
          <div class="add-btn" :class="{ disabled: addingYear }" @click="submitAcademicYear">确认新增</div>
        </div>
      </template>
    </el-dialog>

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
.member-tabs {
  width: 80%;
}
.table {
  width: 100%;
}
.semester-hint {
  width: 100%;
  margin: 0 0 12px;
  color: #666;
  font-size: 13px;
}
.options {
  width: 100%;
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
.year-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.year-dates,
.dialog-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}
.dialog-actions {
  justify-content: flex-end;
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

.dept-hint {
  margin: 0 0 12px;
  color: #666;
  font-size: 13px;
}
.dept-bar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 12px;
}
.dept-input {
  width: 240px;
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
  .member-tabs {
    width: 90%;
  }
  .options {
    flex-direction: column;
  }
}
</style>
