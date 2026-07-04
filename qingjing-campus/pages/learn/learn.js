// pages/learn/learn.js
// ============================================
// 学习卡片页面逻辑（对接后端 v2.1）
// 变更：删除 by-sub-category；图片已是 HTTPS 无需 fix；配图 .webp
// ============================================

import { getStudyOverview, getCardList, getCardDetail, markCardStudied } from '../../utils/api.js';

Page({
  data: {
    pageState: 'overview',
    overview: {
      totalCardCount: 0,
      studiedCardCount: 0,
      progressPercent: 0,
      categories: []
    },
    currentCategory: '',
    cardList: [],
    currentCard: {},
    currentIndex: 0,
    loading: false
  },

  onLoad() {
    this.loadOverview();
  },

  onShow() {
    if (this.data.pageState === 'overview') {
      this.loadOverview();
    }
  },

  loadOverview() {
    this.setData({ loading: true });
    getStudyOverview().then(res => {
      const totalCardCount = res.totalCardCount || 0;
      const studiedCardCount = res.studiedCardCount || 0;
      const progressPercent = totalCardCount > 0
        ? Math.round((studiedCardCount / totalCardCount) * 100)
        : 0;
      // v2.1: 图片已是 HTTPS COS 地址，无需 fixImageUrl
      const categories = (res.categories || []).map(item => ({
        mainCategory: item.mainCategory,
        cardCount: item.cardCount,
        studiedCount: item.studiedCount,
        coverImage: item.coverImage,      // 直接使用，已是 HTTPS
        progressPercent: item.cardCount > 0
          ? Math.round((item.studiedCount / item.cardCount) * 100)
          : 0
      }));
      this.setData({
        overview: {
          totalCardCount: totalCardCount,
          studiedCardCount: studiedCardCount,
          progressPercent: progressPercent,
          categories: categories
        },
        loading: false
      });
    }).catch(err => {
      this.setData({ loading: false });
      console.error('获取学习概览失败', err);
    });
  },

  onCategoryTap(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category,
      pageState: 'list',
      loading: true
    });
    this.loadCardList(category);
  },

  loadCardList(mainCategory) {
    getCardList(mainCategory).then(res => {
      // v2.1: 图片已是 HTTPS，直接使用
      const items = (res.items || []).map(item => ({
        ...item,
        cardImage: item.cardImage         // 直接使用
      }));
      this.setData({
        cardList: items,
        loading: false
      });
    }).catch(err => {
      this.setData({ loading: false });
      console.error('获取卡片列表失败', err);
    });
  },

  onCardTap(e) {
    const index = e.currentTarget.dataset.index;
    const card = this.data.cardList[index];
    this.setData({
      currentIndex: index,
      pageState: 'detail',
      loading: true
    });
    this.loadCardDetail(card.cardId);
  },

  loadCardDetail(cardId) {
    getCardDetail(cardId).then(res => {
      // v2.1: 图片已是 HTTPS，直接使用
      const card = {
        ...res,
        cardImage: res.cardImage           // 直接使用
      };
      this.setData({
        currentCard: card,
        loading: false
      });
    }).catch(err => {
      this.setData({ loading: false });
      console.error('获取卡片详情失败', err);
    });
  },

  onMarkStudied() {
    const cardId = this.data.currentCard.cardId;
    if (!cardId) return;
    
    this.setData({ loading: true });
    markCardStudied(cardId).then(res => {
      this.setData({ loading: false });
      
      // 更新当前卡片状态
      const currentCard = { ...this.data.currentCard, studied: true };
      this.setData({ currentCard });
      
      // 更新列表状态
      const cardList = this.data.cardList.map((card, idx) => {
        if (idx === this.data.currentIndex) {
          return { ...card, studied: true };
        }
        return card;
      });
      this.setData({ cardList });
      
      wx.showToast({ title: '学习完成', icon: 'success' });
      
      if (res.nextCardId) {
        setTimeout(() => {
          const nextIndex = cardList.findIndex(c => c.cardId === res.nextCardId);
          if (nextIndex !== -1) {
            this.setData({ currentIndex: nextIndex, loading: true });
            this.loadCardDetail(res.nextCardId);
          } else {
            this.setData({ loading: true });
            this.loadCardDetail(res.nextCardId);
          }
        }, 1000);
      } else {
        setTimeout(() => {
          wx.showModal({
            title: '恭喜',
            content: '本类卡片已全部学完！',
            showCancel: false,
            success: () => {
              this.setData({ pageState: 'overview' });
              this.loadOverview();
            }
          });
        }, 1000);
      }
    }).catch(err => {
      this.setData({ loading: false });
      console.error('标记已学失败', err);
    });
  },

  backToOverview() {
    this.setData({ pageState: 'overview' });
    this.loadOverview();
  },

  backToList() {
    this.setData({ pageState: 'list' });
  },

  prevCard() {
    if (this.data.currentIndex > 0) {
      const newIndex = this.data.currentIndex - 1;
      this.setData({ currentIndex: newIndex, loading: true });
      this.loadCardDetail(this.data.cardList[newIndex].cardId);
    }
  },

  nextCard() {
    if (this.data.currentIndex < this.data.cardList.length - 1) {
      const newIndex = this.data.currentIndex + 1;
      this.setData({ currentIndex: newIndex, loading: true });
      this.loadCardDetail(this.data.cardList[newIndex].cardId);
    }
  }
});