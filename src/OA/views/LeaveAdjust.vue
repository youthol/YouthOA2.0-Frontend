<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useUserStore } from 'store/store.js'
import { errorAlert, successAlert } from 'assets/js/message.js'
import { dutyFrameSelectOption, frameLabelWithTime } from 'assets/js/dutyFrame.js'
import { combineDateTime, toDateKey } from 'assets/js/datetime.js'
import { applyLeaveAdjust, getSingleDutyCalendar, canApplyLeave, canApplyMakeup, bindCurrentUser } from 'assets/js/oaApi.js'
import { beijingTodayKey, beijingDateKey, isMakeupStartPassed } from 'assets/js/leaveRule.js'

const userStore = useUserStore()
const form = reactive({
  original_date: '',
  original_frame: '',
  makeup_date: '',
  makeup_frame: '',
  reason: '',
  reason_detail: ''
})
const slots = ref([])
const submitting = ref(false)
const reasons = ['有课', '有事', '其他']
const isOtherReason = computed(() => form.reason === '其他')

const originalSlots = computed(() =>
  slots.value.filter((item) => item.source !== 'makeup' && item.source !== 'makeup-cancelled')
)

function normalizeDateKey(value) {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10)
  }
  return toDateKey(value)
}

const scheduledDates = computed(() => {
  const set = new Set()
  originalSlots.value.forEach((item) => {
    const key = normalizeDateKey(item.date)
    if (key) set.add(key)
  })
  return set
})

const scheduledDateKey = computed(() => Array.from(scheduledDates.value).sort().join(','))

const blockingSlots = computed(() =>
  slots.value.filter((item) => item.source !== 'makeup-cancelled')
)

const occupiedFramesByDate = computed(() => {
  const map = {}
  blockingSlots.value.forEach((item) => {
    const key = normalizeDateKey(item.date)
    if (!key) return
    if (!map[key]) map[key] = new Set()
    map[key].add(String(item.frame))
  })
  return map
})

const makeupOccupiedDateKey = computed(() =>
  Object.keys(occupiedFramesByDate.value)
    .sort()
    .map((date) => `${date}:${Array.from(occupiedFramesByDate.value[date]).sort().join('|')}`)
    .join(',')
)

function isSameAsOriginal(date, frame) {
  return !!date && !!frame && date === form.original_date && String(frame) === String(form.original_frame)
}

function isMakeupFrameDisabled(date, frame) {
  if (!date || !frame) return false
  if (isSameAsOriginal(date, frame)) return true
  if (isMakeupStartPassed(date, frame)) return true
  return occupiedFramesOn(date).has(String(frame))
}

function hasSelectableMakeupFrame(dateKey) {
  return ['1', '2', '3', '4', '5'].some((frame) => !isMakeupFrameDisabled(dateKey, frame))
}

const makeupFrameOptions = computed(() => {
  return dutyFrameSelectOption
    .filter((opt) => opt.value !== '0')
    .map((opt) => ({
      ...opt,
      disabled: !form.makeup_date ? false : isMakeupFrameDisabled(form.makeup_date, opt.value)
    }))
})

const makeupPickerKey = computed(
  () => `${makeupOccupiedDateKey.value}|${form.original_date}|${form.original_frame}|${beijingTodayKey()}`
)

const framesOnOriginalDate = computed(() => {
  if (!form.original_date) return []
  const seen = new Set()
  const list = []
  originalSlots.value
    .filter((item) => normalizeDateKey(item.date) === form.original_date)
    .forEach((item) => {
      const frame = String(item.frame)
      if (seen.has(frame)) return
      seen.add(frame)
      list.push({
        value: frame,
        label: frameLabelWithTime(item.frame),
        disabled: isMakeupStartPassed(form.original_date, frame)
      })
    })
  return list.sort((a, b) => Number(a.value) - Number(b.value))
})

const originalPickerKey = computed(() => `${scheduledDateKey.value}|${beijingTodayKey()}`)

