// pages/learn/learn.js
// ============================================
// 学习卡片页面逻辑（对接后端 v2.1）
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

  onLoad(options) {
    this.loadOverview();
    
    // 如果从个人中心跳转过来，确保显示概览页（带进度）
    if (options && options.from === 'profile') {
      this.setData({ pageState: 'overview' });
    }
  },

  onShow() {
    // 检查是否从 profile 页面跳转过来
    const app = getApp();
    if (app.globalData.learnFromProfile) {
      app.globalData.learnFromProfile = false;
      this.setData({ pageState: 'overview' });
      this.loadOverview();
    } else {
      // 默认每次显示都刷新概览数据，确保进度最新
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

      const categories = (res.categories || []).map(item => ({
        mainCategory: item.mainCategory,
        cardCount: item.cardCount,
        studiedCount: item.studiedCount,
        coverImage: item.coverImage,
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

  startLearning() {
    const categories = this.data.overview.categories;
    const unfinishedCategory = categories.find(item => item.studiedCount < item.cardCount);
    if (unfinishedCategory) {
      this.setData({
        currentCategory: unfinishedCategory.mainCategory,
        pageState: 'list',
        loading: true
      });
      this.loadCardList(unfinishedCategory.mainCategory);
    } else {
      wx.showToast({ title: '恭喜！全部学习完成', icon: 'success' });
    }
  },

  loadCardList(mainCategory) {
    getCardList(mainCategory).then(res => {
      const items = (res.items || []).map(item => ({
        ...item,
        cardImage: item.cardImage
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
      const card = {
        ...res,
        cardImage: res.cardImage
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
      const currentCard = { ...this.data.currentCard, studied: true };
      this.setData({ currentCard });

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