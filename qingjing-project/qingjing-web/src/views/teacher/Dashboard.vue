<template>
  <div class="dashboard">
    <!-- 数据卡片 -->
    <el-row :gutter="12" class="data-cards">
      <el-col :span="6">
        <el-card class="stat-card" :body-style="{ padding: '12px' }">
          <div class="stat-icon blue"><el-icon><School /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.classCount }}</div>
            <div class="stat-label">管理班级</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" :body-style="{ padding: '12px' }">
          <div class="stat-icon green"><el-icon><User /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.studentCount }}</div>
            <div class="stat-label">学生总数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" :body-style="{ padding: '12px' }">
          <div class="stat-icon orange"><el-icon><Camera /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalRecognitionCount }}</div>
            <div class="stat-label">识别总次数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" :body-style="{ padding: '12px' }">
          <div class="stat-icon purple"><el-icon><Reading /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.totalStudiedCards }}</div>
            <div class="stat-label">学习卡片总数</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="12" class="chart-row">
      <!-- 班级对比 - 支持横向滚动 -->
      <el-col :span="12">
        <el-card :body-style="{ padding: '10px', height: '100%' }">
          <template #header><span>班级对比</span></template>
          <div class="chart-scroll-wrapper">
            <div ref="barChartRef" class="chart-scroll"></div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 单个班级近7天趋势 - 带班级筛选 -->
      <el-col :span="12">
        <el-card :body-style="{ padding: '10px', height: '100%' }">
          <template #header>
            <div class="trend-header">
              <span>{{ selectedClassName }}近7天学习趋势</span>
              <el-select 
                v-model="selectedClassId" 
                placeholder="选择班级" 
                size="small" 
                style="width: 140px"
                @change="onClassSelectChange"
              >
                <el-option
                  v-for="item in classOptions"
                  :key="item.classId"
                  :label="item.className"
                  :value="item.classId"
                />
              </el-select>
            </div>
          </template>
          <div ref="lineChartRef" class="chart"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts'
import { School, User, Camera, Reading } from '@element-plus/icons-vue'
import { getTeacherDashboard } from '@/api/teacher'

const stats = ref({
  classCount: 0,
  studentCount: 0,
  totalRecognitionCount: 0,
  totalStudiedCards: 0
})

const barChartRef = ref(null)
const lineChartRef = ref(null)
let barChart = null
let lineChart = null

// 班级选择相关
const classOptions = ref([])
const selectedClassId = ref('')
const selectedClassName = computed(() => {
  const cls = classOptions.value.find(c => c.classId === selectedClassId.value)
  return cls ? cls.className : ''
})

// 原始数据缓存
let allClassComparison = []
let allDailyTrend = []

async function loadDashboard() {
  try {
    const res = await getTeacherDashboard()
    const data = res.data
    
    stats.value = {
      classCount: data.classCount || 0,
      studentCount: data.studentCount || 0,
      totalRecognitionCount: data.totalRecognitionCount || 0,
      totalStudiedCards: data.totalStudiedCards || 0
    }

    // 缓存班级数据
    allClassComparison = data.classComparison || []
    classOptions.value = allClassComparison.map(c => ({
      classId: c.classId || c.className,
      className: c.className
    }))
    
    // 默认选中第一个班级
    if (classOptions.value.length > 0 && !selectedClassId.value) {
      selectedClassId.value = classOptions.value[0].classId
    }

    allDailyTrend = data.dailyTrend || []

    await nextTick()
    initBarChart(allClassComparison)
    initLineChart(allDailyTrend, selectedClassId.value)
  } catch (e) {
    console.error('加载仪表盘失败:', e)
  }
}

function initBarChart(classComparison) {
  if (!barChartRef.value) return
  if (barChart) { barChart.dispose(); barChart = null }

  const classNames = classComparison.length > 0
    ? classComparison.map(c => c.className)
    : ['暂无数据']

  const avgStudiedCards = classComparison.length > 0
    ? classComparison.map(c => {
        const total = c.totalStudiedCards || 0
        const count = c.studentCount || 1
        return parseFloat((total / count).toFixed(1))
      })
    : [0]

  const avgRecognition = classComparison.length > 0
    ? classComparison.map(c => {
        const total = c.totalRecognition || 0
        const count = c.studentCount || 1
        return parseFloat((total / count).toFixed(1))
      })
    : [0]

  const currentColors = classComparison.map(c => c.isCurrentClass ? '#10b981' : '#409EFF')

  // 计算图表宽度：每个班级至少80px宽度，确保可滚动
  const minWidth = barChartRef.value.parentElement.clientWidth
  const chartWidth = Math.max(minWidth, classNames.length * 80)

  barChart = echarts.init(barChartRef.value, null, {
    width: chartWidth
  })
  
  barChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        let result = '<strong>' + params[0].name + '</strong><br/>'
        params.forEach(p => {
          result += p.marker + ' ' + p.seriesName + ': <strong>' + p.value + '</strong><br/>'
        })
        const idx = params[0].dataIndex
        const item = classComparison[idx]
        if (item) {
          result += '<br/>学生数: ' + (item.studentCount || 0) + '人<br/>'
          result += '总学习卡片: ' + (item.totalStudiedCards || 0) + '<br/>'
          result += '总识别: ' + (item.totalRecognition || 0)
        }
        return result
      }
    },
    legend: { 
      data: ['人均学习卡片', '人均识别次数'], 
      bottom: 0, 
      itemHeight: 8, 
      textStyle: { fontSize: 11 } 
    },
    grid: { 
      left: '3%', 
      right: '4%', 
      bottom: '40', 
      top: '10%', 
      containLabel: true 
    },
    xAxis: {
      type: 'category',
      data: classNames,
      axisLabel: { 
        interval: 0,  // 强制显示所有标签
        rotate: classNames.length > 4 ? 30 : 0, 
        fontSize: 11 
      }
    },
    yAxis: { 
      type: 'value', 
      name: '平均数', 
      nameTextStyle: { fontSize: 11 } 
    },
    series: [
      {
        name: '人均学习卡片',
        type: 'bar',
        data: avgStudiedCards.map((val, idx) => ({
          value: val,
          itemStyle: { color: currentColors[idx] || '#67C23A' }
        })),
        barWidth: '30%',
        barGap: '20%'
      },
      {
        name: '人均识别次数',
        type: 'bar',
        data: avgRecognition.map((val, idx) => ({
          value: val,
          itemStyle: { color: currentColors[idx] ? '#059669' : '#409EFF' }
        })),
        barWidth: '30%'
      }
    ]
  })
}

