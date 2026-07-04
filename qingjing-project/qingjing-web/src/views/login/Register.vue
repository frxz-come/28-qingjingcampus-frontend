<template>
  <div class="register-page">
    <div class="register-box">
      <h2>账号注册</h2>
      <el-radio-group v-model="registerForm.role" class="role-select" @change="onRoleChange">
        <el-radio-button label="teacher">教师</el-radio-button>
        <el-radio-button label="dean">教务主任</el-radio-button>
        <el-radio-button label="operator">运维人员</el-radio-button>
      </el-radio-group>
      <el-form :model="registerForm" :rules="dynamicRules" ref="formRef" class="register-form">
        <el-form-item prop="name">
          <el-input v-model="registerForm.name" placeholder="请输入真实姓名" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="account">
          <el-input v-model="registerForm.account" placeholder="请输入登录账号" :prefix-icon="UserFilled" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请确认密码" :prefix-icon="Lock" size="large" show-password />
        </el-form-item>
        <!-- 教师特有 -->
        <template v-if="registerForm.role === 'teacher'">
          <el-form-item prop="phone">
            <el-input v-model="registerForm.phone" placeholder="请输入手机号" :prefix-icon="Phone" size="large" />
          </el-form-item>
          <el-form-item prop="inviteCode">
            <el-input v-model="registerForm.inviteCode" placeholder="请输入教师入校邀请码" :prefix-icon="Key" size="large">
              <template #append>
                <el-tooltip content="请联系教务主任获取邀请码">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
            </el-input>
          </el-form-item>
        </template>
        <!-- 教务主任特有：邀请码（可选） -->
        <template v-if="registerForm.role === 'dean'">
          <el-form-item prop="inviteCode">
            <el-input v-model="registerForm.inviteCode" placeholder="请输入学校邀请码（没有将自动创建学校）" :prefix-icon="Key" size="large">
              <template #append>
                <el-tooltip content="如有学校邀请码请输入，无则自动创建新学校">
                  <el-icon><QuestionFilled /></el-icon>
                </el-tooltip>
              </template>
            </el-input>
          </el-form-item>
        </template>
        <el-form-item>
          <el-button type="primary" size="large" class="register-btn" :loading="loading" @click="handleRegister">注 册</el-button>
        </el-form-item>
      </el-form>
      <div class="register-footer">
        <span>已有账号？</span>
        <el-link type="primary" @click="goLogin">返回登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { User, UserFilled, Phone, Lock, Key, QuestionFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { register } from '@/api/auth'

const router = useRouter()
const formRef = ref(null)
const loading = ref(false)

const registerForm = reactive({
  role: 'teacher',
  name: '',
  account: '',
  password: '',
  confirmPassword: '',
  phone: '',
  inviteCode: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== registerForm.password) callback(new Error('两次输入的密码不一致'))
  else callback()
}

const dynamicRules = computed(() => {
  const baseRules = {
    name: [{ required: true, message: '请输入真实姓名', trigger: 'blur' }],
    account: [
      { required: true, message: '请输入账号', trigger: 'blur' },
      { min: 3, max: 20, message: '账号长度 3-20 位', trigger: 'blur' }
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码至少6位', trigger: 'blur' }
    ],
    confirmPassword: [
      { required: true, message: '请确认密码', trigger: 'blur' },
      { validator: validateConfirmPassword, trigger: 'blur' }
    ]
  }

  if (registerForm.role === 'teacher') {
    baseRules.phone = [
      { required: true, message: '请输入手机号', trigger: 'blur' },
      { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
    ]
    baseRules.inviteCode = [{ required: true, message: '请输入邀请码', trigger: 'blur' }]
  }

  // 教务主任的邀请码为可选，不添加 required 规则
  if (registerForm.role === 'dean') {
    // inviteCode 可选，无强制校验
  }

  return baseRules
})

function onRoleChange() {
  registerForm.phone = ''
  registerForm.inviteCode = ''
  if (formRef.value) formRef.value.clearValidate()
}

async function handleRegister() {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    let data = {
      role: registerForm.role,
      name: registerForm.name,
      account: registerForm.account,
      password: registerForm.password
    }

    if (registerForm.role === 'teacher') {
      data.phone = registerForm.phone
      data.inviteCode = registerForm.inviteCode
    }

    if (registerForm.role === 'dean') {
      if (registerForm.inviteCode) {
        data.inviteCode = registerForm.inviteCode
      }
    }

    const res = await register(data)
    ElMessage.success(res.message || '注册成功')
    router.push('/login')
  } catch (e) {
    console.error('注册失败:', e)
  } finally {
    loading.value = false
  }
}

function goLogin() {
  router.push('/login')
}
</script>

<style scoped>
.register-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; }
.register-box { width: 450px; padding: 40px; background: white; border-radius: 16px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15); }
.register-box h2 { text-align: center; margin-bottom: 24px; color: #333; }
.role-select { display: flex; justify-content: center; margin-bottom: 24px; }
.register-form { margin-top: 20px; }
.register-btn { width: 100%; font-size: 16px; }
.register-footer { text-align: center; margin-top: 20px; color: #666; }
</style>