<template>
  <el-container class="operator-layout">
    <el-header class="layout-header">
      <div class="header-left">
        <span class="logo">🌿</span>
        <span class="system-name">青净校园</span>
        <el-divider direction="vertical" />
        <span class="role-tag" style="background: #fee2e2; color: #991b1b;">运维端</span>
      </div>
      <div class="header-right">
        <span class="user-name">{{ userInfo.name }}</span>
        <el-dropdown @command="handleCommand">
          <el-avatar :size="32" :src="userInfo.avatar || defaultAvatar" />
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>
    <el-container>
      <el-aside width="220px" class="layout-aside">
        <el-menu :default-active="activeMenu" router class="operator-menu" background-color="#1f2937" text-color="#9ca3af" active-text-color="#10b981">
          <el-menu-item index="/operator/dashboard">
            <el-icon><Monitor /></el-icon>
            <span>系统监控</span>
          </el-menu-item>
          <el-menu-item index="/operator/feedback">
            <el-icon><Message /></el-icon>
            <span>反馈管理</span>
          </el-menu-item>
        </el-menu>
      </el-aside>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Monitor, Message } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/userStore'
import { logout } from '@/api/auth'
import defaultAvatar from '@/assets/operator-avatar.png'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activeMenu = computed(() => route.path)
const userInfo = computed(() => userStore.userInfo)

async function handleCommand(command) {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
      logout()
      userStore.clearLogin()
      router.push('/login')
      ElMessage.success('已退出登录')
    } catch {}
  }
}
</script>

<style scoped>
.operator-layout { height: 100vh; }
.layout-header { display: flex; align-items: center; justify-content: space-between; background: #fff; border-bottom: 1px solid #e4e7ed; }
.header-left { display: flex; align-items: center; gap: 12px; }
.logo { font-size: 28px; }
.system-name { font-size: 20px; font-weight: bold; color: #10b981; }
.role-tag { font-size: 14px; padding: 2px 10px; border-radius: 4px; }
.header-right { display: flex; align-items: center; gap: 12px; }
.layout-aside { background: #1f2937; }
.operator-menu { border-right: none; }
.layout-main { background: #f5f7fa; padding: 20px; overflow-y: auto; }
</style>