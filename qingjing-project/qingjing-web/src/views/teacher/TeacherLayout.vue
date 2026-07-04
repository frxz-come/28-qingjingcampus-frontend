<template>
  <el-container class="teacher-layout">
    <el-header class="layout-header">
      <div class="header-left">
        <span class="logo">🌿</span>
        <span class="system-name">青净校园</span>
        <el-divider direction="vertical" />
        <span class="role-tag">教师端</span>
      </div>
      <div class="header-right">
        <span class="user-name">{{ userInfo.name }}</span>
        <el-dropdown @command="handleCommand">
          <el-avatar :size="32" :icon="UserFilled" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人资料</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="layout-aside">
        <el-menu
          :default-active="activeMenu"
          router
          class="teacher-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/teacher/dashboard">
            <el-icon><HomeFilled /></el-icon>
            <span>班级概述</span>
          </el-menu-item>
          <el-menu-item index="/teacher/class">
            <el-icon><School /></el-icon>
            <span>班级管理</span>
          </el-menu-item>
          <el-menu-item index="/teacher/stats">
            <el-icon><DataAnalysis /></el-icon>
            <span>学生数据统计</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="layout-main">
        <router-view v-slot="{ Component }">
          <keep-alive>
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { UserFilled, HomeFilled, School, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { logout } from '@/api/auth'
import { getTeacherInfo } from '@/api/teacher'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const userInfo = computed(() => userStore.userInfo)

async function loadTeacherInfo() {
  try {
    const res = await getTeacherInfo()
    userStore.userInfo = { ...userStore.userInfo, ...res.data }
  } catch (e) {
    console.error('加载教师信息失败:', e)
  }
}

async function handleCommand(command) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      logout()
      userStore.clearLogin()
      router.push('/login')
      ElMessage.success('已退出登录')
    } catch {}
  } else if (command === 'profile') {
    ElMessage.info('个人资料功能开发中')
  }
}

onMounted(() => {
  loadTeacherInfo()
})
</script>

<style scoped>
.teacher-layout { height: 100vh; }
.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}
.header-left { display: flex; align-items: center; gap: 12px; }
.logo { font-size: 28px; }
.system-name { font-size: 20px; font-weight: bold; color: #10b981; }
.role-tag { font-size: 14px; color: #666; background: #f0f9ff; padding: 2px 10px; border-radius: 4px; }
.header-right { display: flex; align-items: center; gap: 12px; }
.user-name { color: #666; font-size: 14px; }
.layout-aside { background: #304156; }
.teacher-menu { border-right: none; }
.layout-main { background: #f5f7fa; padding: 20px; overflow-y: auto; }
</style>