// src/api/auth.js
// 登录、注册相关接口

import request from './request'

// 教师/教务主任/运维 通用登录
export function login(data) {
  return request({ url: '/auth/login', method: 'post', data })
}

// 通用注册
export function register(data) {
  return request({ url: '/auth/register', method: 'post', data })
}

// 退出登录
export function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
  localStorage.removeItem('role')
}

// 获取当前用户信息
export function getUserInfo() {
  return request({ url: '/auth/me', method: 'get' })
}