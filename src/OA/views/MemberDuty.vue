<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { errorAlert, successAlert, messageBox } from 'assets/js/message.js'
import { ElMessage } from 'element-plus'

import exhibitDutyInfo from '../components/exhibitDutyInfo.vue'
import applyDutyLeave from '../components/applyDutyLeave.vue'
import exhibitDutyCalendar from '../components/exhibitDutyCalendar.vue'

import { http } from 'assets/js/http'
import { useUserStore } from 'store/store'
import { getDutyPauseState, pausedFrom } from 'assets/js/oaApi.js'

let is_duty = ref(false)
let userStore = useUserStore()
let applyDutyDrawer = ref(false)
let exhibitDutyRecordDrawer = ref(false)
let waiting_duty = false

let nowDuty = reactive({
  start_time: '',
  duty_state: '不在值班时间内',
  pass_time: '00:00:00',
  timer: ''
})

const acceptanceLocation = { lat: 36.813, longt: 118.0 }

function getLocation() {
  if (!window.isSecureContext || !navigator.geolocation) {
    return Promise.resolve({ ...acceptanceLocation })
  }
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({ lat: pos.coords.latitude, longt: pos.coords.longitude })
      },
      (err) => {
        const error = err instanceof Error ? err : new Error(err?.message || '获取位置失败，请允许浏览器获取位置')
        error.isLocation = true
        reject(error)
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
    )
  })
}

function releaseWaiting() {
  waiting_duty = false
}

function startDuty() {
  if (userStore.duty_paused) {
    errorAlert('当前处于暂停值班状态，无法签到')
    return
  }
  if (waiting_duty) return
  waiting_duty = true
  ElMessage('正在签到，请稍后')

  getLocation()
    .then((location) =>
      http.post('/StartDuty/', {
        sdut_id: userStore.sdut_id,
        latitude: location.lat,
        longitude: location.longt
      })
    )
    .then((res) => {
      if (res.data == '签到失败') {
        errorAlert('签到失败')
        return
      }

      if (res.data == '不在签到范围位置内') {
        errorAlert('不在签到范围位置内，无法签到')
        return
      }

      if (res.data == '暂停值班中') {
        errorAlert('当前处于暂停值班状态，无法签到')
        return
      }

      const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      is_duty.value = true
      successAlert('签到成功')
      userStore.$patch({
        is_login: true,
        duty_start_time: data.start_time,
        duty_state: data.duty_state
      })
      nowDuty.start_time = data.start_time
      nowDuty.duty_state = data.duty_state

      nowDuty.timer = setInterval(() => {
        nowDuty.pass_time = getTime(nowDuty.start_time)
      }, 1000)
    })
    .catch((error) => {
      console.log(error)
      errorAlert(error?.isLocation ? error.message : '签到失败')
    })
    .finally(releaseWaiting)
}

function toSecond(time) {
  let timeParts = time.split(':')

  if (timeParts.length === 3) {
    // 如果有时、分、秒三个部分
    let hours = parseInt(timeParts[0], 10)
    let minutes = parseInt(timeParts[1], 10)
    let seconds = parseInt(timeParts[2], 10)

    // 计算总秒数
    let totalSeconds = hours * 3600 + minutes * 60 + seconds

    return totalSeconds
  }
}

function toSignOutState(lat, longt) {
  return http
    .post('/FinishDuty/', {
      sdut_id: userStore.sdut_id,
      latitude: lat,
      longitude: longt
    })
    .then((res) => {
      let data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
      if (data.message == '不在签退范围位置内') {
        errorAlert('不在签退范围位置内，无法签退')
        return
      }

      if (data.message == '签退成功') {
        is_duty.value = false
        clearInterval(nowDuty.timer)

        // 存到 pinia 中
        userStore.$patch({
          duty_start_time: '',
          duty_state: ''
        })
        is_duty.value = false
        nowDuty.start_time = ''
        nowDuty.duty_state = '已签退'

        successAlert('签退成功')
      } else {
        is_duty.value = false
        clearInterval(nowDuty.timer)
        // 存到 pinia 中
        userStore.$patch({
          duty_start_time: '',
          duty_state: ''
        })
        is_duty.value = false
        nowDuty.start_time = ''
        nowDuty.duty_state = '已签退'
        errorAlert(data.message)
      }
      console.log(res)
    })
    .catch(function (error) {
      console.log(error)
      errorAlert('签退失败')
    })
}

