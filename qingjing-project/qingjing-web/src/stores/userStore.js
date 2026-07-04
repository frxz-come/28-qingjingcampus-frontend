// src/stores/userStore.js
// 用户状态管理

import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
  const role = ref(localStorage.getItem('role') || '')

  function setLogin(data) {
    token.value = data.token
    userInfo.value = data.userInfo
    role.value = data.role
    localStorage.setItem('token', data.token)
    localStorage.setItem('userInfo', JSON.stringify(data.userInfo))
    localStorage.setItem('role', data.role)
  }

  function clearLogin() {
    token.value = ''
    userInfo.value = {}
    role.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
    localStorage.removeItem('role')
  }

  const isLoggedIn = () => !!token.value

  return {
    token,
    userInfo,
    role,
    setLogin,
    clearLogin,
    isLoggedIn
  }
})