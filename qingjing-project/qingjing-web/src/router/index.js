import { createRouter, createWebHistory } from 'vue-router'

// ========== 登录注册页面 ==========
import Login from '@/views/login/Login.vue'
import Register from '@/views/login/Register.vue'

// ========== 教师页面 ==========
import TeacherLayout from '@/views/teacher/TeacherLayout.vue'
import TeacherDashboard from '@/views/teacher/Dashboard.vue'
import ClassManage from '@/views/teacher/ClassManage.vue'
import StudentStats from '@/views/teacher/StudentStats.vue'

// ========== 教务主任页面 ==========
import DeanLayout from '@/views/dean/DeanLayout.vue'
import DeanDashboard from '@/views/dean/Dashboard.vue'
import SchoolManage from '@/views/dean/SchoolManage.vue'
import TeacherApproval from '@/views/dean/TeacherApproval.vue'

// ========== 运维页面 ==========
import OperatorLayout from '@/views/operator/OperatorLayout.vue'
import OperatorDashboard from '@/views/operator/Dashboard.vue'
import FeedbackManage from '@/views/operator/FeedbackManage.vue'
import ModelTrain from '@/views/operator/ModelTrain.vue'

// 路由配置
const routes = [
  // 根路径重定向到登录页
  { path: '/', redirect: '/login' },
  
  // 登录注册
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  
  // 教师路由
  {
    path: '/teacher',
    component: TeacherLayout,      // 教师布局（含侧边栏）
    children: [
      { path: '', redirect: '/teacher/dashboard' },
      { path: 'dashboard', name: 'TeacherDashboard', component: TeacherDashboard },      // 首页统计
      { path: 'class', name: 'ClassManage', component: ClassManage },                       // 班级管理
      { path: 'stats', name: 'StudentStats', component: StudentStats },                     // 学生统计
    ]
  },
  
  // 教务主任路由
  {
    path: '/dean',
    component: DeanLayout,
    children: [
      { path: '', redirect: '/dean/dashboard' },
      { path: 'dashboard', name: 'DeanDashboard', component: DeanDashboard },             // 数据大屏
      { path: 'school', name: 'SchoolManage', component: SchoolManage },                  // 学校管理
      { path: 'approval', name: 'TeacherApproval', component: TeacherApproval },            // 教师审批
    ]
  },
  
  // 运维路由
  {
    path: '/operator',
    component: OperatorLayout,
    children: [
      { path: '', redirect: '/operator/dashboard' },
      { path: 'dashboard', name: 'OperatorDashboard', component: OperatorDashboard },       // 运维首页
      { path: 'feedback', name: 'FeedbackManage', component: FeedbackManage },              // 反馈管理
      { path: 'model', name: 'ModelTrain', component: ModelTrain },                         // 模型训练
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router