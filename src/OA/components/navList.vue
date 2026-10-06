<script setup>
import { RouterLink } from 'vue-router'
import { useUserStore } from 'store/store.js'
const emit = defineEmits(['displayHeaderNav'])
let userStore = useUserStore()
function Logout() {
  localStorage.removeItem('YoutholAccessToken')
  userStore.$patch({ sdut_id: '', is_login: false })
  window.location.href = import.meta.env.BASE_URL
}

function close() {
  emit('displayHeaderNav', false)
}
</script>
<template>
  <el-scrollbar>
    <!-- <router-link to="/">
              <div class="home nav-item">首页</div>
            </router-link> -->

    <router-link to="/duty">
      <div class="duty nav-item" @click="close">值班</div>
    </router-link>

    <router-link to="/room" v-if="userStore.identity == '管理员'">
      <div class="room nav-item" @click="close">房间借用</div>
    </router-link>

    <router-link to="/DutyRecord" v-if="userStore.identity == '管理员'">
      <div class="DutyRecord nav-item" @click="close">签到记录</div>
    </router-link>

    <router-link to="/schedule-query" v-if="userStore.identity == '管理员'">
      <div class="schedule-query nav-item" @click="close">排班查询</div>
    </router-link>

    <router-link to="/RoomManage" v-if="userStore.identity == '管理员'">
      <div class="MachineManage nav-item" @click="close">房间借用记录</div>
    </router-link>

    <router-link to="/MemberManage" v-if="userStore.identity == '管理员'">
      <div class="MemberManage nav-item" @click="close">成员管理</div>
    </router-link>

    <router-link to="/leave-adjust">
      <div class="leave-adjust nav-item" @click="close">请假调班</div>
    </router-link>

    <router-link to="/leave-record" v-if="userStore.identity == '管理员'">
      <div class="leave-record nav-item" @click="close">请假记录</div>
    </router-link>

    <router-link to="/pause-duty" v-if="userStore.identity == '管理员'">
      <div class="pause-duty nav-item" @click="close">暂停值班</div>
    </router-link>

    <div class="logout nav-item" @click="Logout">退出登录</div>
  </el-scrollbar>
</template>

<style scoped>
@media only screen and (min-width: 768px) {
  .nav-item {
    margin: 3px 0;
    width: 100%;
    padding: 20px 0px;
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    transition:
      transform 0.3s,
      box-shadow 0.3s;
  }

  .nav-item:hover {
    opacity: 1;
    box-shadow: inset 0 0 20px rgba(255, 255, 255, 0.7);
    transform: scale(1.05, 1.05);
  }
}
@media only screen and (max-width: 768px) {
  .nav-item {
    margin: 3px 0;
    width: 100%;
    padding: 20px 0px;
    color: #008aff;
    font-weight: 800;
    font-size: 20px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: center;
    transition:
      transform 0.3s,
      box-shadow 0.3s;
  }

  .nav-item:hover {
    opacity: 1;
    box-shadow: inset 0 0 20px #57b1ff6f;
    transform: scale(1.05, 1.05);
  }
}
</style>
