// pages/heatmap/heatmap.js
import { getRecognitionDetail } from '../../utils/api.js';

Page({
  data: {
    originalImage: '',
    detectedImage: '',
    category: '',
    subCategory: '',
    categoryColor: '',
    confidencePercent: 0,
    disposalAdvice: '',
    loading: false,
    imageLoading: {
      original: false,
      detected: false
    }
  },

  onLoad(options) {
    const detectedImage = decodeURIComponent(options.detectedImage || '');
    const originalImage = decodeURIComponent(options.originalImage || '');

    this.setData({
      originalImage: originalImage,
      detectedImage: detectedImage || originalImage,
      category: decodeURIComponent(options.category || ''),
      subCategory: decodeURIComponent(options.subCategory || ''),
      categoryColor: decodeURIComponent(options.color || '#10B981'),
      confidencePercent: options.confidence || 0,
      disposalAdvice: decodeURIComponent(options.disposalAdvice || '')
    });

    // 如果从识别记录进入（无 detectedImage 但有 recordId），调详情接口补全
    const recordId = options.recordId;
    if (!detectedImage && recordId) {
      this.loadDetail(recordId);
    }
  },

  loadDetail(recordId) {
    this.setData({ loading: true });
    getRecognitionDetail(recordId).then(res => {
      const detected = res.detectedImage || '';
      if (detected) {
        this.setData({
          detectedImage: detected
        });
      }
      if (res.disposalAdvice) {
        this.setData({ disposalAdvice: res.disposalAdvice });
      }
      this.setData({ loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  // 图片加载开始
  onImageLoadStart(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      [`imageLoading.${type}`]: true
    });
  },

  // 图片加载完成
  onImageLoad(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      [`imageLoading.${type}`]: false
    });
  },

  // 图片加载失败
  onImageError(e) {
    const type = e.currentTarget.dataset.type;
    this.setData({
      [`imageLoading.${type}`]: false
    });
    if (type === 'original') {
      this.setData({ originalImage: '' });
    } else if (type === 'detected') {
      this.setData({ detectedImage: '' });
    }
  },

  // 预览图片
  previewImage(e) {
    const type = e.currentTarget.dataset.type;
    let url = '';
    if (type === 'original') {
      url = this.data.originalImage;
    } else if (type === 'detected') {
      url = this.data.detectedImage;
    }
    if (!url) return;

    const urls = [this.data.originalImage, this.data.detectedImage]
      .filter(u => u && typeof u === 'string' && u.startsWith('http'));
    if (urls.length === 0) {
      wx.showToast({ title: '图片暂无法预览', icon: 'none' });
      return;
    }
    wx.previewImage({
      urls: urls,
      current: url
    });
  },

  goBack() {
    wx.navigateBack();
  }
});