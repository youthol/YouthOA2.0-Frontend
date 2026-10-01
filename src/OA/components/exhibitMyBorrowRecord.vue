<script setup>
import { http } from 'assets/js/http'
// import { less768 } from 'assets/js/screen'
import { ref, reactive, onMounted } from 'vue'
import { errorAlert, successAlert } from 'assets/js/message.js'

defineProps(['drawer'])
const emit = defineEmits(['displayBorrowRecord'])

let tableData = reactive([])

let _size = ref('70%')

function getBorrowInfo() {
  http
    .post('/GetSingleBorrowRecord/', {
      room_id: '302'
    })
    .then((res) => {
      let data = res.data
      if (!Array.isArray(data)) {
        errorAlert('获取借用信息失败')
        return
      }
      tableData.length = 0
      for (let i = 0; i < data.length; i++) {
        let temp = {
          id: data[i].id,
          room_id: data[i].room_id,
          apply_time: data[i].apply_time,
          borrow_date: data[i].borrow_date,
          start_time: data[i].start_time,
          end_time: data[i].end_time,
          cancel_time: data[i].cancel_time
        }
        tableData.push(temp)
      }
    })
    .catch((err) => {
      console.log(err)
      errorAlert('获取借用信息失败')
    })
}

let handleClose = (done) => {
  emit('displayBorrowRecord', false)
  done()
}

onMounted(() => {
  let width = window.innerWidth
  // let height = window.innerHeight
  if (width < 768) {
    _size.value = '90%'
  }
  getBorrowInfo()
})

const cancelBorrow = (index, row) => {
  let _apply_time = row.apply_time
  let _borrow_date = row.borrow_date
  let _start_time = row.start_time
  let _room_id = row.room_id
  let _id = row.id
  http
    .post('/CancelRoomBorrow/', {
      id: _id,
      apply_time: _apply_time,
      borrow_date: _borrow_date,
      start_time: _start_time,
      room_id: _room_id
    })
    .then((res) => {
      if (res.data == 'success') {
        successAlert('取消成功')
        getBorrowInfo()
      } else {
        errorAlert('取消失败')
      }
    })
    .catch((err) => {
      console.log(err)
      errorAlert('取消失败')
    })
}
</script>
<template>
  <el-drawer
    :size="_size"
    :modelValue="drawer"
    title="房间借用记录"
    direction="rtl"
    :before-close="handleClose"
  >
    <template #default>
      <el-table
        :data="tableData"
        :default-sort="{ prop: 'id', order: 'descending' }"
        :key="true"
        border
        style="width: 100%; margin: 20px 0 0 0"
      >
        <el-table-column prop="id" label="借用编号" sortable />
        <el-table-column prop="room_id" label="房间号" sortable />
        <el-table-column prop="apply_time" label="申请时间" sortable />
        <el-table-column prop="borrow_date" label="借用日期" sortable />
        <el-table-column prop="start_time" label="开始时间" sortable />
        <el-table-column prop="end_time" label="结束时间" sortable />
        <el-table-column prop="cancel_time" label="取消时间" sortable />
        <el-table-column prop="option" label="操作">
          <template #default="scope">
            <el-button
              type="danger"
              @click="cancelBorrow(scope.$index, scope.row)"
              :disabled="scope.row.cancel_time != ' '"
              >取消</el-button
            >
            <!-- <el-button type="danger" @click="handleDelete(scope.$index, scope.row)">Delete</el-button> -->
          </template>
        </el-table-column>
      </el-table>
    </template>
  </el-drawer>
</template>

<style scoped>
.duty-select {
  margin: 0 3px;
}
</style>
