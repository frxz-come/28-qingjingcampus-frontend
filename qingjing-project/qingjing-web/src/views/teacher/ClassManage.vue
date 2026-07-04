<template>
  <div class="class-manage">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">新建班级</el-button>
    </div>
    <el-table
      :data="classList"
      border
      stripe
      v-loading="loading"
      style="width: 100%"
    >
      <el-table-column type="index" label="序号" width="60" align="center" />
      <el-table-column prop="className" label="班级名称" min-width="120" />
      <el-table-column prop="grade" label="年级" width="100" align="center" />
      <el-table-column prop="studentCount" label="学生数" width="100" align="center" />
      <el-table-column prop="inviteCode" label="邀请码" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="success" size="small">{{ row.inviteCode }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="copyCode(row.inviteCode)">复制邀请码</el-button>
          <el-button type="warning" link size="small" @click="openResetDialog(row)">重置邀请码</el-button>
        </template>
      </el-table-column>
    </el-table>
    <el-empty v-if="classList.length === 0 && !loading" description="暂无班级数据，点击上方按钮创建" />

    <!-- 新建班级弹窗 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建班级"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form
        :model="classForm"
        :rules="classRules"
        ref="classFormRef"
        label-width="100px"
        @submit.prevent
      >
        <el-form-item label="年级" prop="grade">
          <el-select v-model="classForm.grade" placeholder="请选择年级" style="width: 100%">
            <el-option label="一年级" value="一年级" />
            <el-option label="二年级" value="二年级" />
            <el-option label="三年级" value="三年级" />
            <el-option label="四年级" value="四年级" />
            <el-option label="五年级" value="五年级" />
            <el-option label="六年级" value="六年级" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级名称" prop="className">
          <el-input v-model="classForm.className" placeholder="如：三年二班" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitCreate" :loading="createLoading">确定</el-button>
      </template>
    </el-dialog>

    <!-- 重置邀请码弹窗 -->
    <el-dialog
      v-model="resetDialogVisible"
      title="重置班级邀请码"
      width="500px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form :model="resetForm" ref="resetFormRef" label-width="100px">
        <el-form-item label="有效期">
          <el-input-number v-model="resetForm.expireDays" :min="0" :max="365" />
          <span class="form-tip">天（0表示永不过期）</span>
        </el-form-item>
      </el-form>
      <div v-if="resetResult" class="invite-result">
        <el-divider />
        <div class="result-label">新邀请码：</div>
        <div class="result-code">
          <span class="code-text">{{ resetResult.inviteCode }}</span>
          <el-button type="primary" link :icon="CopyDocument" @click="copyNewCode">复制</el-button>
        </div>
        <div v-if="resetResult.expireTime" class="result-info">有效期至：{{ resetResult.expireTime }}</div>
      </div>
      <template #footer>
        <el-button @click="resetDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="submitReset" :loading="resetLoading">确定重置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Plus, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getClassList, createClass, resetClassCode } from '@/api/teacher'

const classList = ref([])
const loading = ref(false)

// ========== 新建班级 ==========
const createDialogVisible = ref(false)
const createLoading = ref(false)
const classFormRef = ref(null)
// 修复：改用 reactive 对象，与模板 v-model="classForm.grade" 保持一致
const classForm = ref({
  grade: '',
  className: ''
})
const classRules = {
  grade: [{ required: true, message: '请选择年级', trigger: 'change' }],
  className: [{ required: true, message: '请输入班级名称', trigger: 'blur' }]
}

// ========== 重置邀请码 ==========
const resetDialogVisible = ref(false)
const resetLoading = ref(false)
const resetForm = ref({ expireDays: 0 })
const resetResult = ref(null)
const currentRow = ref(null)

async function loadData() {
  loading.value = true
  console.log('[ClassManage] 开始加载班级列表...')
  try {
    const res = await getClassList()
    console.log('[ClassManage] API响应:', res)
    // 后端返回 { records: [...], total: 2 }
    const data = res.data
    if (data && data.records !== undefined) {
      classList.value = Array.isArray(data.records) ? data.records : []
    } else if (Array.isArray(data)) {
      classList.value = data
    } else {
      classList.value = []
    }
    console.log('[ClassManage] 班级列表:', classList.value)
  } catch (e) {
    console.error('[ClassManage] 加载班级列表失败:', e)
    ElMessage.error(e.response?.data?.message || '加载班级列表失败，请检查网络')
    classList.value = []
  } finally {
    loading.value = false
  }
}

function openCreateDialog() {
  console.log('[ClassManage] 打开新建班级弹窗')
  // 修复：重置为新的响应式对象，确保 el-select 能正确接收空字符串
  classForm.value = { grade: '', className: '' }
  createDialogVisible.value = true
}

async function submitCreate() {
  console.log('[ClassManage] 提交创建班级:', classForm.value)
  if (!classFormRef.value) {
    console.error('[ClassManage] classFormRef 为空!')
    return
  }
  const valid = await classFormRef.value.validate().catch(() => false)
  if (!valid) {
    console.log('[ClassManage] 表单验证失败')
    return
  }
  createLoading.value = true
  try {
    const res = await createClass(classForm.value)
    console.log('[ClassManage] 创建成功:', res)
    ElMessage.success('创建成功' + (res.data?.inviteCode ? '，邀请码：' + res.data.inviteCode : ''))
    createDialogVisible.value = false
    loadData()
  } catch (e) {
    console.error('[ClassManage] 创建班级失败:', e)
    ElMessage.error(e.response?.data?.message || '创建班级失败')
  } finally {
    createLoading.value = false
  }
}

function copyCode(code) {
  if (!code) return
  navigator.clipboard.writeText(code).then(() => {
    ElMessage.success('邀请码已复制：' + code)
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

function openResetDialog(row) {
  console.log('[ClassManage] 打开重置弹窗:', row)
  currentRow.value = row
  resetForm.value = { expireDays: 0 }
  resetResult.value = null
  resetDialogVisible.value = true
}

async function submitReset() {
  if (!currentRow.value) return
  resetLoading.value = true
  try {
    const res = await resetClassCode(currentRow.value.classId, resetForm.value.expireDays)
    console.log('[ClassManage] 重置成功:', res)
    resetResult.value = res.data
    ElMessage.success('邀请码已重置')
    loadData()
  } catch (e) {
    console.error('[ClassManage] 重置邀请码失败:', e)
    ElMessage.error(e.response?.data?.message || '重置邀请码失败')
  } finally {
    resetLoading.value = false
  }
}

function copyNewCode() {
  if (!resetResult.value?.inviteCode) return
  navigator.clipboard.writeText(resetResult.value.inviteCode).then(() => {
    ElMessage.success('邀请码已复制')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}

onMounted(() => {
  console.log('[ClassManage] 组件挂载，加载数据...')
  loadData()
})
</script>

<style scoped>
.toolbar { margin-bottom: 20px; }
.form-tip { margin-left: 10px; color: #999; font-size: 13px; }
.invite-result { padding: 0 20px; }
.result-label { font-size: 14px; color: #666; margin-bottom: 8px; }
.result-code { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.code-text { font-size: 28px; font-weight: bold; color: #409EFF; letter-spacing: 4px; }
.result-info { font-size: 13px; color: #999; margin-bottom: 4px; }
</style>