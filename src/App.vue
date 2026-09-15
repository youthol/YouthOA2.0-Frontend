<script setup>
// import { userRouter } from 'vue-router'
import { onMounted } from 'vue'
import { useUserStore } from './store/store.js'
import YoutholTitle from './components/YoutholTitle.vue'
import { http } from './assets/js/http.js' //配置了基本的设置

function toLogin() {
  window.location.href = `${import.meta.env.BASE_URL}login/`
}

function toOA() {
  window.location.href = `${import.meta.env.BASE_URL}OA/`
}

let store = useUserStore()

function verifySignIn() {
  const accessToken = localStorage.getItem('YoutholAccessToken')

  if (!accessToken) {
    store.$patch({ sdut_id: 'no id', is_login: false })
    return
  }

  http
    .post(
      '/GetUserInfo/',
      {},
      {
        headers: {
          Authorization: 'Bearer ' + accessToken
        }
      }
    )
    .then((res) => {
      // 在这里设置 Pinia状态？
      store = useUserStore()
      store.$patch({ sdut_id: res.data.sdut_id, is_login: true })
      console.log('已登录')
    })
    .catch(function (error) {
      console.log(error)
      store.$patch({ sdut_id: 'no id', is_login: false })
    })
}

function logout() {
  localStorage.removeItem('YoutholAccessToken')
  store.$patch({ sdut_id: '', is_login: false })
}

function openPage(res) {
  window.location.href = res
}

onMounted(() => {
  verifySignIn()
})
</script>
<template>
  <div class="main-layout">
    <YoutholTitle></YoutholTitle>
    <!-- <div class="hello-title">Youthol</div> -->
    <div class="divider"></div>
    <div class="choice-list animate__animated animate__backInUp">
      <div v-if="store.is_login" class="choice" @click="toOA">OA系统</div>
      <!-- <div class="choice">我要投稿</div> -->
      <!-- <a href=""></a> -->
      <div class="choice" @click="openPage('https://youthol.online/student-service/')">
        学生服务
      </div>
      <div
        class="choice"
        @click="openPage('http://youthlab-sdut-edu-cn-s.newvpn.sdut.edu.cn:8118/spa/fdy/#/')"
      >
        辅导员风采
      </div>
      <div class="choice" @click="openPage('https://youth.sdut.edu.cn/6995/list.htm')">
        关于我们
      </div>
    </div>
    <div class="sign-box animate__animated animate__backInUp">
      <div v-if="store.is_login" class="sign-btn" @click="logout">退出</div>
      <div v-else class="sign-btn" @click="toLogin">登录</div>
    </div>
  </div>
</template>

<style scoped>
@media only screen and (min-width: 768px) {
  .sign-btn {
    margin: 30px;
    padding: 15px 25px;
    font-size: 30px;
    border: 2px solid white;
    border-radius: 15px;
  }

  .sign-btn:hover {
    background-color: white;
    color: #008aff;
    border: 2px solid 008aff;
  }
  .divider {
    margin: 10px;
    width: 80%;
    border: 1px solid white;
  }
  .main-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .choice-list {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .choice {
    color: white;
    margin: 10px;
    font-size: 25px;
  }
}

@media only screen and (max-width: 768px) {
  .sign-btn {
    margin: 30px;
    padding: 10px 18px;
    font-size: 25px;
    border: 2px solid white;
    border-radius: 15px;
  }

  .sign-btn:hover {
    background-color: white;
    color: #008aff;
    border: 2px solid 008aff;
  }
  .divider {
    margin: 10px;
    width: 80%;
    border: 1px solid white;
  }
  .main-layout {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .choice-list {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .choice {
    margin: 8px;
    font-size: 16px;
  }
}
</style>
