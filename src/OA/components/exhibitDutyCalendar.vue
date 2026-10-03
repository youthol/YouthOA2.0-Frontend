<script setup>
import { less768 } from 'assets/js/screen'
import { onMounted, ref } from 'vue'
import { errorAlert } from 'assets/js/message.js'
import { useUserStore } from 'store/store.js'
import { getSingleDutyCalendar } from 'assets/js/oaApi.js'
import { readDutyItems } from 'assets/js/dutyStatus.js'
import dutyCalendar from './dutyCalendar.vue'

defineProps(['drawer'])
const emit = defineEmits(['displayRecord'])
const userStore = useUserStore()
const slots = ref([])
const loading = ref(false)
const _size = ref('80%')

function handleClose(done) {
  emit('displayRecord', false)
  done()
}

onMounted(() => {
  if (less768()) _size.value = '95%'
  loading.value = true
  getSingleDutyCalendar({ sdut_id: userStore.sdut_id })
    .then((res) => {
      const items = readDutyItems(res.data)
      if (!items) {
        slots.value = []
        errorAlert('获取值班记录失败')
      } else {
        slots.value = items
      }
      loading.value = false
    })
    .catch((err) => {
      loading.value = false
      errorAlert(err.message || '获取值班记录失败')
    })
})
</script>
<template>
  <el-drawer :size="_size" :modelValue="drawer" title="值班记录" direction="rtl" :before-close="handleClose">
    <dutyCalendar :slots="slots" :loading="loading" />
  </el-drawer>
</template>
