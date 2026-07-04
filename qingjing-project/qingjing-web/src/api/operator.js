// src/api/operator.js
import request from './request'

export function getOperatorDashboard() {
  return request({ url: '/operator/dashboard', method: 'get' })
}

export function getFeedbackList(params) {
  return request({ url: '/operator/feedback', method: 'get', params })
}

export function getFeedbackDetail(feedbackId) {
  return request({ url: '/operator/feedback/' + feedbackId, method: 'get' })
}

export function processFeedback(feedbackId, data) {
  return request({
    url: '/operator/feedback/' + feedbackId,
    method: 'put',
    data
  })
}

export function batchProcessFeedback(data) {
  return request({ url: '/operator/feedback/batch', method: 'post', data })
}

export function exportFeedback(params) {
  return request({
    url: '/operator/feedback/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}