const selectedSlot = computed(() => {
  if (!form.original_date || !form.original_frame) return null
  return (
    originalSlots.value.find(
      (item) => item.date === form.original_date && String(item.frame) === String(form.original_frame)
    ) || null
  )
})

const leaveCheck = computed(() => canApplyLeave(selectedSlot.value))
const blocked = computed(() => !selectedSlot.value || !leaveCheck.value.ok)

function hasSelectableOriginalFrame(dateKey) {
  return originalSlots.value.some((item) => {
    if (normalizeDateKey(item.date) !== dateKey) return false
    return !isMakeupStartPassed(dateKey, item.frame)
  })
}

function disableUnscheduledDate(date) {
  const key = beijingDateKey(date) || normalizeDateKey(date) || toDateKey(date)
  if (!key) return true
  if (key < beijingTodayKey()) return true
  if (!scheduledDates.value.has(key)) return true
  return !hasSelectableOriginalFrame(key)
}

function occupiedFramesOn(dateKey) {
  return occupiedFramesByDate.value[dateKey] || new Set()
}

function disableOccupiedMakeupDate(date) {
  const key = beijingDateKey(date) || normalizeDateKey(date) || toDateKey(date)
  if (!key) return true
  if (key < beijingTodayKey()) return true
  return !hasSelectableMakeupFrame(key)
}

function isMakeupOccupied(date, frame) {
  if (!date || !frame) return false
  return occupiedFramesOn(date).has(String(frame))
}

function warnPickOriginalDate() {
  errorAlert('请先选择原值班日期！')
}

watch(
  () => form.original_date,
  (date) => {
    if (date && date < beijingTodayKey()) {
      form.original_date = ''
      form.original_frame = ''
      return
    }
    form.original_frame = ''
  }
)

watch(
  () => [form.original_date, form.original_frame],
  () => {
    if (form.original_date && form.original_frame && isMakeupStartPassed(form.original_date, form.original_frame)) {
      form.original_frame = ''
    }
  }
)

watch(
  () => [form.makeup_date, form.original_date, form.original_frame, makeupOccupiedDateKey.value],
  () => {
    if (form.makeup_date && form.makeup_frame && isMakeupFrameDisabled(form.makeup_date, form.makeup_frame)) {
      form.makeup_frame = ''
    }
  }
)

function loadSlots() {
  const id = userStore.sdut_id
  if (!id || id === 'no id') return
  bindCurrentUser({
    sdut_id: id,
    name: userStore.name,
    department: userStore.department,
    identity: userStore.identity
  })
    .then(() => getSingleDutyCalendar({ sdut_id: id }))
    .then((res) => {
      const list = Array.isArray(res.data) ? res.data : []
      slots.value = list
      if (!list.length) {
        errorAlert('当前账号没有已生成的原值班日期，请先在成员管理中配置值班')
      }
    })
    .catch((err) => {
      errorAlert(err.message || '获取值班时间失败')
    })
}

function submit() {
  if (!form.original_date) {
    errorAlert('请选择原值班日期')
    return
  }
  if (!form.original_frame) {
    errorAlert('请选择原值班节次')
    return
  }
  if (!selectedSlot.value) {
    errorAlert('该日期没有对应的原值班节次')
    return
  }
  if (blocked.value) {
    errorAlert(leaveCheck.value.reason)
    return
  }
  if (!form.makeup_date || !form.makeup_frame) {
    errorAlert('请选择补班时间')
    return
  }
  const makeupCheck = canApplyMakeup({
    makeup_date: form.makeup_date,
    makeup_frame: form.makeup_frame,
    original_date: form.original_date,
    original_frame: form.original_frame
  })
  if (!makeupCheck.ok) {
    errorAlert(makeupCheck.reason)
    return
  }
  if (isMakeupOccupied(form.makeup_date, form.makeup_frame)) {
    errorAlert('该时间已有值班安排，请选择其他补班时间')
    return
  }
  if (!form.reason) {
    errorAlert('请选择申请原因')
    return
  }
  if (isOtherReason.value && !form.reason_detail.trim()) {
    errorAlert('请填写具体原因')
    return
  }
  submitting.value = true
  applyLeaveAdjust({
    sdut_id: userStore.sdut_id,
    original_slot_id: selectedSlot.value.id,
    makeup_date: form.makeup_date,
    makeup_frame: Number(form.makeup_frame),
    reason: form.reason,
    reason_detail: isOtherReason.value ? form.reason_detail.trim() : ''
  })
    .then(() => {
      submitting.value = false
      successAlert('申请已通过，无需审核')
      form.original_date = ''
      form.original_frame = ''
      form.makeup_date = ''
      form.makeup_frame = ''
      form.reason = ''
      form.reason_detail = ''
      loadSlots()
    })
    .catch((err) => {
      submitting.value = false
      errorAlert(err.message || '申请失败')
    })
}

