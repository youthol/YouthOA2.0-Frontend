<script setup>
import 'animate.css'
import { successAlert, errorAlert } from 'assets/js/message.js'
import { reactive, ref, onUnmounted } from 'vue'
import { http } from 'assets/js/http.js' //配置了基本的设置
import { getToken, clearToken } from 'assets/js/token.js'

let formData = ref({
  origin_pwd: '',
  new_pwd: '',
  again_pwd: ''
})

const verifyEmpty = (rule, value, callback) => {
  if (value === '') {
    callback(new Error(''))
  }
  callback()
}

let is_changed = false

const ruleFormRef = ref()

const rules = reactive({
  origin_pwd: [
    { validator: verifyEmpty, required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  new_pwd: [{ validator: verifyEmpty, required: true, message: '请输入新密码', trigger: 'blur' }],
  again_pwd: [
    { validator: verifyEmpty, required: true, message: '请再次输入密码', trigger: 'blur' }
  ]
})

function postChangePwd() {
  http
    .post(
      '/ChangePassword/',
      {
        password: formData.value.origin_pwd,
        new_pwd: formData.value.new_pwd,
        again_pwd: formData.value.again_pwd,
        first_login: true
      },
      {
        headers: {
          Authorization: 'Bearer ' + getToken()
        }
      }
    )
    .then((res) => {
      let data = res.data

      if (data.message == '两次密码不一致') {
        errorAlert('两次输入的密码不一致，请重新输入')
      } else if (data.message == '修改成功') {
        is_changed = true
        successAlert('修改成功')
        //跳转到首页
        window.location.href = import.meta.env.BASE_URL
      } else if (data.message == '原密码错误') {
        errorAlert('原密码错误')
      } else {
        errorAlert('修改失败')
      }
    })
    .catch(function (error) {
      console.log(error)
    })
}

function checkSame() {
  if (formData.value.new_pwd != formData.value.again_pwd) {
    return false
  }
  return true
}

const changPwd = async (formEl) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      if (checkSame()) {
        postChangePwd()
      } else {
        errorAlert('两次输入的密码不一致，请重新输入')
      }
    } else {
      console.log('error submit!', fields)
    }
  })
  //   postAddOneYoutholer()
}

onUnmounted(() => {
  if (is_changed == false) {
    // 现在假定这个页面只有第一次登陆的用户才会访问
    // 清除本地的 token ，强制修改密码
    clearToken()
  }
})
</script>
<template>
  <div class="login-box animate__animated animate__fadeIn">
    <img src="assets/img/youthol.png" alt="" class="youthol-logo" />
    <el-form
      ref="ruleFormRef"
      :model="formData"
      status-icon
      :rules="rules"
      class="form"
      label-position="right"
      label-width="100px"
    >
      <!-- <div class="username-box box-content"> -->
      <el-form-item class="form-item" label="原密码：" prop="origin_pwd">
        <el-input
          class="input-box"
          v-model="formData.origin_pwd"
          placeholder="请输入原密码"
          autocomplete="off"
        />
      </el-form-item>
      <!-- </div> -->
      <!-- <div class="password-box box-content"> -->
      <el-form-item class="form-item" label="新密码：" prop="new_pwd">
        <el-input
          class="input-box"
          v-model="formData.new_pwd"
          type="password"
          placeholder="请输入新密码"
          autocomplete="off"
          error="错误"
          show-message="true"
          show-password
        />
      </el-form-item>
      <!-- </div> -->
      <!-- <div class="password-box box-content"> -->
      <el-form-item class="form-item" label="再次输入：" prop="again_pwd">
        <el-input
          class="input-box"
          v-model="formData.again_pwd"
          type="password"
          placeholder="请再次输入密码"
          autocomplete="off"
          error="错误"
          show-message="true"
          show-password
        />
      </el-form-item>
      <!-- </div> -->
    </el-form>
    <el-button class="login-btn" type="primary" plain @click="changPwd(ruleFormRef)"
      >确认修改</el-button
    >
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
    width: 120px;
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
