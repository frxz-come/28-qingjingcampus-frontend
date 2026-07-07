// pages/history/history.js
// ============================================
// 识别历史（对接后端 v2.1）
// 变更：recordId 即 sessionId；图片已是 HTTPS 无需 fix
// ============================================

import { getHistory } from '../../utils/api.js';

Page({
  data: {
    historyList: [],
    loading: false,
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true
  },

  onLoad() {
    this.loadHistory();
  },

  onShow() {
    this.loadHistory(true);
  },

  loadHistory(refresh = false) {
    if (this.data.loading) return;
    const page = refresh ? 1 : this.data.page;
    this.setData({ loading: true });
    getHistory(page, this.data.pageSize).then(res => {
      const list = res.list || [];
      const formatted = list.map(item => ({
        ...item,
        confidencePercent: Math.round((item.confidence || 0) * 100),
        recognitionTime: this.formatTime(item.recognitionTime)
      }));
      this.setData({
        historyList: refresh ? formatted : [...this.data.historyList, ...formatted],
        total: res.total || 0,
        page: page + 1,
        hasMore: formatted.length >= this.data.pageSize,
        loading: false
      });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const date = new Date(timeStr);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  },

  viewDetail(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.historyList[index];
    // v2.1: 跳转到识别详情（sessionId），带上 recordId 用于热力图页调详情接口补全 detectedImage
    wx.navigateTo({
      url: `/pages/heatmap/heatmap?recordId=${item.recordId}&originalImage=${encodeURIComponent(item.originalImage)}&category=${encodeURIComponent(item.garbageCategory)}&subCategory=${encodeURIComponent(item.subCategory)}&color=${encodeURIComponent(this.getCategoryColor(item.garbageCategory))}&confidence=${item.confidencePercent}`
    });
  },

  getCategoryColor(category) {
    const map = {
      '可回收物': '#1E90FF',
      '有害垃圾': '#EF4444',
      '厨余垃圾': '#10B981',
      '其他垃圾': '#6B7280'
    };
    return map[category] || '#10B981';
  },

  goToScan() {
    wx.switchTab({ url: '/pages/index/index' });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadHistory();
    }
  }
});