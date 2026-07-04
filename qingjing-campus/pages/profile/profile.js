// pages/profile/profile.js
// ============================================
// 个人中心（对接后端 v2.1）
// 修复：1) 补充 cancelAccount 导入 2) 统一 URL 补全逻辑
// 新增：手机号换绑功能（使用 PUT /api/auth/phone 接口）
// ============================================

import { getProfile, updateProfile, uploadAvatar, cancelAccount, bindPhone, changePhone, BASE_URL } from '../../utils/api.js';

Page({
  data: {
    userInfo: {},
    editing: false,
    tempNickname: '',
    tempStudentName: '',
    loading: false,
    avatarLoading: false,
    avatarUrlTs: 0,
    // 换绑手机号相关
    showPhonePopup: false,
    phoneInput: '',
    bindingPhone: false
  },

  onLoad() {
    this.loadProfile();
  },

  onShow() {
    this.loadProfile();
  },

  loadProfile() {
    this.setData({ loading: true });
    getProfile().then(res => {
      wx.setStorageSync('userInfo', JSON.stringify(res));
      this.setData({
        userInfo: res,
        loading: false,
        avatarUrlTs: Date.now()
      });
    }).catch(() => {
      const cached = wx.getStorageSync('userInfo');
      if (cached) {
        try {
          this.setData({
            userInfo: JSON.parse(cached),
            loading: false,
            avatarUrlTs: Date.now()
          });
        } catch (e) {
          this.setData({ loading: false });
        }
      } else {
        this.setData({ loading: false });
      }
    });
  },

  onEdit() {
    this.setData({
      editing: true,
      tempNickname: this.data.userInfo.nickname || '',
      tempStudentName: this.data.userInfo.studentName || ''
    });
  },

  onNicknameInput(e) {
    this.setData({ tempNickname: e.detail });
  },

  onNameInput(e) {
    this.setData({ tempStudentName: e.detail });
  },

  onSaveProfile() {
    const { tempNickname, tempStudentName } = this.data;
    const nickname = (tempNickname || '').trim();
    const studentName = (tempStudentName || '').trim();
    if (!nickname && !studentName) {
      wx.showToast({ title: '请至少填写一项', icon: 'none' });
      return;
    }
    wx.showLoading({ title: '保存中...' });
    updateProfile({ nickname, studentName }).then(res => {
      wx.hideLoading();
      wx.setStorageSync('userInfo', JSON.stringify(res));
      this.setData({ userInfo: res, editing: false });
      wx.showToast({ title: '保存成功', icon: 'success' });
    }).catch(() => {
      wx.hideLoading();
    });
  },

  onCancel() {
    this.setData({ editing: false });
  },

  // ============================================
  // 头像上传
  // ============================================
  onChooseAvatar(e) {
    console.log('【头像】chooseAvatar 事件:', e);
    const tempPath = e.detail.avatarUrl;
    if (!tempPath) {
      wx.showToast({ title: '获取头像失败', icon: 'none' });
      return;
    }
    console.log('【头像】临时路径:', tempPath);
    if (tempPath.startsWith('http')) {
      this.downloadAndUpload(tempPath);
    } else {
      this.doUploadAvatar(tempPath);
    }
  },

  downloadAndUpload(url) {
    wx.showLoading({ title: '获取头像中...' });
    wx.downloadFile({
      url: url,
      success: (res) => {
        wx.hideLoading();
        if (res.statusCode === 200) {
          console.log('【头像】下载成功:', res.tempFilePath);
          this.doUploadAvatar(res.tempFilePath);
        } else {
          wx.showToast({ title: '获取头像失败', icon: 'none' });
        }
      },
      fail: (err) => {
        wx.hideLoading();
        console.error('【头像】下载失败:', err);
        wx.showToast({ title: '获取头像失败', icon: 'none' });
      }
    });
  },

  doUploadAvatar(tempFilePath) {
    this.setData({ avatarLoading: true });
    wx.showLoading({ title: '上传中...' });
    console.log('【头像】开始上传:', tempFilePath);
    uploadAvatar(tempFilePath).then(res => {
      wx.hideLoading();
      console.log('【头像】上传返回:', res);
      let avatarUrl = this.extractAvatarUrl(res);
      console.log('【头像】解析出的 URL:', avatarUrl);
      if (!avatarUrl) {
        this.setData({ avatarLoading: false });
        wx.showToast({ title: '上传数据异常', icon: 'none' });
        return;
      }
      avatarUrl = this.completeUrl(avatarUrl);
      console.log('【头像】完整 URL:', avatarUrl);
      const oldInfo = this.data.userInfo;
      this.setData({
        userInfo: { ...oldInfo, avatarUrl: '' },
        avatarLoading: false
      });
      setTimeout(() => {
        const newInfo = { ...oldInfo, avatarUrl: avatarUrl };
        wx.setStorageSync('userInfo', JSON.stringify(newInfo));
        this.setData({
          userInfo: newInfo,
          avatarUrlTs: Date.now()
        });
        wx.showToast({ title: '上传成功', icon: 'success' });
        setTimeout(() => {
          this.loadProfile();
        }, 1000);
      }, 100);
    }).catch((err) => {
      wx.hideLoading();
      this.setData({ avatarLoading: false });
      console.error('【头像】上传失败:', err);
      wx.showToast({ title: '上传失败', icon: 'none' });
    });
  },

  extractAvatarUrl(res) {
    if (!res) return null;
    if (typeof res === 'string') return res;
    if (res.avatarUrl) return res.avatarUrl;
    if (res.url) return res.url;
    if (res.fileUrl) return res.fileUrl;
    if (res.path) return res.path;
    if (res.data) {
      if (typeof res.data === 'string') return res.data;
      if (res.data.avatarUrl) return res.data.avatarUrl;
      if (res.data.url) return res.data.url;
      if (res.data.fileUrl) return res.data.fileUrl;
    }
    return null;
  },

  completeUrl(url) {
    if (!url) return url;
    if (url.startsWith('http')) return url;
    return url.startsWith('/') ? BASE_URL + url : BASE_URL + '/' + url;
  },

  onAvatarLoadError(e) {
    console.error('【头像】图片加载失败:', e);
    const info = this.data.userInfo;
    if (info.avatarUrl) {
      this.setData({
        userInfo: { ...info, avatarUrl: '' }
      });
    }
  },

  // ============================================
  // 手机号绑定/换绑功能（新增）
  // ============================================

  // 点击绑定/换绑手机号
  goBindPhone() {
    const { userInfo } = this.data;
    if (userInfo.phone) {
      // 已绑定，显示换绑弹窗
      wx.showModal({
        title: '换绑手机号',
        content: `当前已绑定：${userInfo.phone}\n是否更换手机号？`,
        confirmText: '更换',
        cancelText: '取消',
        confirmColor: '#10B981',
        success: (res) => {
          if (res.confirm) {
            this.setData({
              showPhonePopup: true,
              phoneInput: ''
            });
          }
        }
      });
    } else {
      // 未绑定，直接显示绑定弹窗
      this.setData({
        showPhonePopup: true,
        phoneInput: ''
      });
    }
  },

  // 关闭换绑弹窗
  onClosePhonePopup() {
    this.setData({
      showPhonePopup: false,
      phoneInput: ''
    });
  },

  // 手机号输入
  onPhoneInput(e) {
    this.setData({ phoneInput: e.detail });
  },

  // 确认绑定/换绑
  onConfirmBindPhone() {
    const { phoneInput, userInfo } = this.data;
    const phone = phoneInput.trim();

    // 手机号格式校验
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的11位手机号', icon: 'none' });
      return;
    }

    // 如果新手机号与当前一致，提示无需更换
    if (phone === userInfo.phone) {
      wx.showToast({ title: '新手机号与当前一致', icon: 'none' });
      return;
    }

    this.setData({ bindingPhone: true });
    wx.showLoading({ title: userInfo.phone ? '换绑中...' : '绑定中...' });

    // 根据是否已绑定选择接口
    const apiCall = userInfo.phone ? changePhone(phone) : bindPhone(phone);

    apiCall.then(res => {
      wx.hideLoading();
      this.setData({ bindingPhone: false });

      // 更新本地用户信息
      const newUserInfo = { ...userInfo, phone: res.phone || phone };
      wx.setStorageSync('userInfo', JSON.stringify(newUserInfo));

      this.setData({
        userInfo: newUserInfo,
        showPhonePopup: false,
        phoneInput: ''
      });

      wx.showToast({
        title: userInfo.phone ? '换绑成功' : '绑定成功',
        icon: 'success'
      });
    }).catch(err => {
      wx.hideLoading();
      this.setData({ bindingPhone: false });
      console.error('【换绑/绑定失败】完整错误:', err);
      
      // 根据后端错误码显示具体错误信息
      let errMsg = '操作失败，请重试';
      if (err.code === 400) {
        if (err.message && err.message.includes('尚未绑定手机号')) {
          errMsg = '您尚未绑定手机号，请使用绑定接口';
        } else if (err.message && err.message.includes('与当前绑定号码相同')) {
          errMsg = '新手机号与当前绑定号码相同';
        } else if (err.message && err.message.includes('已被其他账号绑定')) {
          errMsg = '该手机号已被其他账号绑定';
        } else if (err.message && err.message.includes('手机号格式不正确')) {
          errMsg = '手机号格式不正确';
        } else if (err.message && err.message.includes('已绑定手机号')) {
          errMsg = '您已绑定手机号，请使用换绑功能';
        } else {
          errMsg = err.message || '请求参数错误';
        }
      } else if (err.code === 401) {
        errMsg = '登录已过期，请重新登录';
      } else if (err.code === 503) {
        errMsg = '手机号加密未配置，请联系管理员';
      }
      
      wx.showToast({
        title: errMsg,
        icon: 'none',
        duration: 2000
      });
    });
  },

  // ============================================
  // 页面跳转
  // ============================================
  goToHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  goToClass() {
    wx.navigateTo({ url: '/pages/class/class' });
  },

  goToLearn() {
    wx.switchTab({ url: '/pages/learn/learn' });
  },

  // ============================================
  // 退出/注销
  // ============================================
  onLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.removeStorageSync('phoneBindSkipped');
          wx.removeStorageSync('studentId');
          const app = getApp();
          app.globalData.isLoggedIn = false;
          app.globalData.userInfo = null;
          wx.reLaunch({ url: '/pages/login/login' });
        }
      }
    });
  },

  onCancelAccount() {
    wx.showModal({
      title: '注销账号',
      content: '注销后账号将不可用，历史数据保留但无法恢复，确定注销？',
      confirmColor: '#EF4444',
      success: (res) => {
        if (res.confirm) {
          wx.showModal({
            title: '二次确认',
            content: '请再次确认注销账号，此操作不可撤销！',
            confirmColor: '#EF4444',
            success: (res2) => {
              if (res2.confirm) {
                wx.showLoading({ title: '注销中...' });
                cancelAccount().then(() => {
                  wx.hideLoading();
                  wx.removeStorageSync('token');
                  wx.removeStorageSync('userInfo');
                  wx.removeStorageSync('phoneBindSkipped');
                  wx.removeStorageSync('studentId');
                  wx.showToast({ title: '账号已注销', icon: 'success' });
                  setTimeout(() => {
                    wx.reLaunch({ url: '/pages/login/login' });
                  }, 1500);
                }).catch(() => {
                  wx.hideLoading();
                });
              }
            }
          });
        }
      }
    });
  }
});