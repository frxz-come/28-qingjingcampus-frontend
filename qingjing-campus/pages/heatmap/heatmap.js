// pages/heatmap/heatmap.js
Page({
  data: {
    originalImage: '',
    heatmapImage: '',
    category: '',
    subCategory: '',
    categoryColor: '',
    confidencePercent: 0
  },

  onLoad(options) {
    // 解码所有参数
    const originalImage = decodeURIComponent(options.originalImage || '');
    const heatmapImage = decodeURIComponent(options.heatmapImage || '');
    
    this.setData({
      originalImage: originalImage,
      // 如果没有热力图，先用原图占位（后续后端提供真实热力图）
      heatmapImage: heatmapImage || originalImage,
      category: decodeURIComponent(options.category || ''),
      subCategory: decodeURIComponent(options.subCategory || ''),
      categoryColor: decodeURIComponent(options.color || '#10B981'),
      confidencePercent: options.confidence || 0
    });
  },

  // 图片加载失败时显示占位图
  onImageError(e) {
    const type = e.currentTarget.dataset.type;
    if (type === 'original') {
      this.setData({ originalImage: '' }); // 清空，wxml 中可以用 wx:if 显示占位
    } else {
      this.setData({ heatmapImage: '' });
    }
  },

  previewImage(e) {
    const type = e.currentTarget.dataset.type;
    const url = type === 'original' ? this.data.originalImage : this.data.heatmapImage;
    if (!url) return;
    
    wx.previewImage({
      urls: [this.data.originalImage, this.data.heatmapImage].filter(Boolean),
      current: url
    });
  },

  goBack() {
    wx.navigateBack();
  }
});