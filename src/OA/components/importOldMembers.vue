<script setup>
import { less768 } from 'assets/js/screen'
import { ref, reactive, onMounted, watch } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { departmentOption, identityOption } from 'assets/js/filter.js'
import { getOldYoutholerCandidates, importOldYoutholers, listFrom, objectFrom } from 'assets/js/oaApi.js'

const props = defineProps(['drawer'])
const emit = defineEmits(['displayImport', 'imported'])

const query = reactive({
  name: '',
  department: '',
  identity: ''
})
const tableData = ref([])
const selected = ref([])
const result = ref(null)
const loading = ref(false)
const importing = ref(false)
const tableRef = ref()
const _size = ref('50%')

const ERROR_TEXT = {
  FORBIDDEN: '没有权限',
  SEMESTER_NOT_CONFIGURED: '请先选择当前学期'
}

function messageOf(err, fallback) {
  const code = err?.response?.data?.error
  if (typeof code === 'string' && ERROR_TEXT[code]) return ERROR_TEXT[code]
  return err?.message || fallback
}

function loadCandidates() {
  loading.value = true
  result.value = null
  getOldYoutholerCandidates({
    name: query.name.trim(),
    department: query.department || '',
    identity: query.identity || ''
  })
    .then((res) => {
      tableData.value = listFrom(res).map((item) => ({
        sdut_id: item.sdut_id,
        name: item.name,
        department: item.department,
        identity: item.identity
      }))
      selected.value = []
      tableRef.value?.clearSelection()
      loading.value = false
    })
    .catch((err) => {
      loading.value = false
      tableData.value = []
      errorAlert(messageOf(err, '获取旧成员失败'))
    })
}

function handleSelection(rows) {
  selected.value = rows
}

function failureReason(item) {
  if (item?.reason) return item.reason
  if (item?.error === 'NOT_FOUND') return '候选不存在'
  return item?.error || '导入失败'
}

function normalizeImportResult(res) {
  const body = objectFrom(res)
  const success = Array.isArray(body.success) ? body.success : []
  const skipped = Array.isArray(body.skipped) ? body.skipped : []
  const rawFailed = Array.isArray(body.failed) ? body.failed : Array.isArray(body.failures) ? body.failures : []
  return {
    success,
    skipped,
    failed: rawFailed.map((item) => ({
      sdut_id: item.sdut_id,
      reason: failureReason(item)
    })),
    successCount: Number(body.success_count ?? success.length),
    skipCount: Number(body.skip_count ?? skipped.length)
  }
}

function doImport() {
  if (importing.value) return
  if (!selected.value.length) {
    errorAlert('请选择要导入的成员')
    return
  }
  const sdut_ids = selected.value.map((item) => item.sdut_id)
  importing.value = true
  importOldYoutholers({ sdut_ids })
    .then((res) => {
      const normalized = normalizeImportResult(res)
      result.value = normalized
      importing.value = false
      if (normalized.successCount > 0) {
        successAlert(`已导入 ${normalized.successCount} 人，值班安排为空`)
        emit('imported')
      } else if (normalized.skipCount > 0 && !normalized.failed.length) {
        successAlert(`已在当前学期，跳过 ${normalized.skipCount} 人`)
      } else {
        errorAlert('没有导入成功的成员')
      }
      loadCandidates()
    })
    .catch((err) => {
      importing.value = false
      errorAlert(messageOf(err, '导入失败'))
    })
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
      selected.value = []
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
    <el-form label-position="top" :model="query" @submit.prevent>
      <el-form-item label="姓名">
        <el-input v-model="query.name" clearable placeholder="按姓名筛选" @keyup.enter="loadCandidates" />
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
      <p class="filter-hint">名单来自其他学期。姓名、部门、类别可以组合筛选。已在当前学期的人不会出现。导入只复制学号、姓名、部门和类别，不复制原来的值班安排，也不改旧学期记录。</p>
      <el-button type="primary" plain :loading="loading" @click="loadCandidates">筛选</el-button>
      <el-button type="primary" :loading="importing" @click="doImport">导入选中</el-button>
    </el-form>
    <el-table
      ref="tableRef"
      :data="tableData"
      v-loading="loading"
      row-key="sdut_id"
      empty-text="没有符合筛选条件的旧成员"
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
      <p>跳过：{{ result.skipped.length ? result.skipped.map((item) => item.name + '（' + item.reason + '）').join('、') : (result.skipCount ? result.skipCount + '人，已在当前学期' : '无') }}</p>
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
