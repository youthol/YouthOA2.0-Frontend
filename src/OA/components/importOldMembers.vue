<script setup>
import { less768 } from 'assets/js/screen'
import { ref, reactive, onMounted, watch } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { departmentOption, identityOption } from 'assets/js/filter.js'
import { getOldYoutholerCandidates, importOldYoutholers } from 'assets/js/oaApi.js'

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

function loadCandidates() {
  loading.value = true
  getOldYoutholerCandidates({
    name: query.name,
    department: query.department,
    identity: query.identity
  })
    .then((res) => {
      tableData.value = res.data || []
      loading.value = false
    })
    .catch((err) => {
      loading.value = false
      errorAlert(err.message || '获取老成员失败')
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
  importing.value = true
  importOldYoutholers({
    sdut_ids: selected.value.map((item) => item.sdut_id)
  })
    .then((res) => {
      importing.value = false
      result.value = res.data
      const successCount = res.data.success.length
      successAlert(`导入完成：成功 ${successCount}，跳过 ${res.data.skipped.length}，失败 ${res.data.failed.length}`)
      emit('imported')
      loadCandidates()
    })
    .catch((err) => {
      importing.value = false
      errorAlert(err.message || '导入失败')
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
      <el-button type="primary" plain @click="loadCandidates">筛选</el-button>
      <el-button type="primary" :loading="importing" @click="doImport">导入选中</el-button>
    </el-form>
    <el-table
      ref="tableRef"
      :data="tableData"
      v-loading="loading"
      row-key="sdut_id"
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
      <p>成功：{{ result.success.map((item) => item.name).join('、') || '无' }}</p>
      <p>跳过：{{ result.skipped.map((item) => item.name + '（' + item.reason + '）').join('、') || '无' }}</p>
      <p>失败：{{ result.failed.map((item) => item.sdut_id + '（' + item.reason + '）').join('、') || '无' }}</p>
    </div>
  </el-drawer>
</template>

<style scoped>
.import-result {
  margin-top: 16px;
  line-height: 1.8;
  color: #333;
}
</style>
