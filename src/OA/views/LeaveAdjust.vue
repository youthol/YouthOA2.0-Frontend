<script setup>
import { reactive, ref, computed, watch } from 'vue'
import { useUserStore } from 'store/store.js'
import { errorAlert, successAlert, messageBox } from 'assets/js/message.js'
import { dutyFrameSelectOption, formatScheduleLine, getFrameTime } from 'assets/js/dutyFrame.js'
import { combineDateTime, toDateKey } from 'assets/js/datetime.js'
import { applyLeaveAdjust, cancelLeaveAdjust, getMyLeaveRecords, getSingleDutyCalendar, canApplyLeave, canApplyMakeup, bindCurrentUser, listFrom } from 'assets/js/oaApi.js'
import { beijingTodayKey, beijingDateKey, canCancelLeave, isMakeupStartPassed } from 'assets/js/leaveRule.js'

const userStore = useUserStore()
const panel = ref('apply')
const records = ref([])
const recordsLoading = ref(false)
const selectedId = ref('')
const cancelling = ref(false)
const form = reactive({
  original_date: '',
  original_frame: '',
  makeup_date: '',
  makeup_frame: '',
  reason: '',
  reason_detail: ''
})
const slots = ref([])
const slotsLoaded = ref(false)
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

function slotClock(item) {
  const matched = String(item?.start_time || '').trim().match(/^(\d{1,2}):(\d{2})/)
  if (matched) return `${matched[1].padStart(2, '0')}:${matched[2]}`
  return getFrameTime(item?.frame)?.start || ''
}

function slotStartMs(item) {
  const date = normalizeDateKey(item?.date)
  const clock = slotClock(item)
  if (!date || !clock) return NaN
  return new Date(`${date}T${clock}:00+08:00`).getTime()
}

const originalSlotKey = ref('')
const originalChoices = computed(() => {
  const now = Date.now()
  return originalSlots.value
    .map((item) => {
      const date = normalizeDateKey(item.date)
      const frame = String(item.frame)
      const clock = slotClock(item)
      const start = slotStartMs(item)
      const check = canApplyLeave({ ...item, date, start_time: clock })
      return {
        key: `${item.id ?? ''}|${date}|${frame}`,
        date,
        frame,
        start,
        disabled: !check.ok,
        label: `${formatScheduleLine({ ...item, date, start_time: clock })}${check.ok ? '' : `（${check.reason}）`}`
      }
    })
    .filter((item) => !Number.isNaN(item.start) && item.start > now)
    .sort((a, b) => a.start - b.start || Number(a.frame) - Number(b.frame))
})

function onOriginalChange(key) {
  const choice = originalChoices.value.find((item) => item.key === key)
  if (!choice || choice.disabled) {
    originalSlotKey.value = ''
    form.original_date = ''
    form.original_frame = ''
    return
  }
  form.original_date = choice.date
  form.original_frame = choice.frame
}
const selectedSlot = computed(() => {
  if (!form.original_date || !form.original_frame) return null
  return (
    originalSlots.value.find(
      (item) =>
        normalizeDateKey(item.date) === normalizeDateKey(form.original_date) &&
        String(item.frame) === String(form.original_frame)
    ) || null
  )
})

const leaveCheck = computed(() => {
  const slot = selectedSlot.value
  if (!slot) return canApplyLeave(null)
  return canApplyLeave({
    ...slot,
    date: normalizeDateKey(slot.date),
    start_time: slotClock(slot)
  })
})
const blocked = computed(() => !selectedSlot.value || !leaveCheck.value.ok)

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
      const list = listFrom(res)
      slots.value = list
      if (originalSlotKey.value && !originalChoices.value.some((item) => item.key === originalSlotKey.value && !item.disabled)) {
        originalSlotKey.value = ''
        form.original_date = ''
        form.original_frame = ''
      }
      if (!list.length) {
        errorAlert('当前账号没有已生成的原值班日期，请先在成员管理中配置值班')
      }
    })
    .catch((err) => {
      errorAlert(err.message || '获取值班时间失败')
    })
    .finally(() => {
      slotsLoaded.value = true
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
      originalSlotKey.value = ''
      form.original_date = ''
      form.original_frame = ''
      form.makeup_date = ''
      form.makeup_frame = ''
      form.reason = ''
      form.reason_detail = ''
      loadSlots()
      loadRecords()
    })
    .catch((err) => {
      submitting.value = false
      errorAlert(err.message || '申请失败')
    })
}

const recordRows = computed(() =>
  records.value.map((item) => {
    const check = canCancelLeave(item)
    return {
      ...item,
      canCancel: check.ok,
      cancelReason: check.ok ? '可撤销' : check.reason
    }
  })
)
const leaveCount = computed(() => recordRows.value.length)
const adjustCount = computed(() => recordRows.value.filter((item) => item.has_makeup !== false && item.makeup?.date).length)
const selectedRecord = computed(() => recordRows.value.find((item) => String(item.id) === String(selectedId.value)) || null)

function reasonText(row) {
  const reason = row?.reason || ''
  const detail = String(row?.reason_detail || '').trim()
  if (reason === '其他' && detail) return `其他（${detail}）`
  return reason
}

function loadRecords() {
  recordsLoading.value = true
  getMyLeaveRecords({ sdut_id: userStore.sdut_id })
    .then((res) => {
      records.value = listFrom(res)
      if (selectedId.value && !records.value.some((item) => String(item.id) === String(selectedId.value))) {
        selectedId.value = ''
      }
    })
    .catch((err) => {
      errorAlert(err.message || '获取请假记录失败')
    })
    .finally(() => {
      recordsLoading.value = false
    })
}

