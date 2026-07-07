<template>
  <div class="login-page">
    <div class="login-left">
      <!-- 全屏背景图 -->
      <img src="@/assets/login-bg.png" class="bg-image" alt="背景" />
      
      <!-- 文字内容层，放在上方天空区域 -->
      <div class="brand">
        <h1>青净校园</h1>
        <p>生活垃圾智能分类与投放辅助系统</p>
        <div class="features">
          <div class="feature-item">
            <el-icon><Camera /></el-icon>
            <span>AI 智能识别</span>
          </div>
          <div class="feature-item">
            <el-icon><Reading /></el-icon>
            <span>垃圾分类学习</span>
          </div>
          <div class="feature-item">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据统计分析</span>
          </div>
        </div>
      </div>
    </div>
    <div class="login-right">
      <div class="login-box">
        <h2>欢迎登录</h2>
        <el-radio-group v-model="loginForm.role" class="role-select">
          <el-radio-button label="teacher">教师</el-radio-button>
          <el-radio-button label="dean">教务主任</el-radio-button>
          <el-radio-button label="operator">运维人员</el-radio-button>
        </el-radio-group>
        <el-form :model="loginForm" :rules="rules" ref="formRef" class="login-form">
          <el-form-item prop="account">
            <el-input v-model="loginForm.account" placeholder="请输入账号" :prefix-icon="User" size="large" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" size="large" show-password @keyup.enter="handleLogin" />
          </el-form-item>
          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          </div>
          <el-form-item>
            <el-button type="primary" size="large" class="login-btn" :loading="loading" @click="handleLogin">登 录</el-button>
          </el-form-item>
        </el-form>
        <div class="login-footer">
          <span>还没有账号？</span>
          <el-link type="primary" @click="goRegister">立即注册</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Camera, Reading, DataAnalysis } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { login } from '@/api/auth'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref(null)
const loading = ref(false)
const rememberMe = ref(false)

const loginForm = reactive({
  role: 'teacher',
  account: '',
  password: ''
})

const rules = {
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    { min: 3, max: 20, message: '账号长度 3-20 位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度 6-20 位', trigger: 'blur' }
  ]
}

async function handleLogin() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await login({
      role: loginForm.role,
      account: loginForm.account,
      password: loginForm.password
    })
    userStore.setLogin(res.data)
    ElMessage.success(res.message)

    const role = res.data.role
    if (role === 'teacher') router.push('/teacher')
    else if (role === 'dean') router.push('/dean')
    else if (role === 'operator') router.push('/operator')
  } catch (e) {
    console.error('登录失败:', e)
  } finally {
    loading.value = false
  }
}

function goRegister() {
  router.push('/register')
}
</script>

<style scoped>
.login-page { display: flex; height: 100vh; }

.login-left {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

/* 全屏背景图 */
.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
}

/* 文字内容层，定位在上方天空区域 */
.brand {
  position: relative;
  z-index: 1;
  text-align: center;
  color: #fff;
  padding-top: 60px;
  width: 100%;
}

.brand h1 {
  font-size: 42px;
  font-weight: bold;
  margin-bottom: 12px;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.brand p {
  font-size: 16px;
  opacity: 0.95;
  margin-bottom: 50px;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.features {
  display: flex;
  gap: 40px;
  justify-content: center;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.15);
  padding: 16px 24px;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.feature-item .el-icon {
  font-size: 28px;
}

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
}

.login-box {
  width: 400px;
  padding: 40px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.login-box h2 {
  text-align: center;
  margin-bottom: 24px;
  color: #333;
}

.role-select {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.login-form {
  margin-top: 20px;
}

.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.login-btn {
  width: 100%;
  font-size: 16px;
}

.login-footer {
  text-align: center;
  margin-top: 20px;
  color: #666;
}
</style>