watch(
  () => userStore.sdut_id,
  (id) => {
    if (id && id !== 'no id') loadSlots()
  },
  { immediate: true }
)
</script>
<template>
  <div class="main-layout">
    <h2 class="title">请假调班</h2>
    <el-form label-position="top" class="form" :model="form">
      <el-form-item label="姓名">
        <el-input :model-value="userStore.name" disabled />
      </el-form-item>
      <el-form-item label="部门">
        <el-input :model-value="userStore.department" disabled />
      </el-form-item>
      <el-form-item label="原值班时间">
        <div class="makeup-row">
          <el-date-picker
            :key="originalPickerKey"
            v-model="form.original_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="原值班日期"
            :disabled-date="disableUnscheduledDate"
          />
          <div class="frame-wrap">
            <el-select v-model="form.original_frame" placeholder="节次">
              <el-option
                v-for="item in framesOnOriginalDate"
                :key="item.value"
                :label="item.label"
                :value="item.value"
                :disabled="item.disabled"
              />
            </el-select>
            <div v-if="!form.original_date" class="frame-mask" @click="warnPickOriginalDate"></div>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="补班时间">
        <div class="makeup-row">
          <el-date-picker
            :key="'makeup-' + makeupPickerKey"
            v-model="form.makeup_date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="补班日期"
            :disabled-date="disableOccupiedMakeupDate"
          />
          <div class="frame-wrap">
            <el-select v-model="form.makeup_frame" placeholder="节次">
              <el-option
                v-for="item in makeupFrameOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
                :disabled="item.disabled"
              />
            </el-select>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="申请原因">
        <el-radio-group v-model="form.reason">
          <el-radio v-for="item in reasons" :key="item" :label="item">{{ item }}</el-radio>
        </el-radio-group>
        <el-input
          v-if="isOtherReason"
          v-model="form.reason_detail"
          class="reason-detail"
          type="textarea"
          :rows="3"
          maxlength="200"
          show-word-limit
          placeholder="请填写具体原因"
        />
      </el-form-item>
      <p v-if="blocked && selectedSlot" class="warn">{{ leaveCheck.reason }}</p>
      <el-button type="primary" :disabled="blocked" :loading="submitting" @click="submit">提交申请</el-button>
    </el-form>
    <p v-if="selectedSlot" class="hint">原班次完整时间：{{ combineDateTime(selectedSlot.date, selectedSlot.start_time) }}</p>
  </div>
</template>

<style scoped>
.main-layout {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.title {
  margin: 10px 0 20px;
}
.form {
  width: 520px;
  max-width: 92%;
}
.reason-detail {
  width: 100%;
  margin-top: 12px;
}
.makeup-row {
  display: flex;
  gap: 10px;
  width: 100%;
}
.frame-wrap {
  position: relative;
  flex: 1;
  min-width: 0;
}
.frame-wrap :deep(.el-select) {
  width: 100%;
}
.frame-mask {
  position: absolute;
  inset: 0;
  z-index: 2;
  cursor: pointer;
}
.warn {
  color: #c0392b;
  margin-bottom: 12px;
}
.hint {
  margin-top: 16px;
  color: #666;
}
</style>
