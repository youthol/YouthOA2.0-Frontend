<script setup>
import { computed } from 'vue'
import { FLAG_COLOR, FLAG_LABEL, getDotStyle, resolveSlotVisual, visualFromColor } from 'assets/js/dutyStatus.js'

const props = defineProps({
  status: { type: String, default: 'upcoming' },
  flags: { type: Array, default: () => [] },
  source: { type: String, default: '' },
  colorCode: { type: String, default: '' },
  appendYellow: { type: Boolean, default: false },
  showLabel: { type: Boolean, default: false },
  size: { type: Number, default: 12 }
})

const useColor = computed(() => !!props.colorCode)
const meta = computed(() =>
  useColor.value
    ? visualFromColor(props.colorCode, props.appendYellow)
    : resolveSlotVisual({ status: props.status, source: props.source })
)
const shownFlags = computed(() => (useColor.value ? [] : props.flags))
const mainStyle = computed(() => getDotStyle(meta.value, props.size))
const flagSize = computed(() => Math.max(6, props.size - 4))
</script>
<template>
  <span class="status-dots">
    <span class="dot main" :style="mainStyle" :title="meta.label"></span>
    <span
      v-for="flag in shownFlags"
      :key="flag"
      class="dot flag"
      :style="{
        background: FLAG_COLOR,
        width: flagSize + 'px',
        height: flagSize + 'px'
      }"
      :title="FLAG_LABEL[flag] || flag"
    ></span>
    <span v-if="showLabel" class="label">{{ meta.label }}</span>
  </span>
</template>

<style scoped>
.status-dots {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  vertical-align: middle;
}
.dot {
  display: inline-block;
  border-radius: 50%;
  flex: 0 0 auto;
}
.label {
  margin-left: 4px;
  font-size: 13px;
  color: #333;
}
</style>
