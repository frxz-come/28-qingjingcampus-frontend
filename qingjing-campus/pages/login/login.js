// pages/login/login.js
// ============================================
// 登录页面逻辑（仅微信一键登录，对接后端 v1.9）
// 修复：退出重登不再误判为新用户，只信任后端 isNewUser 字段
// ============================================

import { wxLogin, updateProfile, uploadAvatar } from '../../utils/api.js';

Page({
  data: {
    loading: false
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    if (token) {
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  // 微信一键登录
  onWxLogin() {
    this.setData({ loading: true });
    wx.login({
      success: (res) => {
        if (!res.code) {
          this.setData({ loading: false });
          wx.showToast({ title: '获取微信登录凭证失败', icon: 'none' });
          return;
        }

        wxLogin(res.code).then(result => {
          this.setData({ loading: false });
          wx.setStorageSync('token', result.token);
          wx.setStorageSync('studentId', result.studentId);

          // 修复：严格信任后端返回的 isNewUser，不再用 nickname 兜底判断
          if (result.isNewUser === true) {
            // 新用户或注销后重新激活：需要完善资料
            this.showWxInfoConfirm(result);
          } else {
            // 老用户：直接保存完整信息并进入首页
            this.handleLoginSuccess(result);
            wx.showToast({ title: '登录成功', icon: 'success' });
          }

        }).catch(err => {
          this.setData({ loading: false });
          if (err.code === 503) {
            wx.showModal({
              title: '提示',
              content: '后端暂未配置微信登录，请检查后端 WECHAT_APP_ID 配置',
              showCancel: false
            });
          } else if (err.code === 404 || err.code === 400) {
            // 后端未启动或wx登录失败，Mock模式
            const mockUser = {
              token: 'mock_wx_token_' + Date.now(),
              studentId: 'wx_' + Date.now(),
              studentName: '微信用户',
              phone: '',
              nickname: '微信用户',
              avatarUrl: '',
              isNewUser: true,  // Mock 用户标记为新用户
              studiedCardCount: 0,
              totalRecognitionCount: 0
            };
            wx.setStorageSync('token', mockUser.token);
            wx.setStorageSync('studentId', mockUser.studentId);
            this.showWxInfoConfirm(mockUser);
          }
        });
      },
      fail: () => {
        this.setData({ loading: false });
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      }
    });
  },

  // 弹窗：是否使用微信头像昵称
  showWxInfoConfirm(userInfo) {
    wx.showModal({
      title: '完善资料',
      content: '是否使用微信绑定的头像和昵称？',
      confirmText: '一键使用',
      cancelText: '手动填写',
      confirmColor: '#10B981',
      success: (res) => {
        if (res.confirm) {
          this.autoFillWxInfo(userInfo);
        } else {
          // 手动填写：直接进入首页，用户可在个人中心编辑
          this.completeLogin('微信用户', '', '');
          wx.switchTab({ url: '/pages/index/index' });
        }
      }
    });
  },

  // 自动获取微信信息并填充
  async autoFillWxInfo(userInfo) {
    wx.showLoading({ title: '获取微信信息...' });
    try {
      const wxUserInfo = await this.getWxUserInfo();
      const profileData = {
        nickname: wxUserInfo.nickName || '微信用户',
        studentName: wxUserInfo.nickName || '微信用户'
      };
      await updateProfile(profileData);
      
      // 上传头像
      if (wxUserInfo.avatarUrl) {
        const localPath = await this.downloadImage(wxUserInfo.avatarUrl);
        await uploadAvatar(localPath);
      }
      
      wx.hideLoading();
      
      // 询问是否绑定手机号
      wx.showModal({
        title: '绑定手机号',
        content: '是否现在绑定手机号？绑定后可使用更多功能',
        confirmText: '去绑定',
        cancelText: '暂不绑定',
        confirmColor: '#10B981',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/bind-phone/bind-phone?autoBack=true'
            });
          } else {
            wx.setStorageSync('phoneBindSkipped', true);
            this.completeLogin(wxUserInfo.nickName, wxUserInfo.avatarUrl, '');
          }
        }
      });
    } catch (e) {
      wx.hideLoading();
      console.error('获取微信信息失败', e);
      wx.showToast({ title: '获取失败，请手动填写', icon: 'none' });
      this.completeLogin('微信用户', '', '');
    }
  },

  // 获取微信用户信息
  getWxUserInfo() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          resolve(res.userInfo);
        },
        fail: (err) => {
          // 用户拒绝，使用默认值
          resolve({
            nickName: '微信用户',
            avatarUrl: ''
          });
        }
      });
    });
  },

  // 下载网络图片到本地
  downloadImage(url) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: url,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.tempFilePath);
          } else {
            reject(new Error('下载失败'));
          }
        },
        fail: reject
      });
    });
  },

  // 完成登录，保存用户信息
  completeLogin(nickname, avatarUrl, phone) {
    const userInfo = {
      token: wx.getStorageSync('token'),
      studentId: wx.getStorageSync('studentId'),
      nickname: nickname || '微信用户',
      studentName: nickname || '微信用户',
      avatarUrl: avatarUrl || '',
      phone: phone || '',
      studiedCardCount: 0,
      totalRecognitionCount: 0
    };
    wx.setStorageSync('userInfo', JSON.stringify(userInfo));
    const app = getApp();
    app.globalData.isLoggedIn = true;
    app.globalData.userInfo = userInfo;
    wx.switchTab({ url: '/pages/index/index' });
  },

  // 统一登录成功处理（老用户直接调用）
  handleLoginSuccess(userInfo) {
    wx.setStorageSync('token', userInfo.token);
    wx.setStorageSync('userInfo', JSON.stringify(userInfo));
    const app = getApp();
    app.globalData.isLoggedIn = true;
    app.globalData.userInfo = userInfo;
    wx.switchTab({ url: '/pages/index/index' });
  }
});