function finishDuty() {
  if (waiting_duty) {
    ElMessage('正在签退，请稍后')
    // console.log('is true')
    return
  }

  const success = () => {
    ElMessage('正在签退，请稍后')
    if (waiting_duty) return
    waiting_duty = true
    getLocation()
      .then((location) => toSignOutState(location.lat, location.longt))
      .catch((error) => {
        console.log(error)
        errorAlert(error?.message || '获取位置失败，请允许浏览器获取位置')
      })
      .finally(releaseWaiting)
  }

  const error = (action) => {
    waiting_duty = false
    if (action === 'cancel') {
      errorAlert('取消签退')
    } else {
      errorAlert('取消签退')
    }
  }

  let text = "'值班不足30分钟，不会计入总时长，确定签退吗？'"
  let title = '签退'
  let confirmText = '确认签退'
  let cancelText = '取消'

  if (toSecond(nowDuty.pass_time) < 1800) {
    messageBox(text, title, confirmText, cancelText, success, error)
    waiting_duty = false
  } else {
    success()
  }
}

function getTime(start_time) {
  let now = new Date()
  // 获取目标时间，假设目标时间是今天的 %H:%M:%S
  let targetTime = new Date(start_time)
  // 计算时间差（单位：毫秒）
  let timeDiff = now.getTime() - targetTime.getTime()
  // 将毫秒转换为秒
  let seconds = Math.floor(timeDiff / 1000)
  // 计算时、分、秒
  let hours = Math.floor(seconds / 3600)
  let minutes = Math.floor((seconds % 3600) / 60)
  let remainingSeconds = seconds % 60

  // 格式化输出
  var formattedTime =
    hours.toString().padStart(2, '0') +
    ':' +
    minutes.toString().padStart(2, '0') +
    ':' +
    remainingSeconds.toString().padStart(2, '0')

  return formattedTime
}

function checkDuty() {
  http
    .post('/CheckDuty/', {
      sdut_id: userStore.sdut_id
    })
    .then((res) => {
      // console.log(res.data)
      let data = res.data
      if (data.duty_state == '未值班') return

      userStore.$patch({
        is_login: true,
        duty_start_time: data.start_time,
        duty_state: data.duty_state
      })
      is_duty.value = true
      nowDuty.start_time = data.start_time
      nowDuty.duty_state = data.duty_state

      nowDuty.timer = setInterval(() => {
        nowDuty.pass_time = getTime(nowDuty.start_time)
      }, 1000)
    })
    .catch(function () {
      // console.log(error)
      errorAlert('检查签到状态失败')
    })
}

function displayApplyDuty(res) {
  applyDutyDrawer.value = res
}

function displayRecord(res) {
  exhibitDutyRecordDrawer.value = res
}

function showMyRecord() {
  displayRecord(true)
}

onMounted(() => {
  getDutyPauseState()
    .then((res) => {
      userStore.$patch({ duty_paused: pausedFrom(res) })
    })
    .catch(() => {})
  checkDuty()
})

