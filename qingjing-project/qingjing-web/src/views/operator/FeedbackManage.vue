<template>
  <div class="feedback-manage">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="处理状态">
          <el-select v-model="filterForm.processStatus" placeholder="全部状态" style="width: 140px" clearable>
            <el-option label="未处理" :value="0" />
            <el-option label="已清洗" :value="1" />
            <el-option label="已入库" :value="2" />
            <el-option label="已忽略" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="垃圾类别">
          <el-input v-model="filterForm.mainCategory" placeholder="如：可回收物" style="width: 140px" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card>
      <template #header>
        <div class="card-header">
          <span>反馈列表</span>
          <div>
            <el-button type="primary" :disabled="selectedIds.length === 0" @click="handleBatchProcess(2)">批量入库</el-button>
            <el-button type="danger" :disabled="selectedIds.length === 0" @click="handleBatchProcess(3)">批量忽略</el-button>
            <el-button type="success" :icon="Download" @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      <el-table
        :data="feedbackList"
        border
        stripe
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="studentName" label="学生姓名" width="100" align="center" />
        <el-table-column label="系统识别结果" min-width="180">
          <template #default="{ row }">
            <div v-if="row.systemResult">
              <el-tag size="small">{{ row.systemResult.mainCategory }}</el-tag>
              <span class="sub-category">{{ row.systemResult.subCategory }}</span>
              <span class="confidence">置信度: {{ (row.systemResult.confidence * 100).toFixed(1) }}%</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="correctCategory" label="正确类别" width="100" align="center" />
        <el-table-column prop="description" label="反馈说明" min-width="150" show-overflow-tooltip />
        <el-table-column prop="processStatusText" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.processStatus)">{{ row.processStatusText }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submitTime" label="提交时间" width="160" align="center" />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">查看</el-button>
            <el-button type="success" link size="small" :disabled="row.processStatus !== 0" @click="handleProcess(row, 2)">入库</el-button>
            <el-button type="danger" link size="small" :disabled="row.processStatus !== 0" @click="handleProcess(row, 3)">忽略</el-button>
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
    <el-dialog v-model="detailDialog.visible" title="反馈详情" width="700px">
      <el-descriptions :column="2" border v-if="detailDialog.data">
        <el-descriptions-item label="反馈ID">{{ detailDialog.data.feedbackId }}</el-descriptions-item>
        <el-descriptions-item label="学生姓名">{{ detailDialog.data.studentName }}</el-descriptions-item>
        <el-descriptions-item label="关联结果ID">{{ detailDialog.data.resultId }}</el-descriptions-item>
        <el-descriptions-item label="系统识别">
          {{ detailDialog.data.systemResult?.mainCategory }} - {{ detailDialog.data.systemResult?.subCategory }}
        </el-descriptions-item>
        <el-descriptions-item label="置信度">{{ (detailDialog.data.systemResult?.confidence * 100).toFixed(1) }}%</el-descriptions-item>
        <el-descriptions-item label="正确类别">{{ detailDialog.data.correctCategory }}</el-descriptions-item>
        <el-descriptions-item label="当前状态" :span="2">
          <el-tag :type="getStatusType(detailDialog.data.processStatus)">{{ detailDialog.data.processStatusText }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="提交时间" :span="2">{{ detailDialog.data.submitTime }}</el-descriptions-item>
        <el-descriptions-item label="投放建议" :span="2">{{ detailDialog.data.systemResult?.disposalAdvice || '无' }}</el-descriptions-item>
        <el-descriptions-item label="反馈说明" :span="2">{{ detailDialog.data.description || '无' }}</el-descriptions-item>
        <el-descriptions-item label="处理备注" :span="2">
          <el-input v-model="processRemark" type="textarea" :rows="3" placeholder="请输入处理备注" />
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailDialog.visible = false">关闭</el-button>
        <el-button type="primary" :disabled="detailDialog.data?.processStatus !== 0" @click="submitProcess(2)">标记为已入库</el-button>
        <el-button type="danger" :disabled="detailDialog.data?.processStatus !== 0" @click="submitProcess(3)">标记为已忽略</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getFeedbackList,
  getFeedbackDetail,
  processFeedback,
  batchProcessFeedback,
  exportFeedback
} from '@/api/operator'

const filterForm = reactive({
  processStatus: '',
  mainCategory: ''
})
const dateRange = ref([])
const feedbackList = ref([])
const loading = ref(false)
const selectedIds = ref([])
const pagination = reactive({ page: 1, size: 20, total: 0 })
const detailDialog = reactive({
  visible: false,
  data: null
})
const processRemark = ref('')

function getStatusType(status) {
  const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[status] || 'info'
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      ...filterForm
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    const res = await getFeedbackList(params)
    const data = res.data
    feedbackList.value = data.records || []
    pagination.total = data.total || 0
  } catch (e) {
    console.error('加载反馈列表失败:', e)
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.processStatus = ''
  filterForm.mainCategory = ''
  dateRange.value = []
  pagination.page = 1
  loadData()
}

function handleSelectionChange(selection) {
  selectedIds.value = selection.map(item => item.feedbackId)
}

async function viewDetail(row) {
  try {
    const res = await getFeedbackDetail(row.feedbackId)
    detailDialog.data = res.data
    processRemark.value = ''
    detailDialog.visible = true
  } catch (e) {
    console.error('加载反馈详情失败:', e)
  }
}

async function handleProcess(row, status) {
  const actionText = status === 2 ? '入库' : '忽略'
  try {
    await ElMessageBox.confirm(`确定要将该反馈标记为"${actionText}"吗？`, '确认', { type: 'warning' })
    await processFeedback(row.feedbackId, { processStatus: status })
    ElMessage.success('处理成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') console.error('处理反馈失败:', e)
  }
}

async function submitProcess(status) {
  if (!detailDialog.data) return
  try {
    await processFeedback(detailDialog.data.feedbackId, {
      processStatus: status,
      remark: processRemark.value
    })
    ElMessage.success('处理成功')
    detailDialog.visible = false
    loadData()
  } catch (e) {
    console.error('处理反馈失败:', e)
  }
}

// 修改点：增加 remark 字段，与后端接口对齐
async function handleBatchProcess(status) {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择反馈记录')
    return
  }
  const actionText = status === 2 ? '入库' : '忽略'
  try {
    await ElMessageBox.confirm(
      `确定要将选中的 ${selectedIds.value.length} 条反馈批量标记为"${actionText}"吗？`,
      '确认',
      { type: 'warning' }
    )
    await batchProcessFeedback({
      feedbackIds: selectedIds.value,
      processStatus: status,
      remark: `批量${actionText}`
    })
    ElMessage.success('批量处理成功')
    loadData()
  } catch (e) {
    if (e !== 'cancel') console.error('批量处理失败:', e)
  }
}

// 修改点：增加 format 参数，修复 Blob 下载处理
async function handleExport() {
  try {
    const params = { ...filterForm }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    params.format = 'zip'
    const blob = await exportFeedback(params)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `feedback_export_${new Date().toISOString().slice(0, 10)}.zip`
    link.click()
    URL.revokeObjectURL(link.href)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error('导出失败:', e)
    ElMessage.error('导出失败')
  }
}

onMounted(() => { loadData() })
</script>

<style scoped>
.filter-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination { margin-top: 20px; justify-content: flex-end; }
.sub-category { margin-left: 6px; color: #666; }
.confidence { margin-left: 6px; color: #999; font-size: 12px; }
</style>