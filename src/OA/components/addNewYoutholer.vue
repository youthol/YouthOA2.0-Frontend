<script setup>
import { addOneYoutholer as postAddMember } from 'assets/js/oaApi.js'
import { less768 } from 'assets/js/screen'
import { ref, reactive, onMounted } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'
import {
  departmentOption,
  identityOption,
  dutyDayOption,
  dutyFrameOption
} from 'assets/js/filter.js'

defineProps(['drawer'])
const emit = defineEmits(['displayMemberAdd', 'getInfo'])

const ruleFormRef = ref()
const rules = reactive({
  sdut_id: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  name: [
    {
      required: true,
      message: '请输入姓名',
      trigger: 'blur'
    }
  ],
  college: [
    {
      required: true,
      message: '请输入学院',
      trigger: 'blur'
    }
  ],
  grade: [
    {
      required: true,
      message: '请输入专业班级',
      trigger: 'blur'
    }
  ],
  department: [
    {
      required: true,
      message: '请选择部门',
      trigger: 'change'
    }
  ],
  identity: [
    {
      required: true,
      message: '请选择成员身份',
      trigger: 'change'
    }
  ]
})

const memberInfo = reactive({
  sdut_id: '',
  name: '',
  college: '',
  grade: '',
  department: '',
  identity: '',
  duty: [
    { day: 0, frame: 0 },
    { day: 0, frame: 0 }
  ]
})

function postAddOneYoutholer() {
  postAddMember({
    sdut_id: memberInfo.sdut_id,
    name: memberInfo.name,
    college: memberInfo.college,
    grade: memberInfo.grade,
    department: memberInfo.department,
    identity: memberInfo.identity,
    duty: memberInfo.duty
  })
    .then((res) => {
      const data = res.data
      if (data == '添加成功' || data?.message == '添加成功') {
        const extra = data?.created ? `，已生成 ${data.created} 条本学期值班` : ''
        successAlert('添加成功' + extra)
        emit('displayMemberAdd', false)
        emit('getInfo')
      } else {
        errorAlert('添加失败')
      }
    })
    .catch((err) => {
      console.log(err)
      errorAlert(err.message || '添加失败')
    })
}

function checkDuty() {
  if (
    (memberInfo.duty[1].day == 0 && memberInfo.duty[1].frame != 0) ||
    (memberInfo.duty[0].day == 0 && memberInfo.duty[0].frame != 0) ||
    (memberInfo.duty[1].day != 0 && memberInfo.duty[1].frame == 0) ||
    (memberInfo.duty[0].day != 0 && memberInfo.duty[0].frame == 0)
  ) {
    errorAlert('请完善值班信息')
    return false
  }
  return true
}

const addOneYoutholer = async (formEl) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      if (checkDuty()) {
        postAddOneYoutholer()
      }
    } else {
      console.log('error submit!', fields)
    }
  })
  //   postAddOneYoutholer()
}

let handleClose = (done) => {
  emit('displayMemberAdd', false)
  done()
}

let _size = ref('40%')
onMounted(() => {
  if (less768()) {
    _size.value = '90%'
  }
})
</script>
<template>
  <el-drawer
    :size="_size"
    :modelValue="drawer"
    title="添加新成员"
    direction="rtl"
    :before-close="handleClose"
  >
    <template #default>
      <el-form
        ref="ruleFormRef"
        :rules="rules"
        label-position="top"
        label-width="100px"
        :model="memberInfo"
        style="max-width: 460px"
      >
        <el-form-item prop="sdut_id" label="学号">
          <el-input v-model="memberInfo.sdut_id" />
        </el-form-item>
        <el-form-item prop="name" label="姓名">
          <el-input v-model="memberInfo.name" />
        </el-form-item>
        <el-form-item prop="college" label="学院">
          <el-input v-model="memberInfo.college" />
        </el-form-item>
        <el-form-item prop="grade" label="专业班级">
          <el-input v-model="memberInfo.grade" />
        </el-form-item>
        <el-form-item prop="department" label="部门">
          <el-select v-model="memberInfo.department" class="m-2" placeholder="部门">
            <el-option
              v-for="item in departmentOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="identity" label="类别">
          <el-select v-model="memberInfo.identity" class="m-2" placeholder="类别">
            <el-option
              v-for="item in identityOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="duty[0].day" label="值班1">
          <el-select v-model="memberInfo.duty[0].day" class="m-2 duty-select" placeholder="Select">
            <el-option
              v-for="item in dutyDayOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="memberInfo.duty[0].frame"
            class="m-2 duty-select"
            placeholder="Select"
          >
            <el-option
              v-for="item in dutyFrameOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="duty[1].day" label="值班2">
          <el-select v-model="memberInfo.duty[1].day" class="m-2 duty-select" placeholder="Select">
            <el-option
              v-for="item in dutyDayOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
          <el-select
            v-model="memberInfo.duty[1].frame"
            class="m-2 duty-select"
            placeholder="Select"
          >
            <el-option
              v-for="item in dutyFrameOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-button type="primary" plain @click="addOneYoutholer(ruleFormRef)">添加新成员</el-button>
      </el-form>
    </template>
  </el-drawer>
</template>

<style scoped>
.duty-select {
  margin: 0 3px;
}
</style>
