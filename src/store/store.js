import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('userStore', () => {
  // 为了完整类型推理，推荐使用箭头函数
  const sdut_id = ref()
  const is_login = ref(false)
  const duty_state = ref()
  const duty_start_time = ref()
  const name = ref()
  const department = ref()
  const identity = ref()
  const position = ref()
  const duty_paused = ref(false)

  return { sdut_id, is_login, duty_state, duty_start_time, name, department, identity, position, duty_paused }
})

// export const useOAStore = defineStore('oaStore', () => {  
//   // const oa_id = ref()
// })
