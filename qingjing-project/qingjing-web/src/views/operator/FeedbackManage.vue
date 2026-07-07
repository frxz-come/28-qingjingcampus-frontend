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
          <el-select v-model="filterForm.mainCategory" placeholder="选择垃圾类别" style="width: 160px" clearable filterable>
            <el-option v-for="item in categoryOptions" :key="item" :label="item" :value="item" />
          </el-select>
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
            <el-select v-model="exportFormat" size="small" style="width: 100px; margin-right: 8px;">
              <el-option label="ZIP包" value="zip" />
              <el-option label="Excel" value="excel" />
            </el-select>
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

    <!-- 反馈详情弹窗 -->
    <el-dialog v-model="detailDialog.visible" title="反馈详情" width="900px" top="5vh">
      <div v-if="detailDialog.data" class="detail-content">
        <!-- 图片展示区域 -->
        <el-divider content-position="left">📷 相关图片</el-divider>
        <div class="image-section">
          <div v-if="detailDialog.data.originalImage" class="image-item">
            <div class="image-label">原始图片</div>
            <el-image
              :src="detailDialog.data.originalImage"
              :preview-src-list="getPreviewImages(detailDialog.data)"
              fit="cover"
              class="feedback-image"
            >
              <template #error>
                <div class="image-error">图片加载失败</div>
              </template>
            </el-image>
          </div>
          <div v-if="detailDialog.data.detectedImage" class="image-item">
            <div class="image-label">检测图片（AI标注）</div>
            <el-image
              :src="detailDialog.data.detectedImage"
              :preview-src-list="getPreviewImages(detailDialog.data)"
              fit="cover"
              class="feedback-image"
            >
              <template #error>
                <div class="image-error">图片加载失败</div>
              </template>
            </el-image>
          </div>
          <div v-if="detailDialog.data.supplementImage" class="image-item">
            <div class="image-label">补充图片（学生上传）</div>
            <el-image
              :src="detailDialog.data.supplementImage"
              :preview-src-list="getPreviewImages(detailDialog.data)"
              fit="cover"
              class="feedback-image"
            >
              <template #error>
                <div class="image-error">图片加载失败</div>
              </template>
            </el-image>
          </div>
          <el-empty v-if="!hasAnyImage(detailDialog.data)" description="暂无图片" :image-size="80" />
        </div>

        <!-- 基本信息 -->
        <el-divider content-position="left">📋 基本信息</el-divider>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="反馈ID">{{ detailDialog.data.feedbackId }}</el-descriptions-item>
          <el-descriptions-item label="学生姓名">{{ detailDialog.data.studentName }}</el-descriptions-item>
          <el-descriptions-item label="关联结果ID">{{ detailDialog.data.resultId }}</el-descriptions-item>
          <el-descriptions-item label="系统识别">
            {{ detailDialog.data.systemResult?.mainCategory }} - {{ detailDialog.data.systemResult?.subCategory }}
          </el-descriptions-item>
          <el-descriptions-item label="置信度">{{ (detailDialog.data.systemResult?.confidence * 100).toFixed(1) }}%</el-descriptions-item>
          <el-descriptions-item label="正确类别">{{ detailDialog.data.correctCategory }}</el-descriptions-item>
          <el-descriptions-item label="当前状态" :span="2">
            <el-tag :type="getStatusType(detailDialog.data.processStatus)" size="large" effect="dark">
              {{ getStatusText(detailDialog.data.processStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="提交时间" :span="2">{{ detailDialog.data.submitTime }}</el-descriptions-item>
          <el-descriptions-item label="投放建议" :span="2">{{ detailDialog.data.systemResult?.disposalAdvice || '无' }}</el-descriptions-item>
          <el-descriptions-item label="反馈说明" :span="2">{{ detailDialog.data.description || '无' }}</el-descriptions-item>
          <el-descriptions-item label="处理备注" :span="2">
            <el-input v-model="processRemark" type="textarea" :rows="3" placeholder="请输入处理备注" />
          </el-descriptions-item>
        </el-descriptions>
      </div>
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
const categoryOptions = ref(['可回收物', '厨余垃圾', '有害垃圾', '其他垃圾'])

const detailDialog = reactive({
  visible: false,
  data: null
})

const processRemark = ref('')
const exportFormat = ref('zip')

function getStatusType(status) {
  const map = { 0: 'info', 1: 'warning', 2: 'success', 3: 'danger' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { 0: '未处理', 1: '已清洗', 2: '已入库', 3: '已忽略' }
  return map[status] || '未知'
}

// 获取所有可预览的图片URL列表
function getPreviewImages(data) {
  const images = []
  if (data.originalImage) images.push(data.originalImage)
  if (data.detectedImage) images.push(data.detectedImage)
  if (data.supplementImage) images.push(data.supplementImage)
  return images
}

// 判断是否有任何图片
function hasAnyImage(data) {
  return !!(data.originalImage || data.detectedImage || data.supplementImage)
}

/**
 * 检测 Blob 实际文件类型
 * 1. 先通过 MIME 类型判断
 * 2. 读取前 8KB 内容做特征检测（解决 .xlsx 伪装成 ZIP 的问题）
 * 3. 检测 ZIP 是否为空包
 */
async function detectBlobType(blob) {
  // 第一步：MIME 类型快速判断
  const mime = blob.type || ''
  if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('officedocument')) {
    return { type: 'xlsx', isEmpty: false }
  }

  // 第二步：读取内容做特征检测
  const text = await blob.slice(0, 8192).text()

  // Excel (Office Open XML) 的 ZIP 包内必有这些特征文件
  const isExcel = text.includes('[Content_Types].xml') || text.includes('xl/') || text.includes('workbook')

  if (isExcel) {
    return { type: 'xlsx', isEmpty: false }
  }

  // 第三步：检测是否为有效的 ZIP 包（非空）
  // ZIP 文件头：PK\x03\x04 或 PK\x05\x06（空包）或 PK\x07\x08
  const isZip = text.startsWith('PK')
  if (isZip) {
    // 检测是否为空 ZIP（只有目录记录，没有文件内容）
    // 空 ZIP 通常只有 PK\x05\x06（结束标记）或文件数量极少
    const hasFiles = text.includes('images/') || text.includes('labels/') || text.includes('data.csv') || text.includes('.jpg') || text.includes('.png')
    const isEmpty = !hasFiles && (text.length < 200 || text.includes('PK\x05\x06'))
    return { type: 'zip', isEmpty }
  }

  // 无法识别，默认按 xlsx 处理
  return { type: 'xlsx', isEmpty: false }
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

async function handleExport() {
  try {
    const params = { ...filterForm }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startDate = dateRange.value[0]
      params.endDate = dateRange.value[1]
    }
    // 如果勾选了指定记录，则只导出这些记录
    if (selectedIds.value.length > 0) {
      params.feedbackIds = selectedIds.value.join(',')
    }
    params.format = exportFormat.value

    const blob = await exportFeedback(params)

    // 检测实际文件类型和是否为空包
    const { type: actualType, isEmpty } = await detectBlobType(blob)

    // 如果 ZIP 包为空，提示用户
    if (actualType === 'zip' && isEmpty) {
      ElMessage.error('后端返回的 ZIP 包为空，请检查后端 ZIP 导出功能是否已实现。当前建议先使用 Excel 格式导出。')
      return
    }

    const dateStr = new Date().toISOString().slice(0, 10)
    const fileName = `feedback_export_${dateStr}.${actualType}`

    // 如果用户选了 ZIP 但实际是 Excel，给出提示
    if (exportFormat.value === 'zip' && actualType === 'xlsx') {
      ElMessage.warning('当前后端返回的是 Excel 格式，已自动修正文件名。ZIP 包导出功能可能尚未完全实现。')
    }

    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

/* 详情弹窗样式 */
.detail-content {
  max-height: 70vh;
  overflow-y: auto;
  padding-right: 8px;
}

/* 图片展示区域 */
.image-section {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 16px;
  padding: 8px 0;
}

.image-item {
  flex: 1;
  min-width: 200px;
  max-width: 280px;
}

.image-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.feedback-image {
  width: 100%;
  height: 180px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  cursor: pointer;
  transition: box-shadow 0.3s;
}

.feedback-image:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-error {
  width: 100%;
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  color: #999;
  border-radius: 8px;
  border: 1px dashed #dcdfe6;
}
</style>