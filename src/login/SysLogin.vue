<script setup>
// import { storeToRef, defineStore } from 'pinia'
// import { useUserStore } from '../store/user.js'
// import { FormRules } from 'element-plus'
import 'animate.css'

import { ref, onMounted } from 'vue'
import { http } from 'assets/js/http.js' //配置了基本的设置

import loginBox from './components/loginBox.vue'
import changePassword from './components/changePassword.vue'

let box_state = ref(true)

function verifySignIn() {
  if (!localStorage.getItem('YoutholAccessToken')) {
    return Promise.resolve(false)
  }

  return http
    .post('/GetUserInfo/', {})
    .then(() => true)
    .catch(() => false)
}

function switchBox(res) {
  box_state.value = res
  console.log(box_state.value)
}

// 生命周期
onMounted(async () => {
  if (await verifySignIn()) {
    window.location.href = import.meta.env.BASE_URL
  }
})
</script>

<template>
  <div class="main_layout">
    <loginBox v-if="box_state" @isLogin="switchBox"></loginBox>
    <changePassword v-else></changePassword>
  </div>
</template>

<style scoped>
@media only screen and (min-width: 768px) {
  /* for desktop */
}

@media only screen and (max-width: 768px) {
  /* for phone */
}
</style>
