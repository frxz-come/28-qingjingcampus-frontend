// utils/api.js
// ============================================
// 全局 API 封装文件（已按后端接口 v2.1 校准）
// ============================================

// ⚠️ 开发环境：改成你的后端 IP 或 HTTPS 穿透域名
// API 请求地址（与图片域名分离）
export const BASE_URL = 'http://192.168.238.40:8080';

function request(url, method = 'GET', data = {}, needAuth = false) {
  return new Promise((resolve, reject) => {
    const header = { 'Content-Type': 'application/json' };
    if (needAuth) {
      const token = wx.getStorageSync('token');
      if (token) header['Authorization'] = 'Bearer ' + token;
    }
    wx.request({
      url: BASE_URL + url,
      method: method,
      data: data,
      header: header,
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          resolve(res.data.data);
        } else {
          wx.showToast({ title: res.data.message || '请求失败', icon: 'none' });
          reject(res.data);
        }
      },
      fail: (err) => {
        wx.showToast({ title: '网络异常，请检查连接', icon: 'none' });
        reject(err);
      }
    });
  });
}

// ============================================
// 1. 健康检查
// ============================================
export const checkHealth = () => request('/api/health', 'GET');

// 2. AI 推理连通性
export const checkAIHealth = () => request('/api/health/ai', 'GET');

// ============================================
// 3. 认证相关
// ============================================
export const wxLogin = (code) => request('/api/auth/wx-login', 'POST', { code });

export const getProfile = () => request('/api/auth/profile', 'GET', {}, true);

export const updateProfile = (data) => request('/api/auth/profile', 'PUT', data, true);

export const uploadAvatar = (filePath) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.uploadFile({
      url: BASE_URL + '/api/auth/avatar',
      filePath: filePath,
      name: 'file',
      header: { Authorization: 'Bearer ' + token },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            resolve(data.data);
          } else {
            wx.showToast({ title: data.message || '上传失败', icon: 'none' });
            reject(data);
          }
        } catch (e) {
          wx.showToast({ title: '上传响应异常', icon: 'none' });
          reject(new Error('Invalid JSON response'));
        }
      },
      fail: reject
    });
  });
};

export const bindPhone = (phone) => request('/api/auth/bind-phone', 'POST', { phone }, true);

export const cancelAccount = () => request('/api/auth/cancel-account', 'POST', { confirm: true }, true);

// ============================================
// 4. 拍照识别（v2.1）
// ============================================
export const recognizeImage = (filePath) => {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    wx.uploadFile({
      url: BASE_URL + '/api/recognition/recognize',
      filePath: filePath,
      name: 'file',
      header: { Authorization: 'Bearer ' + token },
      success: (res) => {
        try {
          const data = JSON.parse(res.data);
          if (data.code === 200) {
            resolve(data.data);
          } else {
            wx.showToast({ title: data.message || '识别失败', icon: 'none' });
            reject(data);
          }
        } catch (e) {
          wx.showToast({ title: '识别响应异常', icon: 'none' });
          reject(new Error('Invalid JSON response'));
        }
      },
      fail: reject
    });
  });
};

export const getHistory = (page = 1, pageSize = 10) => request(`/api/recognition/history?page=${page}&pageSize=${pageSize}`, 'GET', {}, true);

export const getRecognitionDetail = (recordId) => request(`/api/recognition/${recordId}`, 'GET', {}, true);

// ============================================
// 5. 反馈相关（v2.1：resultId 替代 recordId）
// ============================================
export const getFeedbackPrefill = (resultId) => request(`/api/feedback/prefill/${resultId}`, 'GET', {}, true);

export const submitFeedback = (data) => request('/api/feedback/submit', 'POST', data, true);

// ============================================
// 6. 学习卡片（v2.1：删除 by-sub-category）
// ============================================
export const getStudyOverview = () => request('/api/study/overview', 'GET', {}, true);

export const getCardList = (mainCategory) => request('/api/study/cards?mainCategory=' + encodeURIComponent(mainCategory), 'GET', {}, true);

export const getCardDetail = (cardId) => request('/api/study/cards/' + cardId, 'GET', {}, true);

// v2.1 已删除：getCardBySubCategory
// export const getCardBySubCategory = (mainCategory, subCategory) => ...

export const markCardStudied = (cardId) => request('/api/study/cards/' + cardId + '/study', 'POST', {}, true);

// ============================================
// 7. 班级相关
// ============================================
export const getMyClass = () => request('/api/class/my', 'GET', {}, true);

export const joinClass = (inviteCode) => request('/api/class/join', 'POST', { inviteCode }, true);

export const leaveClass = () => request('/api/class/leave', 'POST', { confirm: true }, true);

export const getClassRanking = () => request('/api/class/ranking', 'GET', {}, true);
// 修改绑定手机号（换绑）
export const changePhone = (phone) => request('/api/auth/phone', 'PUT', { phone }, true);

// ============================================
// 导出默认对象
// ============================================
export default {
  checkHealth,
  checkAIHealth,
  wxLogin,
  getProfile,
  changePhone,
  updateProfile,
  uploadAvatar,
  bindPhone,
  cancelAccount,
  recognizeImage,
  getHistory,
  getRecognitionDetail,
  getFeedbackPrefill,
  submitFeedback,
  getStudyOverview,
  getCardList,
  getCardDetail,
  markCardStudied,
  getMyClass,
  joinClass,
  leaveClass,
  getClassRanking
};