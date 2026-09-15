<script setup>
import 'animate.css'
import { successAlert, errorAlert } from 'assets/js/message.js'
import { reactive, ref } from 'vue'
import { http } from 'assets/js/http.js' //配置了基本的设置

const emit = defineEmits(['isLogin'])

let formData = ref({
  username: '',
  password: ''
})

const verifyUsername = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入用户名'))
  }
  callback()
}

const verifyPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  }
  callback()
}

const rules = reactive({
  username: [{ validator: verifyUsername, message: '请输入用户名', trigger: 'blur' }],
  password: [{ validator: verifyPassword, message: '请输入密码', trigger: 'blur' }]
})

function signIn() {
  if (formData.value.username == '') {
    errorAlert('请输入账号')
    return
  }
  if (formData.value.password == '') {
    errorAlert('请输入密码')
    return
  }
  http
    .post('/SignIn/', {
      username: formData.value.username,
      password: formData.value.password
    })
    .then((res) => {
      let data = res.data
      let token = data.access_token

      if (data.SignState == '初次登录') {
        errorAlert('首次登录，请修改密码')
        localStorage.setItem('YoutholAccessToken', token)
        emit('isLogin', false)
      } else if (data.SignState == '登录成功') {
        successAlert('登录成功')
        //存储 token
        localStorage.setItem('YoutholAccessToken', token)
        //跳转到首页
        window.location.href = import.meta.env.BASE_URL
      } else if (data.SignState == '账号或密码错误') {
        errorAlert('账号或密码错误')
      } else {
        errorAlert('未知错误')
      }
    })
    .catch(function () {
      errorAlert('登录请求失败，请稍后重试')
    })
}
</script>
<template>
  <div class="login-box animate__animated animate__fadeIn">
    <img src="assets/img/youthol.png" alt="" class="youthol-logo" />
    <el-form :model="formData" status-icon :rules="rules" class="form">
      <div class="username-box box-content">
        <el-form-item class="form-item" label="账号：" prop="username">
          <el-input
            class="input-box"
            v-model="formData.username"
            placeholder="请输入账号"
            autocomplete="off"
          />
        </el-form-item>
      </div>
      <div class="password-box box-content">
        <el-form-item class="form-item" label="密码：" prop="password">
          <el-input
            class="input-box"
            v-model="formData.password"
            type="password"
            placeholder="请输入密码"
            autocomplete="off"
            error="错误"
            show-message="true"
            show-password
          />
        </el-form-item>
      </div>
    </el-form>
    <el-button class="login-btn" type="primary" plain @click="signIn">登录</el-button>
  </div>
</template>

<style scoped>
@media only screen and (min-width: 768px) {
  /* for desktop */
  .login-box {
    background-color: white;
    margin: 30vh auto 0;
    padding: 20px;
    width: 500px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 20px;
    box-shadow: 0 0 40px 0 rgba(77, 77, 77, 0.452);
  }

  .box-content {
    width: 100%;
    padding: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .youthol-logo {
    margin: 0 0 30px;
    width: 30%;
    height: auto;
  }

  .form-item {
    display: flex;
    align-items: center;
    width: 70%;
  }
  .input-box {
    height: 35px;
    width: 100%;
  }

  .login-btn {
    width: 100px;
    height: 40px;
    margin: 20px 0 10px;
    padding: 20px 5px;
    font-size: 22px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    /* margin-left: 0 !important; */
  }
}

@media only screen and (max-width: 768px) {
  /* for phone */
  .login-box {
    background-color: white;
    margin: 30vh auto 0;
    /* padding: 20px; */
    width: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    border-radius: 20px;
    /* box-shadow: 0 0 40px 0 rgba(77, 77, 77, 0.452); */
  }

  .box-content {
    width: 100%;
    padding: 5px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .form {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .youthol-logo {
    margin: 0 0 30px;
    width: 150px;
    height: auto;
  }

  .form-item {
    display: flex;
    align-items: center;
    width: 70%;
  }
  .input-box {
    height: 35px;
    width: 100%;
  }

  .login-btn {
    width: 100px;
    height: 40px;
    margin: 20px 0 10px;
    padding: 20px 5px;
    font-size: 22px;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    /* margin-left: 0 !important; */
  }
}
</style>