function onPanelChange(name) {
  if (name === 'records' || name === 'cancel') loadRecords()
}

function cancelSelected() {
  const row = selectedRecord.value
  if (!row) {
    errorAlert('请选择要撤销的请假')
    return
  }
  if (!row.canCancel) {
    errorAlert(row.cancelReason)
    return
  }
  messageBox(
    `确定撤销「${formatScheduleLine(row.original)}」这次请假吗？撤销后原班次恢复，对应补班会取消。`,
    '撤销请假',
    '撤销',
    '取消',
    () => {
      cancelling.value = true
      cancelLeaveAdjust({ id: row.id, sdut_id: userStore.sdut_id })
        .then(() => {
          successAlert('已撤销')
          selectedId.value = ''
          loadRecords()
          loadSlots()
        })
        .catch((err) => {
          errorAlert(err.message || '撤销失败')
        })
        .finally(() => {
          cancelling.value = false
        })
    },
    () => {}
  )
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
    <el-tabs v-model="panel" class="panels" @tab-change="onPanelChange">
      <el-tab-pane label="申请请假" name="apply">
    <el-form label-position="top" class="form" :model="form">
      <el-form-item label="姓名">
        <el-input :model-value="userStore.name" disabled />
      </el-form-item>
      <el-form-item label="部门">
        <el-input :model-value="userStore.department" disabled />
      </el-form-item>
      <el-form-item label="原值班时间">
        <el-select v-model="originalSlotKey" class="slot-select" filterable placeholder="选择还没开始的值班" @change="onOriginalChange">
          <el-option
            v-for="item in originalChoices"
            :key="item.key"
            :label="item.label"
            :value="item.key"
            :disabled="item.disabled"
          />
        </el-select>
        <p v-if="slotsLoaded && !originalChoices.length" class="hint">没有可申请的未来值班。已经开始的班次不会出现在这里。</p>
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
      <p class="hint">距离值班开始不足15分钟不能申请。例如 8:00 的班，7:44 可以申请，7:55 不行。</p>
      <p v-if="blocked && selectedSlot" class="warn">{{ leaveCheck.reason }}</p>
      <el-button type="primary" :disabled="blocked" :loading="submitting" @click="submit">提交申请</el-button>
    </el-form>
    <p v-if="selectedSlot" class="hint">原班次完整时间：{{ combineDateTime(selectedSlot.date, selectedSlot.start_time) }}</p>
      </el-tab-pane>
      <el-tab-pane label="请假记录" name="records">
        <div class="counts">
          <div class="count-card">请假 <strong>{{ leaveCount }}</strong> 次</div>
          <div class="count-card">调班 <strong>{{ adjustCount }}</strong> 次</div>
        </div>
        <p class="hint">这里只统计当前账号的请假调班。一次申请同时记 1 次请假和 1 次调班。</p>
        <el-table class="record-table" :data="recordRows" v-loading="recordsLoading" empty-text="还没有请假记录">
          <el-table-column label="原值班时间" min-width="220">
            <template #default="scope">{{ formatScheduleLine(scope.row.original) }}</template>
          </el-table-column>
          <el-table-column label="补班时间" min-width="220">
            <template #default="scope">{{ formatScheduleLine(scope.row.makeup) }}</template>
          </el-table-column>
          <el-table-column label="原因" min-width="140">
            <template #default="scope">{{ reasonText(scope.row) }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
      <el-tab-pane label="撤销请假" name="cancel">
        <p class="hint">先选中一次请假，再撤销。原值班和补班都要在开始前15分钟以上才能撤销，任意一边不到15分钟，整条请假都不能撤销。例如原班是8:00、补班是10:00：7:44可以撤销，7:50不行；9:50离补班不到15分钟，也不行。补班开始以后同样不能撤销。</p>
        <el-table class="record-table" :data="recordRows" v-loading="recordsLoading" empty-text="没有可显示的请假">
          <el-table-column width="56">
            <template #default="scope">
              <el-radio v-model="selectedId" :label="scope.row.id" :disabled="!scope.row.canCancel" />
            </template>
          </el-table-column>
          <el-table-column label="原值班时间" min-width="220">
            <template #default="scope">{{ formatScheduleLine(scope.row.original) }}</template>
          </el-table-column>
          <el-table-column label="补班时间" min-width="220">
            <template #default="scope">{{ formatScheduleLine(scope.row.makeup) }}</template>
          </el-table-column>
          <el-table-column label="状态" min-width="180">
            <template #default="scope">{{ scope.row.cancelReason }}</template>
          </el-table-column>
        </el-table>
        <el-button
          class="cancel-btn"
          type="primary"
          :loading="cancelling"
          :disabled="!selectedRecord || !selectedRecord.canCancel"
          @click="cancelSelected"
        >
          撤销所选请假
        </el-button>
      </el-tab-pane>
    </el-tabs>
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
.frame-wrap :deep(.el-select),
.slot-select {
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
.panels {
  width: min(920px, 96%);
}
.panels :deep(.el-tabs__item.is-active) {
  color: #008aff;
}
.panels :deep(.el-tabs__active-bar) {
  background-color: #008aff;
}
.counts {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}
.count-card {
  flex: 1;
  padding: 14px 16px;
  border: 1px solid #d6ebff;
  border-radius: 10px;
  background: #f5faff;
  color: #008aff;
  font-size: 16px;
}
.count-card strong {
  font-size: 28px;
  margin: 0 4px;
}
.record-table {
  width: 100%;
  margin-top: 12px;
}
.record-table :deep(.el-radio__label) {
  display: none;
}
.cancel-btn {
  margin-top: 16px;
}
</style>
