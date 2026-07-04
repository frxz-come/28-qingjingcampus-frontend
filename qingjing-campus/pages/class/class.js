// pages/class/class.js
// ============================================
// 班级页面（对接后端 v1.9）
// ============================================

import { getMyClass, joinClass, getClassRanking, leaveClass } from '../../utils/api.js';

Page({
    data: {
        loading: false,
        joined: false,
        classInfo: {},
        rankingList: [],
        inviteCode: ''
    },

    onLoad() {
        this.loadClassInfo();
    },

    onShow() {
        this.loadClassInfo();
    },

    // 加载班级信息
    loadClassInfo() {
        this.setData({ loading: true });
        getMyClass().then(res => {
            if (res.joined) {
                // 已入班，加载排名
                this.setData({
                    joined: true,
                    classInfo: {
                        classId: res.classId,
                        className: res.className,
                        grade: res.grade,
                        schoolName: res.schoolName,
                        studentCount: res.studentCount,
                        myRank: res.myRank,
                        coverImage: res.coverImage,
                        classIntro: res.classIntro
                    },
                    loading: false
                });
                this.loadRanking();
            } else {
                this.setData({
                    joined: false,
                    loading: false
                });
            }
        }).catch(err => {
            this.setData({ loading: false });
            console.error('获取班级信息失败', err);
        });
    },

    // 加载排名
    loadRanking() {
        getClassRanking().then(res => {
            this.setData({
                rankingList: res.items || [],
                classInfo: {
                    ...this.data.classInfo,
                    myRank: res.myRank,
                    totalStudents: res.totalStudents
                }
            });
        }).catch(err => {
            console.error('获取排名失败', err);
        });
    },

    // 输入邀请码
    onInviteCodeInput(e) {
        this.setData({ inviteCode: e.detail });
    },

    // 加入班级
    joinClass() {
        const code = this.data.inviteCode.trim();
        if (!/^\d{6}$/.test(code)) {
            wx.showToast({ title: '请输入6位数字邀请码', icon: 'none' });
            return;
        }
        wx.showLoading({ title: '加入中...' });
        joinClass(code).then(res => {
            wx.hideLoading();
            wx.showToast({ title: '加入成功', icon: 'success' });
            // 刷新班级信息
            this.loadClassInfo();
        }).catch(err => {
            wx.hideLoading();
            console.error('加入班级失败', err);
        });
    },

    // 退出班级（v1.9 新增：真实调用后端）
    leaveClass() {
        wx.showModal({
            title: '退出班级',
            content: '退出后将不再参与班级排名，确定退出？',
            confirmColor: '#EF4444',
            success: (res) => {
                if (res.confirm) {
                    wx.showLoading({ title: '退出中...' });
                    // 调用后端退出接口
                    leaveClass().then(() => {
                        wx.hideLoading();
                        wx.showToast({ title: '已退出班级', icon: 'success' });
                        // 刷新为未入班状态
                        this.setData({
                            joined: false,
                            classInfo: {},
                            rankingList: [],
                            inviteCode: ''
                        });
                    }).catch(err => {
                        wx.hideLoading();
                        console.error('退出班级失败', err);
                    });
                }
            }
        });
    }
});