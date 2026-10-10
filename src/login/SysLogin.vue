<script setup>
import 'animate.css'

import { ref, onMounted } from 'vue'
import { getYoutholerInfo } from 'assets/js/oaApi.js'
import { getToken, clearToken } from 'assets/js/token.js'
import { isAdminIdentity } from 'OA/session.js'

import loginBox from './components/loginBox.vue'
import changePassword from './components/changePassword.vue'

let box_state = ref(true)

function homeFor(info) {
  const base = import.meta.env.BASE_URL || '/'
  const admin = isAdminIdentity(info?.identity, info?.position)
  return admin ? `${base}OA/#/MemberManage` : `${base}OA/#/duty`
}

function switchBox(res) {
  box_state.value = res
}

onMounted(async () => {
  if (!getToken()) return
  try {
    const res = await getYoutholerInfo()
    window.location.replace(homeFor(res.data))
  } catch {
    clearToken()
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
