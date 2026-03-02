<script setup>
import { http } from 'assets/js/http'
import { less768 } from 'assets/js/screen'
import { reactive, onMounted, ref } from 'vue'
import { errorAlert, successAlert, messageBox } from 'assets/js/message.js'
import {
  departmentOption,
  identityOption,
  dutyDayOption,
  dutyFrameOption
} from 'assets/js/filter.js'

const propData = defineProps(['drawer', 'info'])
const emit = defineEmits(['displayMemberEdit', 'getInfo'])

let memberInfo = reactive(propData.info)

function modifyMemberInfo() {
  if (
    (memberInfo.duty[1].day == 0 && memberInfo.duty[1].frame != 0) ||
    (memberInfo.duty[0].day == 0 && memberInfo.duty[0].frame != 0) ||
    (memberInfo.duty[1].day != 0 && memberInfo.duty[1].frame == 0) ||
    (memberInfo.duty[0].day != 0 && memberInfo.duty[0].frame == 0)
  ) {
    errorAlert('请完善值班信息')
    return
  }

  http
    .post('/ModifySingleYoutholInfo/', {
      sdut_id: memberInfo.sdut_id,
      department: memberInfo.department,
      name: memberInfo.name,
      identity: memberInfo.identity,
      duty: memberInfo.duty
    })
    .then((res) => {
      console.log(res)
      successAlert('修改成功')
      emit('displayMemberEdit', false)
      emit('getInfo')
    })
    .catch((err) => {
      console.log(err)
      errorAlert('修改失败')
    })
}

let handleClose = (done) => {
  emit('displayMemberEdit', false)
  done()
}

const handleDelete = () => {
  const success = () => {
    http
      .post('/DeletYoutholer/', {
        sdut_id: memberInfo.sdut_id,
        department: memberInfo.department
      })
      .then((res) => {
        console.log(res)
        successAlert('删除成员成功')
        emit('displayMemberEdit', false)
        emit('getInfo')
      })
      .catch((err) => {
        console.log(err)
        errorAlert('删除成员失败')
      })
  }
  const error = () => {
    errorAlert('取消操作')
  }

  let title = '删除成员'
  let text = '确定要删除 ' + memberInfo.name + ' 吗？'
  let confirmText = '确定删除'
  let cancelText = '取消'

  messageBox(text, title, confirmText, cancelText, success, error)
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
    title="编辑成员信息"
    direction="rtl"
    :before-close="handleClose"
  >
    <template #default>
      <el-form
        label-position="top"
        label-width="100px"
        :model="memberInfo"
        style="max-width: 100%; padding: 0 20px"
      >
        <el-form-item prop="memberInfo.name" label="姓名">
          <el-input v-model="memberInfo.name" />
        </el-form-item>
        <el-form-item prop="memberInfo.department" label="部门">
          <el-select v-model="memberInfo.department" class="m-2" placeholder="部门">
            <el-option
              v-for="item in departmentOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="memberInfo.identity" label="类别">
          <el-select v-model="memberInfo.identity" class="m-2" placeholder="类别">
            <el-option
              v-for="item in identityOption"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="memberInfo.duty[0].day" label="值班1">
          <div class="duty-row">
            <el-select v-model="memberInfo.duty[0].day" class="duty-select" placeholder="Select">
              <el-option
                v-for="item in dutyDayOption"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select
              v-model="memberInfo.duty[0].frame"
              class="duty-select"
              placeholder="Select"
            >
              <el-option
                v-for="item in dutyFrameOption"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item prop="memberInfo.duty[1].day" label="值班2">
          <div class="duty-row">
            <el-select v-model="memberInfo.duty[1].day" class="duty-select" placeholder="Select">
              <el-option
                v-for="item in dutyDayOption"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-select
              v-model="memberInfo.duty[1].frame"
              class="duty-select"
              placeholder="Select"
            >
              <el-option
                v-for="item in dutyFrameOption"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </div>
        </el-form-item>
        <el-button type="primary" plain @click="modifyMemberInfo">确认修改</el-button>
        <el-button type="danger" plain @click="handleDelete">删除成员</el-button>
        
      </el-form>
    </template>
  </el-drawer>
</template>

<style scoped>
.duty-row {
  display: flex;
  gap: 10px;
}

.duty-select {
  flex: 1;
  min-width: 120px;
}
</style>
