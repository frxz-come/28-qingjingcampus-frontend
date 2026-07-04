<template>
  <div class="student-stats">
    <!-- 搜索筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" ref="filterFormRef">
        <el-form-item label="班级">
          <el-select
            v-model="filterForm.classId"
            placeholder="选择班级"
            style="width: 200px"
            @change="onClassChange"
            clearable
          >
            <el-option
              v-for="item in classOptions"
              :key="item.classId"
              :label="item.className"
              :value="item.classId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="学生姓名">
          <el-input v-model="filterForm.keyword" style="width: 200px" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
          <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 学生数据表格 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>学生学习统计</span>
          <el-button type="success" :icon="Download" @click="exportData">导出 Excel</el-button>
        </div>
      </template>
      <el-table :data="studentList" border stripe v-loading="loading" style="width: 100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="头像" width="80" align="center">
          <template #default="{ row }">
            <el-avatar :size="32" :src="row.avatarUrl" v-if="row.avatarUrl">
              <el-icon><User /></el-icon>
            </el-avatar>
            <el-avatar :size="32" v-else><el-icon><User /></el-icon></el-avatar>
          </template>
        </el-table-column>
        <el-table-column prop="studentName" label="学生姓名" min-width="100" />
        <el-table-column prop="phone" label="学生手机号" min-width="120" align="center" />
        <el-table-column prop="studiedCards" label="已学卡片" width="110" align="center" sortable />
        <el-table-column prop="recognitionCount" label="识别次数" width="110" align="center" sortable />
        <el-table-column prop="lastActive" label="最近活跃" width="180" align="center" />
        <el-table-column label="识别记录" width="120" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="studentList.length === 0 && !loading" description="暂无学生数据" />
      <el-pagination
        v-if="pagination.total > 0"
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

    <!-- 学生详情弹窗 -->
    <el-dialog v-model="detailDialog.visible" title="学生详情" width="900px" top="5vh">
      <div v-if="detailDialog.data" class="student-detail">
        <!-- 详情内日期范围搜索 -->
        <el-card class="detail-filter-card" shadow="never">
          <el-form :inline="true">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="detailDialog.dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :icon="Search" @click="applyDetailFilter">查询</el-button>
              <el-button :icon="Refresh" @click="resetDetailFilter">重置</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-descriptions :column="3" border>
          <el-descriptions-item label="学生ID">{{ detailDialog.data.studentId }}</el-descriptions-item>
          <el-descriptions-item label="姓名">{{ detailDialog.data.studentName }}</el-descriptions-item>
          <el-descriptions-item label="昵称">{{ detailDialog.data.nickname || '-' }}</el-descriptions-item>
          <el-descriptions-item label="手机号">{{ detailDialog.data.phone || '-' }}</el-descriptions-item>
          <el-descriptions-item label="班级">{{ detailDialog.data.className }}</el-descriptions-item>
          <el-descriptions-item label="年级">{{ detailDialog.data.grade }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ detailDialog.data.registerTime }}</el-descriptions-item>
          <el-descriptions-item :label="detailDialog.isFiltered ? '已学卡片(增量)' : '已学卡片'">{{ detailDialog.displayStudiedCardCount }}</el-descriptions-item>
          <el-descriptions-item :label="detailDialog.isFiltered ? '识别次数(增量)' : '识别次数'">{{ detailDialog.displayRecognitionCount }}</el-descriptions-item>
        </el-descriptions>

        <el-divider content-position="left">学习记录{{ detailDialog.isFiltered ? '（该时间段内）' : '' }}</el-divider>
        <el-table :data="detailDialog.filteredStudyRecords" border size="small">
          <el-table-column prop="cardTitle" label="卡片标题" min-width="150" />
          <el-table-column prop="mainCategory" label="垃圾大类" width="100" align="center" />
          <el-table-column prop="studyStatus" label="状态" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.studyStatus === 1 ? 'success' : 'info'">
                {{ row.studyStatus === 1 ? '已学习' : '未学习' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="studyTime" label="学习时间" width="160" align="center" />
        </el-table>
        <el-empty v-if="detailDialog.filteredStudyRecords.length === 0" :description="detailDialog.isFiltered ? '该时间段内暂无学习记录' : '暂无学习记录'" :image-size="80" />

        <el-divider content-position="left">识别记录（一图多目标）{{ detailDialog.isFiltered ? ' - 该时间段内' : '' }}</el-divider>
        <div v-if="detailDialog.filteredRecognitionSessions.length === 0" class="empty-tip">
          <el-empty :description="detailDialog.isFiltered ? '该时间段内暂无识别记录' : '暂无识别记录'" :image-size="80" />
        </div>
        <el-timeline v-else>
          <el-timeline-item
            v-for="session in detailDialog.filteredRecognitionSessions"
            :key="session.sessionId"
            :timestamp="session.recognitionTime"
            placement="top"
          >
            <el-card :body-style="{ padding: '12px' }">
              <div class="session-images">
                <el-image
                  v-if="session.originalImage"
                  :src="session.originalImage"
                  :preview-src-list="getPreviewImages(session)"
                  fit="cover"
                  class="session-image"
                />
                <el-image
                  v-if="session.detectedImage"
                  :src="session.detectedImage"
                  :preview-src-list="getPreviewImages(session)"
                  fit="cover"
                  class="session-image"
                />
              </div>
              <el-table :data="session.results || []" border size="small" style="margin-top: 8px;">
                <el-table-column type="index" label="#" width="50" align="center" />
                <el-table-column label="检测框" width="120" align="center">
                  <template #default="{ row }">
                    <el-tag size="small" v-if="row.bboxCoordinates">
                      {{ row.bboxCoordinates.x1 }},{{ row.bboxCoordinates.y1 }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="mainCategory" label="识别大类" width="100" align="center" />
                <el-table-column prop="subCategory" label="细分类别" width="120" align="center" />
                <el-table-column label="置信度" width="100" align="center">
                  <template #default="{ row }">
                    <el-progress
                      :percentage="Math.round(row.confidence * 100)"
                      :color="getConfidenceColor(row.confidence)"
                      :stroke-width="10"
                      :show-text="true"
                    />
                  </template>
                </el-table-column>
                <el-table-column prop="disposalAdvice" label="投放建议" min-width="200" show-overflow-tooltip />
                <el-table-column label="反馈状态" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag :type="row.feedbackStatus === 0 ? 'info' : row.feedbackStatus === 1 ? 'warning' : 'success'" size="small">
                      {{ row.feedbackStatus === 0 ? '无反馈' : row.feedbackStatus === 1 ? '已反馈' : '已处理' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="热力图" width="100" align="center">
                  <template #default="{ row }">
                    <el-image
                      v-if="row.heatmapImage"
                      :src="row.heatmapImage"
                      :preview-src-list="[row.heatmapImage]"
                      fit="cover"
                      style="width: 60px; height: 60px; border-radius: 4px;"
                    />
                    <span v-else class="no-heatmap">-</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue'
import { Search, Refresh, Download, User } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getStudentStats, getClassList, exportClassData, getStudentDetail } from '@/api/teacher'

const filterForm = ref({
  classId: '',
  keyword: ''
})

const classOptions = ref([])
const studentList = ref([])
const loading = ref(false)
const pagination = ref({ page: 1, size: 20, total: 0 })

const detailDialog = reactive({
  visible: false,
  data: null,
  dateRange: [],
  isFiltered: false,
  displayStudiedCardCount: 0,
  displayRecognitionCount: 0,
  filteredStudyRecords: [],
  filteredRecognitionSessions: []
})

function getConfidenceColor(confidence) {
  if (confidence >= 0.9) return '#67C23A'
  if (confidence >= 0.7) return '#E6A23C'
  return '#F56C6C'
}

/**
 * 获取预览图片列表（优先显示带红框的 detectedImage）
 */
function getPreviewImages(session) {
  const images = []
  // 优先显示 detectedImage（带AI红框标注的图片）
  if (session.detectedImage) images.push(session.detectedImage)
  // 再显示 originalImage（原图）
  if (session.originalImage) images.push(session.originalImage)
  return images
}

/**
 * 根据日期范围过滤详情数据
 */
function filterDetailData() {
  const data = detailDialog.data
  if (!data) return

  const hasDateRange = detailDialog.dateRange && detailDialog.dateRange.length === 2 && detailDialog.dateRange[0] && detailDialog.dateRange[1]
  detailDialog.isFiltered = !!hasDateRange

  if (!hasDateRange) {
    // 无日期范围：显示全部原始数据
    detailDialog.displayStudiedCardCount = data.studiedCardCount || data.studiedCards || 0
    detailDialog.displayRecognitionCount = data.totalRecognitionCount || data.recognitionCount || 0
    detailDialog.filteredStudyRecords = data.studyRecords || []
    detailDialog.filteredRecognitionSessions = data.recognitionSessions || []
    return
  }

  // 有日期范围：计算增量
  const startTime = new Date(detailDialog.dateRange[0] + 'T00:00:00').getTime()
  const endTime = new Date(detailDialog.dateRange[1] + 'T23:59:59').getTime()

  // 过滤学习记录
  const allStudyRecords = data.studyRecords || []
  detailDialog.filteredStudyRecords = allStudyRecords.filter(r => {
    if (!r.studyTime) return false
    const t = new Date(r.studyTime.replace(' ', 'T')).getTime()
    return t >= startTime && t <= endTime
  })

  // 计算学习卡片增量（时间段内已学习的记录数）
  detailDialog.displayStudiedCardCount = detailDialog.filteredStudyRecords.filter(r => r.studyStatus === 1).length

  // 过滤识别记录
  const allRecognitionSessions = data.recognitionSessions || []
  detailDialog.filteredRecognitionSessions = allRecognitionSessions.filter(s => {
    if (!s.recognitionTime) return false
    const t = new Date(s.recognitionTime.replace(' ', 'T')).getTime()
    return t >= startTime && t <= endTime
  })

  // 计算识别次数增量
  detailDialog.displayRecognitionCount = detailDialog.filteredRecognitionSessions.reduce((sum, s) => {
    return sum + (s.resultCount || (s.results ? s.results.length : 1))
  }, 0)
}

function applyDetailFilter() {
  filterDetailData()
}

function resetDetailFilter() {
  detailDialog.dateRange = []
  filterDetailData()
}

async function loadClassOptions() {
  console.log('[StudentStats] 开始加载班级列表...')
  try {
    const res = await getClassList()
    console.log('[StudentStats] 班级列表响应:', res)
    let data = res.data
    if (data && data.records !== undefined) {
      data = data.records
    }
    classOptions.value = Array.isArray(data) ? data : []
    console.log('[StudentStats] 班级选项:', classOptions.value)
    if (classOptions.value.length > 0 && !filterForm.value.classId) {
      filterForm.value.classId = classOptions.value[0].classId
      console.log('[StudentStats] 自动选择第一个班级:', filterForm.value.classId)
      loadData()
    }
  } catch (e) {
    console.error('[StudentStats] 加载班级列表失败:', e)
    ElMessage.error('加载班级列表失败')
    classOptions.value = []
  }
}

async function loadData() {
  if (!filterForm.value.classId) {
    console.log('[StudentStats] 未选择班级，跳过加载')
    return
  }
  loading.value = true
  console.log('[StudentStats] 开始加载学生数据, classId:', filterForm.value.classId)
  try {
    const params = {
      keyword: filterForm.value.keyword || undefined,
      page: pagination.value.page,
      size: pagination.value.size
    }
    console.log('[StudentStats] 请求参数:', params)
    const res = await getStudentStats(filterForm.value.classId, params)
    console.log('[StudentStats] API响应:', res)
    const data = res.data || {}

    if (data.records !== undefined) {
      studentList.value = (data.records || []).map(s => ({
        ...s,
        phone: s.phone || '-',
        studiedCards: s.studiedCards || 0,
        recognitionCount: s.recognitionCount || 0,
        lastActive: s.lastActive || '-'
      }))
      pagination.value.total = data.total || 0
    } else if (Array.isArray(data)) {
      studentList.value = data.map(s => ({
        ...s,
        phone: s.phone || '-',
        studiedCards: s.studiedCards || 0,
        recognitionCount: s.recognitionCount || 0,
        lastActive: s.lastActive || '-'
      }))
      pagination.value.total = data.length
    } else {
      studentList.value = []
      pagination.value.total = 0
    }

    console.log('[StudentStats] 学生列表:', studentList.value)
    console.log('[StudentStats] 总数:', pagination.value.total)
  } catch (e) {
    console.error('[StudentStats] 加载学生统计失败:', e)
    ElMessage.error(e.response?.data?.message || '加载学生统计失败')
    studentList.value = []
    pagination.value.total = 0
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pagination.value.page = 1
  loadData()
}

function onClassChange() {
  console.log('[StudentStats] 班级变更:', filterForm.value.classId)
  pagination.value.page = 1
  loadData()
}

function resetFilter() {
  filterForm.value = {
    classId: classOptions.value.length > 0 ? classOptions.value[0].classId : '',
    keyword: ''
  }
  pagination.value.page = 1
  loadData()
}

function exportData() {
  if (!filterForm.value.classId) {
    ElMessage.warning('请先选择班级')
    return
  }
  exportClassData(filterForm.value.classId, {})
    .then((blob) => {
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `班级学生统计_${filterForm.value.classId}_${new Date().toISOString().slice(0, 10)}.xlsx`
      link.click()
      URL.revokeObjectURL(link.href)
      ElMessage.success('导出成功')
    })
    .catch((e) => {
      console.error('导出失败:', e)
      ElMessage.error('导出失败')
    })
}

async function viewDetail(row) {
  try {
    const res = await getStudentDetail(row.studentId)
    detailDialog.data = res.data
    detailDialog.dateRange = []
    detailDialog.isFiltered = false
    filterDetailData()
    detailDialog.visible = true
  } catch (e) {
    console.error('加载学生详情失败:', e)
    ElMessage.error('加载学生详情失败')
  }
}

onMounted(() => {
  console.log('[StudentStats] 组件挂载')
  loadClassOptions()
})
</script>

<style scoped>
.filter-card { margin-bottom: 20px; }
.table-card .card-header { display: flex; justify-content: space-between; align-items: center; }
.pagination { margin-top: 20px; justify-content: flex-end; }
.student-detail { max-height: 70vh; overflow-y: auto; }
.detail-filter-card { margin-bottom: 16px; background: #f5f7fa; }
.session-images { display: flex; gap: 8px; margin-bottom: 8px; }
.session-image {
  width: 120px;
  height: 120px;
  border-radius: 8px;
  cursor: pointer;
}
.empty-tip { padding: 20px 0; }
.no-heatmap { color: #999; }
</style>