// src/api/common.js
// 公共接口

import request from './request'

// 校验邀请码
export function validateInviteCode(inviteCode) {
    return request({ url: '/invite-code/validate', method: 'post', data: { inviteCode } })
}

// 获取垃圾分类类别列表
export function getCategories(params) {
    return request({ url: '/categories', method: 'get', params })
}

// 获取垃圾分类详情
export function getCategoryDetail(categoryId) {
    return request({ url: '/categories/' + categoryId, method: 'get' })
}

// 搜索垃圾分类
export function searchCategories(keyword) {
    return request({ url: '/categories/search', method: 'get', params: { keyword } })
}

// 获取文件上传预签名 URL
export function getUploadPresign(params) {
    return request({ url: '/upload/presign', method: 'get', params })
}

// 获取学校列表
export function getSchools(params) {
    return request({ url: '/schools', method: 'get', params })
}