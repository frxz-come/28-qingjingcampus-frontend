<template>
  <div class="login-page">
    <!-- 左侧品牌展示区 -->
    <div class="login-left">
      <div class="brand">
        <div class="logo">🌿</div>
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

    <!-- 右侧登录表单区 -->
    <div class="login-right">
      <div class="login-box">
        <h2>欢迎登录</h2>
        
        <!-- 角色选择 -->
        <el-radio-group v-model="loginForm.role" class="role-select">
          <el-radio-button label="teacher">教师</el-radio-button>
          <el-radio-button label="dean">教务主任</el-radio-button>
          <el-radio-button label="operator">运维人员</el-radio-button>
        </el-radio-group>

        <!-- 登录表单 -->
        <el-form
          :model="loginForm"
          :rules="rules"
          ref="formRef"
          class="login-form"
        >
          <el-form-item prop="account">
            <el-input
              v-model="loginForm.account"
              placeholder="请输入账号"
              :prefix-icon="User"
              size="large"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              :prefix-icon="Lock"
              size="large"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>

          <div class="login-options">
            <el-checkbox v-model="rememberMe">记住我</el-checkbox>
          </div>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form-item>
        </el-form>

        <!-- 底部链接 -->
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
    if (role === 'teacher') {
      router.push('/teacher')
    } else if (role === 'dean') {
      router.push('/dean')
    } else if (role === 'operator') {
      router.push('/operator')
    }
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
.login-page {
  display: flex;
  height: 100vh;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.brand {
  text-align: center;
}

.logo {
  font-size: 80px;
  margin-bottom: 20px;
}

.brand h1 {
  font-size: 36px;
  margin-bottom: 10px;
}

.brand p {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.features {
  display: flex;
  gap: 30px;
  justify-content: center;
}

.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
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