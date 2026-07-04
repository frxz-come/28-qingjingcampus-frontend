// pages/bind-phone/bind-phone.js
// ============================================
// 绑定手机号页面（直接输入手机号，无验证码，对接后端 v1.9）
// ============================================
import { bindPhone } from '../../utils/api.js';

Page({
  data: {
    phone: '',
    binding: false,
    autoBack: false
  },

  onLoad(options) {
    if (options.autoBack) {
      this.setData({ autoBack: true });
    }
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail });
  },

  onBindPhone() {
    const { phone } = this.data;
    // 手机号格式校验
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      wx.showToast({ title: '请输入正确的11位手机号', icon: 'none' });
      return;
    }

    this.setData({ binding: true });
    wx.showLoading({ title: '绑定中...' });

    bindPhone(phone).then(res => {
      wx.hideLoading();
      this.setData({ binding: false });
      // 保存返回的用户信息
      wx.setStorageSync('userInfo', JSON.stringify(res));
      wx.showToast({
        title: '绑定成功',
        icon: 'success',
        success: () => {
          if (this.data.autoBack) {
            setTimeout(() => {
              wx.switchTab({ url: '/pages/index/index' });
            }, 500);
          } else {
            setTimeout(() => {
              wx.navigateBack();
            }, 500);
          }
        }
      });
    }).catch(err => {
      wx.hideLoading();
      this.setData({ binding: false });
      if (err.code === 400) {
        wx.showToast({ title: err.message || '绑定失败', icon: 'none' });
      } else {
        wx.showToast({ title: '绑定失败，请重试', icon: 'none' });
      }
    });
  },

  onSkip() {
    wx.setStorageSync('phoneBindSkipped', true);
    if (this.data.autoBack) {
      wx.switchTab({ url: '/pages/index/index' });
    } else {
      wx.navigateBack();
    }
  }
});