onUnmounted(() => {
  // 页面销毁前，清除定时器
  clearInterval(nowDuty.timer)
})
</script>
<template>
  <div class="main-layout">
    <div class="start-duty animate__animated animate__fadeInDown">
      <div class="sigb-btn-box">
        <div
          v-if="!is_duty"
          class="sign-btn"
          :class="{ disabled: userStore.duty_paused }"
          @click="startDuty"
        >
          {{ userStore.duty_paused ? '已暂停' : '签到' }}
        </div>
        <div v-else class="sign-btn" @click="finishDuty">签退</div>
      </div>
      <div class="now-duty">
        <div class="now-duty-time">{{ is_duty ? nowDuty.pass_time : '未值班' }}</div>
        <el-divider class="duty_divider" />
        <div class="now-duty-state">
          {{ userStore.duty_paused ? '暂停值班中' : is_duty ? '值班中' : '快来值班吧~~' }}
        </div>
      </div>
      <div class="my-duty">
        <div class="record-btn my-duty-btn" @click="showMyRecord">值班记录</div>
        <!-- <div class="leave-btn my-duty-btn" @click="applyLeave">值班请假</div> -->
      </div>
    </div>
    <el-divider />
    <!-- <router-view name="Exhibition"></router-view> -->
    <exhibitDutyInfo> </exhibitDutyInfo>

    <exhibitDutyCalendar
      v-if="exhibitDutyRecordDrawer"
      :drawer="exhibitDutyRecordDrawer"
      @displayRecord="displayRecord"
    ></exhibitDutyCalendar>

    <applyDutyLeave
      v-if="applyDutyDrawer"
      :drawer="applyDutyDrawer"
      @displayApplyDuty="displayApplyDuty"
    ></applyDutyLeave>
  </div>
</template>

<style scoped>
.start-duty {
  width: 100%;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
.sigb-btn-box {
  width: 30%;
  /* width: 250px; */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.sign-btn.disabled {
  opacity: 0.55;
  cursor: not-allowed;
  color: #999;
  border-color: #999;
}
.sign-btn {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #008aff;
  border-radius: 4000px;
  border: 3px solid #008aff;
  background-color: white;
  /* box-shadow: 0 0 10px 10px hsla(208, 80%, 61%, 0.498); */
  transition:
    box-shadow 0.25s,
    transform 0.5s;
}
.now-duty {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 50px;
}

.record-btn {
  color: #008aff;
  background-color: white;
  border-radius: 30px;
  border: 3px solid #008aff;
}

.leave-btn {
  color: #008aff;
  background-color: white;
  border-radius: 30px;
  border: 3px solid #008aff;
}

.record-btn:hover {
  box-shadow: 0 0 10px 10px rgba(215, 215, 215, 0.694);
  transform: scale(1.05, 1.05);
}

.leave-btn:hover {
  box-shadow: 0 0 10px 10px rgba(215, 215, 215, 0.694);
  transform: scale(1.05, 1.05);
}

.main-layout {
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
}
.duty_divider {
  margin: 10px;
}
@media only screen and (min-width: 768px) {
  /* for dektop */
  .start-duty {
    height: 300px;
  }

  .sign-btn {
    width: 200px;
    height: 200px;
    font-size: 60px;
  }

  .sign-btn:hover {
    box-shadow: 0 0 10px 10px rgba(215, 215, 215, 0.694);
    transform: scale(1.05, 1.05);
  }

  .now-duty {
    width: 40%;
  }

  .now-duty-time {
    font-size: 30px;
  }
  .now-duty-state {
    border-radius: 25px;
    font-size: 50px;
    padding: 20px 20px;
    color: #008aff;
  }

  .my-duty {
    width: 30%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .my-duty-btn {
    font-size: 40px;
    padding: 20px;
    margin: 20px 0;
    transition:
      box-shadow 0.25s,
      transform 0.5s;
  }

  .record-btn {
    border-radius: 30px;
  }

  .leave-btn {
    border-radius: 30px;
  }
}
@media only screen and (max-width: 768px) {
  /* for phone */
  .start-duty {
    height: 320px;
    flex-direction: column;
  }

  .sign-btn {
    width: 120px;
    height: 120px;
    font-size: 35px;
  }

  .sign-btn:hover {
    box-shadow: 0 0 10px 10px rgba(215, 215, 215, 0.694);
    transform: scale(1.05, 1.05);
  }

  .now-duty {
    width: 100%;
  }

  .now-duty-time {
    font-size: 18px;
  }
  .now-duty-state {
    border-radius: 25px;
    font-size: 30px;
    color: #008aff;
  }

  .my-duty {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .my-duty-btn {
    font-size: 20px;
    padding: 15px;
    margin: 0 10px;
    transition:
      box-shadow 0.25s,
      transform 0.5s;
  }

  .record-btn {
    border-radius: 20px;
  }

  .leave-btn {
    border-radius: 20px;
  }
}
</style>
