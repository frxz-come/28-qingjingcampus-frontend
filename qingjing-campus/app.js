// app.js
// ============================================
// 小程序全局入口
// ============================================

App({
  // 全局数据
  globalData: {
    userInfo: null,
    isLoggedIn: false
  },

  onLaunch() {
    console.log('青净校园小程序启动');
    
    // 检查本地是否有 token
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.isLoggedIn = true;
    }
  },

  // 全局提示方法
  showToast(title, icon = 'none') {
    wx.showToast({ title, icon });
  }
});