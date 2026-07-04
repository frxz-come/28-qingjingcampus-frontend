// src/api/dean.js
// 教务主任相关接口

import request from './request'

// 获取数据大屏总览
export function getDeanDashboard() {
  return request({ url: '/dean/dashboard', method: 'get' })
}

// 获取校内教师列表
export function getTeacherList(params) {
  return request({ url: '/dean/teachers', method: 'get', params })
}

// 移除教师
export function removeTeacher(teacherId) {
  return request({ url: '/dean/teacher/' + teacherId, method: 'delete' })
}

// 生成教师入校邀请码
export function generateTeacherCode(data) {
  return request({ url: '/dean/invite-code', method: 'post', data })
}

// 重置教师邀请码
export function resetTeacherCode(data) {
  return request({ url: '/dean/invite-code/reset', method: 'post', data })
}

// 获取全校统计数据
export function getSchoolStats(params) {
  return request({ url: '/dean/school-stats', method: 'get', params })
}

// 导出全校数据 Excel
export function exportSchoolData(params) {
  return request({ url: '/dean/export', method: 'get', params, responseType: 'blob' })
}

// 获取周报
export function getWeeklyReport(params) {
  return request({ url: '/dean/weekly-report', method: 'get', params })
}

// 获取历史周报列表
export function getWeeklyReports(params) {
  return request({ url: '/dean/weekly-reports', method: 'get', params })
}