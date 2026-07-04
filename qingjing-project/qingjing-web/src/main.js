import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import OperatorDashboard from './views/operator/Dashboard.vue'
import FeedbackManage from './views/operator/FeedbackManage.vue'
import ModelTrain from './views/operator/ModelTrain.vue'

const app = createApp(App)

// 注册所有 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 使用插件
app.use(createPinia())
app.use(ElementPlus, { locale: zhCn })

// 创建路由
import { createRouter, createWebHistory } from 'vue-router'

import Login from './views/login/Login.vue'
import Register from './views/login/Register.vue'
import TeacherLayout from './views/teacher/TeacherLayout.vue'
import TeacherDashboard from './views/teacher/Dashboard.vue'
import ClassManage from './views/teacher/ClassManage.vue'
import StudentStats from './views/teacher/StudentStats.vue'
import DeanLayout from './views/dean/DeanLayout.vue'
import DeanDashboard from './views/dean/Dashboard.vue'
import SchoolManage from './views/dean/SchoolManage.vue'
import TeacherApproval from './views/dean/TeacherApproval.vue'
import OperatorLayout from './views/operator/OperatorLayout.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'Login', component: Login },
    { path: '/register', name: 'Register', component: Register },
    {
      path: '/teacher',
      component: TeacherLayout,
      children: [
        { path: '', redirect: '/teacher/dashboard' },
        { path: 'dashboard', name: 'TeacherDashboard', component: TeacherDashboard },
        { path: 'class', name: 'ClassManage', component: ClassManage },
        { path: 'stats', name: 'StudentStats', component: StudentStats }
      ]
    },
    {
      path: '/dean',
      component: DeanLayout,
      children: [
        { path: '', redirect: '/dean/dashboard' },
        { path: 'dashboard', name: 'DeanDashboard', component: DeanDashboard },
        { path: 'school', name: 'SchoolManage', component: SchoolManage },
        { path: 'approval', name: 'TeacherApproval', component: TeacherApproval }
      ]
    },
    {
      path: '/operator',
      component: OperatorLayout,
      children: [
        { path: '', redirect: '/operator/dashboard' },
        { path: 'dashboard', name: 'OperatorDashboard', component: OperatorDashboard },
        { path: 'feedback', name: 'FeedbackManage', component: FeedbackManage },
        { path: 'model', name: 'ModelTrain', component: ModelTrain }
      ]
    }
  ]
})

app.use(router)
app.mount('#app')