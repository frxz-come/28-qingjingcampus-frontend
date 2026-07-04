// src/api/teacher.js
import request from './request'

export function getTeacherInfo() {
  return request({ url: '/teacher/info', method: 'get' })
}

export function getTeacherDashboard() {
  return request({ url: '/teacher/dashboard', method: 'get' })
}

export function getClassList() {
  return request({ url: '/teacher/classes', method: 'get' })
}

export function createClass(data) {
  return request({ url: '/teacher/class', method: 'post', data })
}

export function getStudentStats(classId, params) {
  return request({ url: '/teacher/stats/' + classId, method: 'get', params })
}

export function getStudentDetail(studentId) {
  return request({ url: '/teacher/student/' + studentId, method: 'get' })
}

export function removeStudents(classId, studentIds) {
  return request({
    url: '/teacher/class/' + classId + '/students',
    method: 'delete',
    data: { studentIds }
  })
}

export function resetClassCode(classId, expireDays = 0) {
  return request({
    url: '/teacher/class/' + classId + '/reset-code',
    method: 'post',
    data: { expireDays }
  })
}

export function getClassRanking(classId) {
  return request({ url: '/teacher/class/' + classId + '/ranking', method: 'get' })
}

export function exportClassData(classId, params) {
  return request({
    url: '/teacher/class/' + classId + '/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}