# SDUT Database Systems Project Front End

axios 的配置信息位于 `src/assets/js/http.js`。默认使用同源的 `/youthol` 后端路径；需要接入其他后端时，设置构建环境变量 `VITE_API_BASE_URL`。
```js
import axios from 'axios'

export const http = axios // 导出 http， 这样在组件中就可以直接使用 http 了
http.defaults.withCredentials = true // 让 axios 携带 cookie
http.defaults.baseURL = 'api.example' //初始化基础地址


// 后端使用 token 鉴权，因此需要设置请求头，在这里进行判断
let accessToken = localStorage.getItem('YourToken')
// 判断是否为空
if (accessToken === null || accessToken === undefined || accessToken === '') {
  // YourToken 为空的情况
  console.log('暂未登录')
} else {
  // YourToken 不为空的情况
  http.defaults.headers.common['Authorization'] =
    'Bearer ' + localStorage.getItem('YourToken')
}

```

## Overview


