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
      <el-table :data="classStats" border stripe size="small">
        <el-table-column type="index" label="序号" width="60" align="center" />
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
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getSchoolStats, exportSchoolData } from '@/api/dean'

const loading = ref(false)
const classStats = ref([])
const filterForm = reactive({ grade: '' })

const participationColor = [
  { color: '#F56C6C', percentage: 60 },
  { color: '#E6A23C', percentage: 80 },
  { color: '#67C23A', percentage: 100 }
]

async function loadData() {
  loading.value = true
  try {
    const params = { grade: filterForm.grade || undefined }
    const res = await getSchoolStats(params)
    const rawData = res.data.classStats || []
    
    // 处理数据：增加人均学习卡片
    classStats.value = rawData.map(item => {
      const studentCount = item.studentCount || 0
      const totalStudiedCards = item.totalStudiedCards || 0
      const avgStudiedCards = studentCount > 0
        ? parseFloat((totalStudiedCards / studentCount).toFixed(1))
        : 0
      
      return {
        ...item,
        teacherName: item.teacherName || '-',
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
    const params = { grade: filterForm.grade || undefined }
    const blob = await exportSchoolData(params)
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `全校统计数据_${new Date().toISOString().slice(0, 10)}.xlsx`
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
</style>