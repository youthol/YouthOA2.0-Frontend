<script setup>
import { computed, ref } from 'vue'
import { todayKey, toDateKey, weekdayName } from 'assets/js/datetime.js'
import { CALENDAR_LEGEND, isCalendarVisible } from 'assets/js/dutyStatus.js'
import dutyStatusDots from './dutyStatusDots.vue'

const props = defineProps({
  slots: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

function currentMonthDate() {
  const [year, month, day] = todayKey().split('-').map(Number)
  return new Date(year, month - 1, day)
}

const view = ref('month')
const cursor = ref(currentMonthDate())

const visibleSlots = computed(() => props.slots.filter((slot) => isCalendarVisible(slot)))

const slotMap = computed(() => {
  const map = {}
  visibleSlots.value.forEach((slot) => {
    if (!map[slot.date]) map[slot.date] = []
    map[slot.date].push(slot)
  })
  return map
})

const year = computed(() => cursor.value.getFullYear())
const month = computed(() => cursor.value.getMonth())

const monthCells = computed(() => {
  const first = new Date(year.value, month.value, 1)
  const startWeekday = (first.getDay() + 6) % 7
  const days = new Date(year.value, month.value + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= days; d++) {
    const date = new Date(year.value, month.value, d)
    const key = toDateKey(date)
    cells.push({
      date,
      key,
      dateText: `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`,
      weekday: weekdayName(date),
      slots: slotMap.value[key] || []
    })
  }
  return cells
})

const yearMonths = computed(() => {
  return Array.from({ length: 12 }, (_, index) => {
    const days = new Date(year.value, index + 1, 0).getDate()
    const daysList = []
    for (let d = 1; d <= days; d++) {
      const date = new Date(year.value, index, d)
      const key = toDateKey(date)
      daysList.push({ key, day: d, slots: slotMap.value[key] || [] })
    }
    return { month: index, days: daysList }
  })
})

function prev() {
  const next = new Date(cursor.value)
  if (view.value === 'year') next.setFullYear(next.getFullYear() - 1)
  else next.setMonth(next.getMonth() - 1)
  cursor.value = next
}

function next() {
  const nextDate = new Date(cursor.value)
  if (view.value === 'year') nextDate.setFullYear(nextDate.getFullYear() + 1)
  else nextDate.setMonth(nextDate.getMonth() + 1)
  cursor.value = nextDate
}

function openMonth(index) {
  const nextDate = new Date(cursor.value)
  nextDate.setMonth(index)
  cursor.value = nextDate
  view.value = 'month'
}

const title = computed(() => {
  if (view.value === 'year') return `${year.value}年`
  return `${year.value}年${month.value + 1}月`
})
</script>
<template>
  <div class="calendar" v-loading="loading">
    <div class="toolbar">
      <div class="btn" @click="prev">上一{{ view === 'year' ? '年' : '月' }}</div>
      <div class="title">{{ title }}</div>
      <div class="btn" @click="next">下一{{ view === 'year' ? '年' : '月' }}</div>
      <div class="btn" @click="view = view === 'month' ? 'year' : 'month'">
        {{ view === 'month' ? '全年' : '月视图' }}
      </div>
    </div>
    <div class="legend">
      <span v-for="item in CALENDAR_LEGEND" :key="item.label" class="legend-item">
        <dutyStatusDots :color-code="item.colorCode" :append-yellow="item.appendYellow" :size="14" />
        {{ item.label }}
      </span>
    </div>
    <div v-if="view === 'month'" class="month-grid">
      <div class="week-row">
        <span v-for="name in ['一', '二', '三', '四', '五', '六', '日']" :key="name">{{ name }}</span>
      </div>
      <div class="day-grid">
        <div v-for="(cell, index) in monthCells" :key="index" class="day-cell" :class="{ empty: !cell }">
          <template v-if="cell">
            <div class="date-block">
              <div class="date-line">{{ cell.dateText }}</div>
              <div class="week-line">（{{ cell.weekday }}）</div>
            </div>
            <div class="circles">
              <dutyStatusDots
                v-for="slot in cell.slots"
                :key="slot.id || slot.date + '-' + slot.sdut_id + '-' + slot.frame"
                :color-code="slot.color_code"
                :append-yellow="slot.append_yellow"
                :status="slot.status"
                :flags="slot.flags"
                :source="slot.source"
                :size="14"
              />
            </div>
          </template>
        </div>
      </div>
    </div>
    <div v-else class="year-grid">
      <div v-for="item in yearMonths" :key="item.month" class="mini-month" @click="openMonth(item.month)">
        <div class="mini-title">{{ item.month + 1 }}月</div>
        <div class="mini-days">
          <span v-for="day in item.days" :key="day.key" class="mini-day">
            {{ day.day }}
            <i v-if="day.slots.length" class="mini-dot" :style="{ background: day.slots[0] ? undefined : '#9aa0a6' }">
              <dutyStatusDots
                :color-code="day.slots[0].color_code"
                :append-yellow="day.slots[0].append_yellow"
                :status="day.slots[0].status"
                :flags="day.slots[0].flags"
                :source="day.slots[0].source"
                :size="8"
              />
            </i>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar {
  width: 100%;
}
.toolbar {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.title {
  font-size: 22px;
  font-weight: 700;
  min-width: 140px;
  text-align: center;
}
.btn {
  padding: 6px 14px;
  border: 2px solid #008aff;
  color: #008aff;
  border-radius: 8px;
  font-weight: 700;
  cursor: pointer;
}
.btn:hover {
  background: #008aff;
  color: white;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 14px;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 12px;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
.week-row,
.day-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}
.week-row {
  margin-bottom: 8px;
  text-align: center;
  font-weight: 700;
  color: #008aff;
}
.day-cell {
  min-height: 140px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.day-cell.empty {
  border: none;
}
.date-block {
  flex: 2 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.date-line,
.week-line {
  flex: 1 1 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  text-align: center;
  font-size: clamp(13px, 1.2vw, 16px);
  font-weight: 600;
  line-height: 1.2;
  color: #333;
  white-space: nowrap;
}
.circles {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
.year-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.mini-month {
  border: 1px solid #dbeafe;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
}
.mini-title {
  text-align: center;
  font-weight: 700;
  margin-bottom: 6px;
}
.mini-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
  font-size: 11px;
}
.mini-day {
  text-align: center;
  min-height: 22px;
}
@media only screen and (max-width: 768px) {
  .day-cell {
    min-height: 118px;
  }
  .date-line,
  .week-line {
    font-size: 11px;
    white-space: normal;
  }
  .year-grid {
    grid-template-columns: repeat(1, 1fr);
  }
}
</style>