function initLineChart(dailyTrend, classId) {
  if (!lineChartRef.value) return
  if (lineChart) { lineChart.dispose(); lineChart = null }

  // 根据选中的班级过滤数据
  let filteredTrend = []
  
  // 检查后端数据是否包含 classId 字段
  const hasClassId = dailyTrend.length > 0 && dailyTrend[0].classId !== undefined
  
  if (hasClassId && classId) {
    // 后端返回了按班级分组的数据，直接过滤
    filteredTrend = dailyTrend.filter(d => String(d.classId) === String(classId))
  } else {
    // 后端没有返回按班级分组的数据，显示全部（或需要调用其他接口）
    filteredTrend = dailyTrend
  }

  // 如果没有该班级的数据，显示空
  if (filteredTrend.length === 0) {
    filteredTrend = []
  }

  const dates = filteredTrend.map(item => item.date)
  const dailyAvgStudy = filteredTrend.map(item => {
    const count = item.studyCount || 0
    const students = item.studentCount || 1
    return parseFloat((count / students).toFixed(2))
  })
  const dailyAvgRecognition = filteredTrend.map(item => {
    const count = item.recognitionCount || 0
    const students = item.studentCount || 1
    return parseFloat((count / students).toFixed(2))
  })

  lineChart = echarts.init(lineChartRef.value)
  lineChart.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        let result = '<strong>' + params[0].axisValue + '</strong><br/>'
        params.forEach(p => {
          result += p.marker + ' ' + p.seriesName + ': <strong>' + p.value + '</strong><br/>'
        })
        return result
      }
    },
    legend: { 
      data: ['人均学习卡片', '人均识别次数'], 
      bottom: 0, 
      itemHeight: 8, 
      textStyle: { fontSize: 11 } 
    },
    grid: { 
      left: '3%', 
      right: '4%', 
      bottom: '40', 
      top: '10%', 
      containLabel: true 
    },
    xAxis: { 
      type: 'category', 
      data: dates, 
      boundaryGap: false, 
      axisLabel: { 
        fontSize: 11,
        interval: 0,  // 强制显示所有日期
        rotate: dates.length > 7 ? 30 : 0
      } 
    },
    yAxis: { 
      type: 'value', 
      name: '人均数', 
      nameTextStyle: { fontSize: 11 } 
    },
    series: [
      {
        name: '人均学习卡片',
        type: 'line',
        smooth: true,
        data: dailyAvgStudy,
        itemStyle: { color: '#67C23A' },
        areaStyle: { color: 'rgba(103,194,58,0.2)' },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '人均识别次数',
        type: 'line',
        smooth: true,
        data: dailyAvgRecognition,
        itemStyle: { color: '#409EFF' },
        areaStyle: { color: 'rgba(64,158,255,0.2)' },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  })
}

function onClassSelectChange() {
  initLineChart(allDailyTrend, selectedClassId.value)
}

function handleResize() {
  barChart && barChart.resize()
  lineChart && lineChart.resize()
}

onMounted(() => {
  loadDashboard()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (barChart) { barChart.dispose(); barChart = null }
  if (lineChart) { lineChart.dispose(); lineChart = null }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  min-height: 500px;
}

.data-cards {
  margin-bottom: 10px;
  flex-shrink: 0;
}

.stat-card {
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  margin-right: 10px;
  flex-shrink: 0;
}

.stat-icon.blue { background: #e0f2fe; color: #0284c7; }
.stat-icon.green { background: #dcfce7; color: #16a34a; }
.stat-icon.orange { background: #ffedd5; color: #ea580c; }
.stat-icon.purple { background: #f3e8ff; color: #9333ea; }

.stat-value { font-size: 22px; font-weight: bold; color: #333; line-height: 1.2; }
.stat-label { font-size: 12px; color: #666; margin-top: 2px; }

.chart-row {
  flex: 1;
  min-height: 0;
}

.chart-row > .el-col {
  height: 100%;
}

.chart-row .el-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-row .el-card :deep(.el-card__header) {
  padding: 10px 15px;
  min-height: 40px;
}

.chart-row .el-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 班级对比图表 - 支持横向滚动 */
.chart-scroll-wrapper {
  flex: 1;
  min-height: 0;
  overflow-x: auto;
  overflow-y: hidden;
}

.chart-scroll {
  height: 100%;
  min-width: 100%;
}

/* 趋势图表 */
.chart {
  flex: 1;
  min-height: 0;
  width: 100%;
}

/* 趋势图头部 */
.trend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>