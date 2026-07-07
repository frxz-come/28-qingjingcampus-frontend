<template>
  <div class="school-manage">
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="年级">
          <el-select v-model="filterForm.grade" placeholder="全部年级" style="width: 120px" clearable>
            <el-option label="一年级" value="一年级" />
            <el-option label="二年级" value="二年级" />
            <el-option label="三年级" value="三年级" />
            <el-option label="四年级" value="四年级" />
            <el-option label="五年级" value="五年级" />
            <el-option label="六年级" value="六年级" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
          <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
          <el-button type="success" :icon="Download" @click="handleExport">导出Excel</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-loading="loading">
      <template #header>
        <div class="card-header">
          <span>全校班级统计数据</span>
        </div>
      </template>
      <el-table :data="sortedClassStats" border stripe size="small">
        <el-table-column type="index" label="序号" width="60" align="center">
          <template #default="{ $index }">{{ $index + 1 }}</template>
        </el-table-column>
        <el-table-column prop="className" label="班级名称" min-width="120" />
        <el-table-column prop="grade" label="年级" width="100" align="center" />
        <el-table-column prop="teacherName" label="任课老师" min-width="100" align="center" />
        <el-table-column prop="studentCount" label="学生人数" width="100" align="center" />
        <el-table-column prop="participationRate" label="参与率(%)" width="100" align="center">
          <template #default="{ row }">
            <el-progress :percentage="Math.round(row.participationRate || 0)" :color="participationColor" />
          </template>
        </el-table-column>
        <el-table-column prop="totalRecognition" label="识别总数" width="100" align="center" />
        <el-table-column prop="avgRecognition" label="人均识别" width="100" align="center" />
        <el-table-column prop="totalStudiedCards" label="学习卡片数" width="110" align="center" />
        <el-table-column prop="avgStudiedCards" label="人均学习卡片" width="110" align="center" />
      </el-table>
      <el-empty v-if="classStats.length === 0 && !loading" description="暂无班级统计数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getSchoolStats, getDeanDashboard } from '@/api/dean'
import * as XLSX from 'xlsx'

const loading = ref(false)
const classStats = ref([])
const filterForm = reactive({ grade: '' })

const participationColor = [
  { color: '#F56C6C', percentage: 60 },
  { color: '#E6A23C', percentage: 80 },
  { color: '#67C23A', percentage: 100 }
]

// 年级排序权重
const gradeOrder = {
  '一年级': 1, '一年': 1,
  '二年级': 2, '二年': 2,
  '三年级': 3, '三年': 3,
  '四年级': 4, '四年': 4,
  '五年级': 5, '五年': 5,
  '六年级': 6, '六年': 6
}

// 提取班级数字用于排序
function extractClassNumber(className) {
  const match = className.match(/(\d+)/)
  return match ? parseInt(match[1]) : 0
}

// 按年级+班级排序
function sortByGradeAndClass(list) {
  return [...list].sort((a, b) => {
    const gradeA = gradeOrder[a.grade] || 99
    const gradeB = gradeOrder[b.grade] || 99
    if (gradeA !== gradeB) return gradeA - gradeB
    return extractClassNumber(a.className) - extractClassNumber(b.className)
  })
}

// 排序后的数据
const sortedClassStats = computed(() => {
  return sortByGradeAndClass(classStats.value)
})

async function loadData() {
  loading.value = true
  try {
    const [schoolRes, dashboardRes] = await Promise.all([
      getSchoolStats({ grade: filterForm.grade || undefined }),
      getDeanDashboard()
    ])

    const dashboardData = dashboardRes.data.classComparison || []
    const teacherMap = {}
    dashboardData.forEach(item => {
      if (item.className && item.teacherName) {
        teacherMap[item.className] = item.teacherName
      }
    })

    const rawData = schoolRes.data.classStats || []
    classStats.value = rawData.map(item => {
      const studentCount = item.studentCount || 0
      const totalStudiedCards = item.totalStudiedCards || 0
      const avgStudiedCards = studentCount > 0
        ? parseFloat((totalStudiedCards / studentCount).toFixed(1))
        : 0
      return {
        ...item,
        teacherName: teacherMap[item.className] || item.teacherName || item.teacher || item.instructorName || item.instructor || '-',
        avgStudiedCards: avgStudiedCards
      }
    })
  } catch (e) {
    console.error('加载学校统计失败:', e)
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  filterForm.grade = ''
  loadData()
}

async function handleExport() {
  try {
    loading.value = true
    // 获取完整数据（不分页）
    const [schoolRes, dashboardRes] = await Promise.all([
      getSchoolStats({ grade: filterForm.grade || undefined, page: 1, size: 9999 }),
      getDeanDashboard()
    ])

    const dashboardData = dashboardRes.data.classComparison || []
    const teacherMap = {}
    dashboardData.forEach(item => {
      if (item.className && item.teacherName) {
        teacherMap[item.className] = item.teacherName
      }
    })

    const rawData = schoolRes.data.classStats || []
    // 按年级+班级排序后生成导出数据
    const sortedData = sortByGradeAndClass(rawData.map(item => {
      const studentCount = item.studentCount || 0
      const totalStudiedCards = item.totalStudiedCards || 0
      const avgStudiedCards = studentCount > 0
        ? parseFloat((totalStudiedCards / studentCount).toFixed(1))
        : 0
      return {
        ...item,
        teacherName: teacherMap[item.className] || item.teacherName || item.teacher || '-'
      }
    }))

    const exportData = sortedData.map(item => ({
      '班级名称': item.className || '-',
      '年级': item.grade || '-',
      '任课老师': item.teacherName || '-',
      '学生人数': item.studentCount || 0,
      '参与率(%)': item.participationRate || 0,
      '识别总数': item.totalRecognition || 0,
      '人均识别': item.avgRecognition || 0,
      '学习卡片数': item.totalStudiedCards || 0,
      '人均学习卡片': item.avgStudiedCards || 0
    }))

    // 创建 Excel
    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '全校班级统计')

    // 设置列宽
    ws['!cols'] = [
      { wch: 12 },  // 班级名称
      { wch: 10 },  // 年级
      { wch: 12 },  // 任课老师
      { wch: 10 },  // 学生人数
      { wch: 12 },  // 参与率
      { wch: 10 },  // 识别总数
      { wch: 10 },  // 人均识别
      { wch: 12 },  // 学习卡片数
      { wch: 14 }   // 人均学习卡片
    ]

    XLSX.writeFile(wb, `全校统计数据_${new Date().toISOString().slice(0, 10)}.xlsx`)
    ElMessage.success('导出成功')
  } catch (e) {
    console.error('导出失败:', e)
    ElMessage.error('导出失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => { loadData() })
</script>

<style scoped>
.filter-card { margin-bottom: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>