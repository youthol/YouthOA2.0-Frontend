<script setup>
import { http } from 'assets/js/http'
// import { useUserStore } from 'store/store'
import { ref, reactive, onMounted } from 'vue'
import { errorAlert } from 'assets/js/message.js'
import { ElMessage, ElMessageBox } from 'element-plus'
import modifyMemberInfo from '../components/modifyMemberInfo.vue'
import addNewYoutholer from '../components/addNewYoutholer.vue'
import { departmentFilter } from 'assets/js/filter.js'

// let userStore = useUserStore()

let tableRef = ref()
let tableData = reactive([])
let modifyDrawer = ref(false)
let addMemberDrawer = ref(false)
let loading = ref(true)
let editInfo = reactive({
  sdut_id: 0,
  name: '',
  department: '',
  identity: '',
  duty: []
})

const formatter = (data) => {
  let duty_list = data.duty
  let res = ''
  for (let i = 0; i < duty_list.length; i++) {
    if (i == 0) res = '周'
    else res += '，周'
    switch (duty_list[i].day) {
      case 1:
        res += '一'
        break
      case 2:
        res += '二'
        break
      case 3:
        res += '三'
        break
      case 4:
        res += '四'
        break
      case 5:
        res += '五'
        break
      case 6:
        res += '六'
        break
      case 7:
        res += '日'
        break
    }
    switch (duty_list[i].frame) {
      case 1:
        res += '第1-2节'
        break
      case 2:
        res += '第3-4节'
        break
      case 3:
        res += '第5-6节'
        break
      case 4:
        res += '第7-8节'
        break
      case 5:
        res += '第9-10节'
    }
  }
  return res
}
const filterHandler = (value, row, column) => {
  const property = column['property']
  return row[property] === value
}
const filterDutyHandler = (value, row, column) => {
  const property = column['property']
  let duty = row[property]
  for (let i = 0; i < duty.length; i++) {
    if (duty[i].day == value) {
      return true
    }
  }
  return false
}

function getAllYoutholer() {
  loading.value = true
  http
    .post('/GetAllYoutholer/', {})
    .then((res) => {
      console.log(res.data)

      let data = res.data
      tableData.length = 0
      for (let i = 0; i < data.length; i++) {
        let item = {
          sdut_id: data[i].sdut_id,
          unique_id: data[i].sdut_id + data[i].department,
          name: data[i].name,
          department: data[i].department,
          identity: data[i].identity,
          duty: data[i].duty
        }
        tableData.push(item)
        loading.value = false
      }
    })
    .catch(function (error) {
      console.log(error)
      errorAlert('获取成员信息失败')
      loading.value = false
    })
}

const editMember = (index, row) => {
  editInfo.sdut_id = row.sdut_id
  editInfo.department = row.department
  editInfo.name = row.name
  editInfo.identity = row.identity
  let duty_list = []
  for (let i = 0; i < row.duty.length; i++) {
    duty_list.push({ day: row.duty[i].day, frame: row.duty[i].frame })
  }
  while (duty_list.length < 2) {
    duty_list.push({ day: '0', frame: '0' })
  }
  editInfo.duty = duty_list
  // console.log(row.duty)
  console.log(editInfo)
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
  ElMessageBox.confirm(
    `确认要重置 ${row.name}（${row.sdut_id}）的密码吗？`,
    '重置密码',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  )
    .then(() => {
      http
        .get('/initPassword/', {
          params: {
            username: row.sdut_id
          }
        })
        .then((res) => {
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
  getAllYoutholer()
})
</script>
<template>
  <div class="main-layout">
    <div class="options">
      <div class="add-btn" @click="addOneYouthol">新增成员</div>
      <!-- <div class="add-btn" @click="addManyYouthol">批量导入</div> -->
    </div>

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
      <el-table-column align="center" prop="option" label="操作">
        <template #default="scope">
          <el-button @click="editMember(scope.$index, scope.row)">编辑</el-button>
          <el-button type="warning" plain @click="resetPassword(scope.row)">重置密码</el-button>
          <!-- <el-button type="danger" @click="handleDelete(scope.$index, scope.row)">Delete</el-button> -->
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
.options {
  width: 100%;
  display: flex;
  /* flex-direction: column; */
  justify-content: center;
  align-items: center;
}

.add-btn {
  font-size: 20px;
  margin: 10px 20px;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 700;
  color: #008aff;
  background-color: white;
  border: 3px #008aff solid;
}

.add-btn:hover {
  color: white;
  background-color: #008aff;
}
@media only screen and (max-width: 768px) {
  .table {
    width: 90%;
  }
}
</style>
