// pages/index/index.js
// ============================================
// 首页 - 垃圾拍照识别逻辑（对接后端 v2.1）
// 变更：sessionId 替代 recordId；detectedImage 优先展示；targets 含 resultId
// 新增：识别结果图片点击放大预览
// 修复：识别完成后重置为初始空状态
// ============================================

import { recognizeImage } from '../../utils/api.js';

Page({
  data: {
    imageUrl: '',
    isRecognizing: false,
    showResult: false,
    result: {
      sessionId: '',
      displayImage: '',
      originalImage: '',
      detectedImage: '',
      garbageCategory: '',
      subCategory: '',
      confidence: 0,
      confidencePercent: 0,
      disposalAdvice: '',
      categoryColor: '',
      targetCount: 0,
      targets: []
    }
  },

  onLoad() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  // 重置为初始空状态
  resetToEmpty() {
    this.setData({
      imageUrl: '',
      isRecognizing: false,
      showResult: false,
      result: {
        sessionId: '',
        displayImage: '',
        originalImage: '',
        detectedImage: '',
        garbageCategory: '',
        subCategory: '',
        confidence: 0,
        confidencePercent: 0,
        disposalAdvice: '',
        categoryColor: '',
        targetCount: 0,
        targets: []
      }
    });
  },

  chooseFromAlbum() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album'],
      success: (res) => {
        this.startRecognition(res.tempFiles[0].tempFilePath);
      },
      fail: () => {
        wx.showToast({ title: '选择取消', icon: 'none' });
      }
    });
  },

  takePhoto() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera'],
      success: (res) => {
        this.startRecognition(res.tempFiles[0].tempFilePath);
      },
      fail: () => {
        wx.showToast({ title: '拍照取消', icon: 'none' });
      }
    });
  },

  startRecognition(filePath) {
    this.setData({
      imageUrl: filePath,
      isRecognizing: true,
      showResult: false
    });
    recognizeImage(filePath).then(res => {
      this.showResult(res);
    }).catch(() => {
      wx.showToast({ title: '识别失败，请重试', icon: 'none' });
      // 识别失败也重置为空状态
      this.resetToEmpty();
    });
  },

  showResult(data) {
    const mainTarget = data.targets && data.targets.length > 0 ? data.targets[0] : {};
    const category = data.garbageCategory || mainTarget.garbageCategory || '未知';
    this.setData({
      isRecognizing: false,
      showResult: true,
      result: {
        sessionId: data.recordId || '',
        displayImage: data.detectedImage || data.originalImage || '',
        originalImage: data.originalImage || '',
        detectedImage: data.detectedImage || '',
        garbageCategory: category,
        subCategory: data.subCategory || mainTarget.subCategory || '',
        confidence: data.confidence || mainTarget.confidence || 0,
        confidencePercent: Math.round((data.confidence || mainTarget.confidence || 0) * 100),
        disposalAdvice: data.disposalAdvice || mainTarget.disposalAdvice || '',
        categoryColor: this.getCategoryColor(category),
        targetCount: data.targetCount || (data.targets ? data.targets.length : 0),
        targets: data.targets || []
      }
    });
    this.saveToHistory({
      id: data.recordId,
      imageUrl: this.data.imageUrl,
      originalImage: data.originalImage,
      detectedImage: data.detectedImage,
      garbageCategory: category,
      subCategory: data.subCategory || mainTarget.subCategory || '',
      confidence: data.confidence || mainTarget.confidence || 0,
      time: data.recognitionTime || new Date().toLocaleString(),
      color: this.getCategoryColor(category)
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

  // 关闭结果面板时重置为空状态
  closeResult() {
    this.resetToEmpty();
  },

  previewResultImage() {
    const { displayImage, originalImage } = this.data.result;
    const urls = [];
    if (displayImage) urls.push(displayImage);
    if (originalImage && originalImage !== displayImage) urls.push(originalImage);
    if (urls.length === 0) return;
    wx.previewImage({
      urls: urls,
      current: displayImage || urls[0]
    });
  },

  goFeedback() {
    const result = this.data.result;
    const mainTarget = result.targets[0];
    if (!mainTarget || !mainTarget.resultId) {
      wx.showToast({ title: '暂无识别记录', icon: 'none' });
      return;
    }
    // 先保存需要传递的数据
    const feedbackUrl = `/pages/feedback/feedback?resultId=${mainTarget.resultId}&category=${encodeURIComponent(result.garbageCategory)}&subCategory=${encodeURIComponent(result.subCategory)}&color=${encodeURIComponent(result.categoryColor)}`;
    // 重置为空状态
    this.resetToEmpty();
    // 跳转到反馈页
    wx.navigateTo({ url: feedbackUrl });
  },

  showHistory() {
    wx.navigateTo({ url: '/pages/history/history' });
  },

  saveToHistory(record) {
    let history = wx.getStorageSync('recognitionHistory') || [];
    history.unshift(record);
    if (history.length > 50) history = history.slice(0, 50);
    wx.setStorageSync('recognitionHistory', history);
  }
});