<script setup>
import { less768 } from 'assets/js/screen'
import { ref, reactive, onMounted, watch } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { departmentOption, identityOption } from 'assets/js/filter.js'
import { getAllYoutholer, listFrom } from 'assets/js/oaApi.js'

const props = defineProps(['drawer'])
const emit = defineEmits(['displayImport', 'imported'])

const query = reactive({
  name: '',
  department: '',
  identity: ''
})
const allMembers = ref([])
const tableData = ref([])
const selected = ref([])
const result = ref(null)
const loading = ref(false)
const tableRef = ref()
const _size = ref('50%')

function applyFilter() {
  const name = query.name.trim().toLowerCase()
  const department = query.department || ''
  const identity = query.identity || ''
  tableData.value = allMembers.value.filter((row) => {
    if (name && !(row.name || '').toLowerCase().includes(name)) return false
    if (department && row.department !== department) return false
    if (identity && row.identity !== identity) return false
    return true
  })
  selected.value = []
  tableRef.value?.clearSelection()
}

function loadCandidates() {
  loading.value = true
  getAllYoutholer()
    .then((res) => {
      allMembers.value = listFrom(res).map((item) => ({
        sdut_id: item.sdut_id,
        name: item.name,
        department: item.department,
        identity: item.identity
      }))
      applyFilter()
      loading.value = false
    })
    .catch((err) => {
      loading.value = false
      allMembers.value = []
      tableData.value = []
      errorAlert(err.message || '获取成员失败')
    })
}

function handleSelection(rows) {
  selected.value = rows
}

function doImport() {
  if (!selected.value.length) {
    errorAlert('请选择要导入的成员')
    return
  }
  const picked = selected.value.slice()
  result.value = {
    success: [],
    skipped: picked.map((item) => ({ ...item, reason: '已在当前成员表中' })),
    failed: [],
    successCount: 0,
    skipCount: picked.length
  }
  successAlert(`这些成员已在当前成员表中，共 ${picked.length} 人`)
}

function handleClose(done) {
  emit('displayImport', false)
  done()
}

watch(
  () => props.drawer,
  (open) => {
    if (open) {
      result.value = null
      query.name = ''
      query.department = ''
      query.identity = ''
      loadCandidates()
    }
  }
)

onMounted(() => {
  if (less768()) _size.value = '90%'
})
</script>
<template>
  <el-drawer :size="_size" :modelValue="drawer" title="导入老成员" direction="rtl" :before-close="handleClose">
    <el-form label-position="top" :model="query">
      <el-form-item label="姓名">
        <el-input v-model="query.name" clearable placeholder="按姓名筛选" />
      </el-form-item>
      <el-form-item label="部门">
        <el-select v-model="query.department" clearable placeholder="部门">
          <el-option v-for="item in departmentOption" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="类别">
        <el-select v-model="query.identity" clearable placeholder="类别">
          <el-option v-for="item in identityOption" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <p class="filter-hint">名单与当前成员表一致。姓名、部门、类别填一项即可筛选，未填的不参与。</p>
      <el-button type="primary" plain @click="applyFilter">筛选</el-button>
      <el-button type="primary" @click="doImport">导入选中</el-button>
    </el-form>
    <el-table
      ref="tableRef"
      :data="tableData"
      v-loading="loading"
      row-key="sdut_id"
      empty-text="没有符合筛选条件的成员"
      style="width: 100%; margin-top: 16px"
      @selection-change="handleSelection"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="name" label="姓名" />
      <el-table-column prop="sdut_id" label="学号" />
      <el-table-column prop="department" label="部门" />
      <el-table-column prop="identity" label="类别" />
    </el-table>
    <div v-if="result" class="import-result">
      <p>成功：{{ result.success.length ? result.success.map((item) => item.name).join('、') : (result.successCount ? result.successCount + '人' : '无') }}</p>
      <p>跳过：{{ result.skipped.length ? result.skipped.map((item) => item.name + '（' + item.reason + '）').join('、') : (result.skipCount ? result.skipCount + '人' : '无') }}</p>
      <p>失败：{{ result.failed.map((item) => item.sdut_id + '（' + item.reason + '）').join('、') || '无' }}</p>
    </div>
  </el-drawer>
</template>

<style scoped>
.filter-hint {
  margin: 0 0 12px;
  color: #666;
  font-size: 13px;
  line-height: 1.6;
}
.import-result {
  margin-top: 16px;
  line-height: 1.8;
  color: #333;
}
</style>
