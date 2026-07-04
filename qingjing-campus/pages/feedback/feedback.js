// pages/feedback/feedback.js
// ============================================
// 识别反馈（对接后端 v2.1）
// 变更：resultId 替代 recordId；按单个检测框反馈
// ============================================

import { getFeedbackPrefill, submitFeedback } from '../../utils/api.js';

Page({
  data: {
    resultId: '',
    systemCategory: '',
    systemSubCategory: '',
    systemColor: '',
    correctCategory: '',
    description: '',
    supplementImage: '',
    loading: false,
    submitted: false
  },

  onLoad(options) {
    // v2.1: 使用 resultId（单个检测框）
    this.setData({
      resultId: options.resultId || '',
      systemCategory: decodeURIComponent(options.category || '未知'),
      systemSubCategory: decodeURIComponent(options.subCategory || '未知'),
      systemColor: decodeURIComponent(options.color || '#999999')
    });

    if (this.data.resultId) {
      getFeedbackPrefill(this.data.resultId).then(res => {
        this.setData({
          systemCategory: res.systemGarbageCategory,
          systemSubCategory: res.systemSubCategory,
          submitted: res.submitted
        });
      }).catch(() => {});
    }
  },

  onCategoryChange(e) {
    this.setData({ correctCategory: e.detail });
  },

  onCategoryClick(e) {
    this.setData({ correctCategory: e.currentTarget.dataset.name });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail });
  },

  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ supplementImage: res.tempFiles[0].tempFilePath });
      }
    });
  },

  deleteImage() {
    this.setData({ supplementImage: '' });
  },

  submitFeedback() {
    if (!this.data.correctCategory) {
      wx.showToast({ title: '请选择正确分类', icon: 'none' });
      return;
    }
    if (this.data.correctCategory === this.data.systemCategory) {
      wx.showToast({ title: '所选分类与系统一致，无需反馈', icon: 'none' });
      return;
    }

    this.setData({ loading: true });
    submitFeedback({
      resultId: this.data.resultId,           // v2.1: resultId
      correctCategory: this.data.correctCategory,
      description: this.data.description
    }).then(() => {
      this.setData({ loading: false });
      wx.showToast({ title: '反馈已提交', icon: 'success' });
      setTimeout(() => wx.navigateBack(), 1500);
    }).catch(() => {
      this.setData({ loading: false });
    });
  }
});