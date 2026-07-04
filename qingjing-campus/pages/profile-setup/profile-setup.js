// pages/profile-setup/profile-setup.js
// ============================================
// 完善资料页
// ============================================

import { uploadAvatar, updateProfile, bindPhone } from '../../utils/api.js';

Page({
  data: {
    avatarUrl: '',
    avatarTempPath: '',
    nickname: '',
    phone: '',
    saving: false
  },

  onLoad() {
    const userInfoStr = wx.getStorageSync('userInfo');
    if (userInfoStr) {
      try {
        const userInfo = JSON.parse(userInfoStr);
        this.setData({
          avatarUrl: userInfo.avatarUrl || '',
          nickname: userInfo.nickname || '',
          phone: userInfo.phone || ''
        });
      } catch (e) {
        console.error('解析用户信息失败', e);
      }
    }
  },

  onChooseAvatar(e) {
    const tempPath = e.detail.avatarUrl;
    this.setData({
      avatarTempPath: tempPath,
      avatarUrl: tempPath
    });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail });
  },

  onGetPhoneNumber(e) {
    if (e.detail.errMsg !== 'getPhoneNumber:ok' || !e.detail.code) {
      wx.showToast({ title: '未授权手机号', icon: 'none' });
      return;
    }

    wx.showLoading({ title: '绑定中...' });
    
    bindPhone(e.detail.code).then(res => {
      wx.hideLoading();
      this.setData({ phone: res.phone });
      wx.showToast({ title: '手机号绑定成功', icon: 'success' });
    }).catch(err => {
      wx.hideLoading();
      console.error('绑定手机号失败', err);
      wx.showToast({ title: '绑定失败，请重试', icon: 'none' });
    });
  },

  async onSaveProfile() {
    const { avatarTempPath, nickname, phone } = this.data;

    if (!nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }

    this.setData({ saving: true });
    wx.showLoading({ title: '保存中...' });

    try {
      if (avatarTempPath) {
        await uploadAvatar(avatarTempPath);
      }

      await updateProfile({
        nickname: nickname.trim(),
        studentName: nickname.trim()
      });

      const userInfo = {
        token: wx.getStorageSync('token'),
        studentId: wx.getStorageSync('studentId'),
        nickname: nickname.trim(),
        studentName: nickname.trim(),
        phone: phone,
        avatarUrl: this.data.avatarUrl
      };
      wx.setStorageSync('userInfo', JSON.stringify(userInfo));

      wx.hideLoading();
      this.setData({ saving: false });

      wx.showToast({
        title: '保存成功',
        icon: 'success',
        success: () => {
          setTimeout(() => {
            wx.switchTab({ url: '/pages/index/index' });
          }, 500);
        }
      });

    } catch (e) {
      wx.hideLoading();
      this.setData({ saving: false });
      console.error('保存失败', e);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
    }
  },

  onSkip() {
    wx.showModal({
      title: '提示',
      content: '跳过后可在「个人中心」完善资料',
      confirmText: '继续',
      cancelText: '去完善',
      success: (res) => {
        if (res.confirm) {
          wx.switchTab({ url: '/pages/index/index' });
        }
      }
    });
  }
});