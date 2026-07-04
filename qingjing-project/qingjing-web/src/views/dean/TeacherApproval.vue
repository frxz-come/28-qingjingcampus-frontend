<template>
  <div class="teacher-approval">
    <div class="toolbar">
      <el-button type="primary" :icon="Plus" @click="openInviteCodeDialog('generate')">生成邀请码</el-button>
      <el-button type="warning" :icon="Refresh" @click="openInviteCodeDialog('reset')">重置邀请码</el-button>
    </div>
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部状态" style="width: 120px" clearable>
            <el-option label="正常" :value="1" />
            <el-option label="已移除" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filterForm.keyword" placeholder="姓名/账号" style="width: 200px" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="teacherList" border stripe v-loading="loading">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="teacherName" label="教师姓名" min-width="120" />
        <el-table-column prop="account" label="账号" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="classCount" label="管理班级" width="100" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'danger'">{{ row.status === 1 ? '正常' : '已移除' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="加入时间" min-width="160" />
        <el-table-column label="操作" width="120" align="center">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleRemove(row)" :disabled="row.status === 0">移除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.size"
        :total="pagination.total"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next"
        @size-change="loadData"
        @current-change="loadData"
        class="pagination"
      />
    </el-card>

    <el-dialog v-model="inviteCodeDialog.visible" :title="inviteCodeDialog.title" width="500px">
      <el-form :model="inviteCodeDialog.form" label-width="120px">
        <el-form-item label="有效期">
          <el-input-number v-model="inviteCodeDialog.form.expireDays" :min="0" :max="365" />
          <span class="form-tip">天（0表示永不过期）</span>
        </el-form-item>
        <el-form-item label="最大使用次数">
          <el-input-number v-model="inviteCodeDialog.form.maxUsage" :min="0" :max="999" />
          <span class="form-tip">次（0表示无限制）</span>
        </el-form-item>
      </el-form>
      <div v-if="inviteCodeDialog.result" class="invite-result">
        <el-divider />
        <div class="result-label">邀请码：</div>
        <div class="result-code">
          <span class="code-text">{{ inviteCodeDialog.result.inviteCode }}</span>
          <el-button type="primary" link :icon="CopyDocument" @click="copyInviteCode">复制</el-button>
        </div>
        <div v-if="inviteCodeDialog.result.expireTime" class="result-info">有效期至：{{ inviteCodeDialog.result.expireTime }}</div>
        <div v-if="inviteCodeDialog.result.maxUsage > 0" class="result-info">最大使用次数：{{ inviteCodeDialog.result.maxUsage }} 次</div>
      </div>
      <template #footer>
        <el-button @click="inviteCodeDialog.visible = false">关闭</el-button>
        <el-button type="primary" @click="handleInviteCodeSubmit" :loading="inviteCodeDialog.loading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Plus, Search, Refresh, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTeacherList, removeTeacher, generateTeacherCode, resetTeacherCode } from '@/api/dean'

const filterForm = reactive({ status: '', keyword: '' })
const pagination = reactive({ page: 1, size: 20, total: 0 })
const loading = ref(false)
const teacherList = ref([])
const inviteCodeDialog = reactive({
  visible: false,
  loading: false,
  title: '生成教师入校邀请码',
  mode: 'generate',
  form: { expireDays: 0, maxUsage: 0 },
  result: null
})

async function loadData() {
  loading.value = true
  try {
    const params = { page: pagination.page, size: pagination.size, ...filterForm }
    const res = await getTeacherList(params)
    const data = res.data
    teacherList.value = data.records || []
    pagination.total = data.total || 0
  } catch (e) {
    console.error('加载教师列表失败:', e)
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.status = ''
  filterForm.keyword = ''
  pagination.page = 1
  loadData()
}

async function handleRemove(row) {
  try {
    await ElMessageBox.confirm(`确定要移除教师 "${row.teacherName}" 吗？移除后该教师将失去管理权限。`, '确认移除', { confirmButtonText: '确定', cancelButtonText: '取消', type: 'warning' })
    await removeTeacher(row.teacherId)
    ElMessage.success('教师已移除')
    loadData()
  } catch (e) {
    if (e !== 'cancel') console.error('移除教师失败:', e)
  }
}

function openInviteCodeDialog(mode) {
  inviteCodeDialog.visible = true
  inviteCodeDialog.mode = mode
  inviteCodeDialog.title = mode === 'generate' ? '生成教师入校邀请码' : '重置教师入校邀请码'
  inviteCodeDialog.result = null
  inviteCodeDialog.form = { expireDays: 0, maxUsage: 0 }
}

async function handleInviteCodeSubmit() {
  inviteCodeDialog.loading = true
  try {
    const api = inviteCodeDialog.mode === 'generate' ? generateTeacherCode : resetTeacherCode
    const res = await api({
      expireDays: inviteCodeDialog.form.expireDays,
      maxUsage: inviteCodeDialog.form.maxUsage
    })
    inviteCodeDialog.result = res.data
    ElMessage.success(inviteCodeDialog.mode === 'generate' ? '邀请码生成成功' : '邀请码重置成功')
  } catch (e) {
    console.error(inviteCodeDialog.mode === 'generate' ? '生成邀请码失败:' : '重置邀请码失败:', e)
  } finally {
    inviteCodeDialog.loading = false
  }
}

function copyInviteCode() {
  if (!inviteCodeDialog.result) return
  navigator.clipboard.writeText(inviteCodeDialog.result.inviteCode)
  ElMessage.success('邀请码已复制')
}

onMounted(() => { loadData() })
</script>

<style scoped>
.toolbar { margin-bottom: 20px; display: flex; gap: 10px; }
.filter-card { margin-bottom: 20px; }
.pagination { margin-top: 20px; justify-content: flex-end; }
.form-tip { margin-left: 10px; color: #999; font-size: 13px; }
.invite-result { padding: 0 20px; }
.result-label { font-size: 14px; color: #666; margin-bottom: 8px; }
.result-code { display: flex; align-items: center; gap: 16px; margin-bottom: 12px; }
.code-text { font-size: 28px; font-weight: bold; color: #409EFF; letter-spacing: 4px; }
.result-info { font-size: 13px; color: #999; margin-bottom: 4px; }
</style>