<template>
  <div class="dean-dashboard">
    <!-- 顶部数据卡片 -->
    <el-row :gutter="16" class="data-cards">
      <el-col :span="6" v-for="card in topCards" :key="card.label">
        <el-card class="stat-card" :body-style="{ padding: '16px' }" :style="{ borderLeft: `4px solid ${card.color}` }">
          <div class="stat-value" :style="{ color: card.color }">{{ card.value }}</div>
          <div class="stat-label">{{ card.label }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表轮播区域 - 4屏 -->
    <el-row class="chart-row">
      <el-col :span="24">
        <el-card :body-style="{ padding: '0', height: '100%' }">
          <div class="carousel-container" @mouseenter="pauseAutoPlay" @mouseleave="startAutoPlay">
            <!-- 左箭头 -->
            <div class="carousel-arrow carousel-arrow-left" @click="prevChart">
              <el-icon><ArrowLeft /></el-icon>
            </div>
            <!-- 图表内容 - 平滑滑动 -->
            <div class="carousel-wrapper">
              <div class="carousel-track" :style="trackStyle">
                <!-- 幻灯片1：各班级参与率对比 -->
                <div class="chart-slide">
                  <div class="chart-header">
                    <span>各班级参与率对比</span>
                  </div>
                  <div ref="classChartRef" class="chart"></div>
                </div>
                <!-- 幻灯片2：近7天识别与学习趋势 -->
                <div class="chart-slide">
                  <div class="chart-header">
                    <span>近7天识别与学习趋势</span>
                  </div>
                  <div ref="trendChartRef" class="chart"></div>
                </div>
                <!-- 幻灯片3：班级排名 Top5 -->
                <div class="chart-slide table-slide">
                  <div class="chart-header">
                    <span>班级排名（Top 5）</span>
                  </div>
                  <div class="slide-content">
                    <el-table :data="top5RankList" border size="small" v-loading="rankLoading">
                      <el-table-column type="index" label="排名" width="60" align="center">
                        <template #default="{ $index }">
                          <el-tag v-if="$index < 3" :type="['danger', 'warning', 'success'][$index]">{{ $index + 1 }}</el-tag>
                          <span v-else>{{ $index + 1 }}</span>
                        </template>
                      </el-table-column>
                      <el-table-column prop="className" label="班级" min-width="100" />
                      <el-table-column prop="grade" label="年级" width="80" align="center" />
                      <el-table-column prop="teacherName" label="任课老师" min-width="90" align="center" />
                      <el-table-column prop="studentCount" label="人数" width="70" align="center" />
                      <el-table-column prop="participationRate" label="参与率" width="80" align="center">
                        <template #default="{ row }">{{ row.participationRate }}%</template>
                      </el-table-column>
                      <el-table-column prop="avgRecognition" label="人均识别" width="90" align="center" />
                      <el-table-column prop="avgStudiedCards" label="人均学习卡片" width="100" align="center" />
                      <el-table-column label="综合得分" width="90" align="center">
                        <template #default="{ row }">
                          <el-tag type="primary" effect="plain" size="small">{{ row.compositeScore }}</el-tag>
                        </template>
                      </el-table-column>
                    </el-table>
                    <el-empty v-if="top5RankList.length === 0 && !rankLoading" description="暂无数据" :image-size="60" />
                  </div>
                </div>
                <!-- 幻灯片4：各班人均识别数与人均学习卡片数 -->
                <div class="chart-slide">
                  <div class="chart-header">
                    <span>各班人均识别数与人均学习卡片数</span>
                  </div>
                  <div ref="barChartRef" class="chart"></div>
                </div>
              </div>
            </div>
            <!-- 右箭头 -->
            <div class="carousel-arrow carousel-arrow-right" @click="nextChart">
              <el-icon><ArrowRight /></el-icon>
            </div>
            <!-- 指示器 -->
            <div class="carousel-indicators">
              <span
                v-for="(_, index) in 4"
                :key="index"
                :class="['indicator-dot', { active: currentChartIndex === index }]"
                @click="goToChart(index)"
              ></span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, watch, computed } from 'vue'
import * as echarts from 'echarts'
import { ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { getDeanDashboard } from '@/api/dean'

const topCards = ref([
  { value: '0', label: '全校学生', color: '#409EFF' },
  { value: '0', label: '班级数量', color: '#67C23A' },
  { value: '0', label: '总识别次数', color: '#E6A23C' },
  { value: '0%', label: '平均参与率', color: '#F56C6C' }
])

const classChartRef = ref(null)
const trendChartRef = ref(null)
const barChartRef = ref(null)
let classChart = null
let trendChart = null
let barChart = null

// 轮播相关
const currentChartIndex = ref(0)
const autoPlayTimer = ref(null)
const AUTO_PLAY_INTERVAL = 3000 // 3秒自动切换
const isTransitioning = ref(false)
const SLIDE_COUNT = 4

// 排名数据
const rankList = ref([])
const rankLoading = ref(false)
const top5RankList = computed(() => rankList.value.slice(0, 5))

// 轨道样式 - 实现平滑滑动
const trackStyle = computed(() => ({
  transform: `translateX(-${currentChartIndex.value * (100 / SLIDE_COUNT)}%)`,
  transition: isTransitioning.value ? 'transform 0.5s ease-in-out' : 'none'
}))

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

async function loadDashboard() {
  try {
    const res = await getDeanDashboard()
    const data = res.data
    const overview = data.overview || {}
    const classComparison = data.classComparison || []
    const dailyTrend = data.dailyTrend || []

    // ========== 计算平均参与率 ==========
    let totalParticipatedStudents = 0
    let totalStudents = 0

    classComparison.forEach(item => {
      const studentCount = item.studentCount || 0
      const participationRate = item.participationRate || 0
      totalStudents += studentCount
      totalParticipatedStudents += Math.round(participationRate / 100 * studentCount)
    })

    const avgParticipation = totalStudents > 0
      ? Math.round(totalParticipatedStudents / totalStudents * 100)
      : 0

    topCards.value = [
      { value: String(overview.totalStudentCount || 0), label: '全校学生', color: '#409EFF' },
      { value: String(overview.classCount || 0), label: '班级数量', color: '#67C23A' },
      { value: String(overview.totalRecognitionCount || 0), label: '总识别次数', color: '#E6A23C' },
      { value: avgParticipation + '%', label: '平均参与率', color: '#F56C6C' }
    ]

    // ========== 处理排名数据：按综合得分排序，取Top5 ==========
    rankLoading.value = true
    const processedList = classComparison.map(item => {
      const studentCount = item.studentCount || 0
      const totalStudiedCards = item.totalStudiedCards || 0
      const totalRecognition = item.totalRecognition || 0
      
      const avgStudiedCards = studentCount > 0
        ? parseFloat((totalStudiedCards / studentCount).toFixed(1))
        : 0
      const avgRecognition = studentCount > 0
        ? parseFloat((totalRecognition / studentCount).toFixed(1))
        : (item.avgRecognition || 0)
      
      const compositeScore = parseFloat((avgRecognition + avgStudiedCards).toFixed(1))

      return {
        className: item.className || '-',
        grade: item.grade || '-',
        teacherName: item.teacherName || '-',
        studentCount: studentCount,
        participationRate: item.participationRate || 0,
        avgRecognition: avgRecognition,
        avgStudiedCards: avgStudiedCards,
        compositeScore: compositeScore
      }
    })

    // 按综合得分降序，取前5
    rankList.value = processedList.sort((a, b) => b.compositeScore - a.compositeScore)
    rankLoading.value = false

    await nextTick()
    initClassChart(classComparison)
    initTrendChart(dailyTrend)
    // 柱状图使用按年级班级排序后的数据
    initBarChart(sortByGradeAndClass(processedList))
    startAutoPlay()
  } catch (e) {
    console.error('加载数据大屏失败:', e)
  }
}

function initClassChart(classComparison) {
  if (!classChartRef.value) return
  if (classChart) { classChart.dispose(); classChart = null }
  classChart = echarts.init(classChartRef.value)
  classChart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: classComparison.map(item => item.className),
      axisLabel: { fontSize: 12 }
    },
    yAxis: { type: 'value', max: 100, name: '参与率(%)', nameTextStyle: { fontSize: 12 } },
    series: [{
      data: classComparison.map(item => item.participationRate || 0),
      type: 'bar',
      itemStyle: { color: '#409EFF', borderRadius: [4, 4, 0, 0] },
      barWidth: '40%'
    }]
  })
}

function initTrendChart(dailyTrend) {
  if (!trendChartRef.value) return
  if (trendChart) { trendChart.dispose(); trendChart = null }
  trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['识别次数', '学习卡片数'],
      bottom: 0,
      itemHeight: 8,
      textStyle: { fontSize: 11 }
    },
    // 修改：调整 grid 减少左边空白
    grid: { left: '2%', right: '3%', bottom: '12%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: dailyTrend.map(item => item.date),
      axisLabel: { fontSize: 12 }
    },
    yAxis: { type: 'value', name: '次数', nameTextStyle: { fontSize: 12 } },
    series: [
      {
        name: '识别次数',
        data: dailyTrend.map(item => item.recognitionCount || 0),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#409EFF' },
        areaStyle: { color: 'rgba(64,158,255,0.2)' },
        symbol: 'circle',
        symbolSize: 6
      },
      {
        name: '学习卡片数',
        data: dailyTrend.map(item => item.studyCount || 0),
        type: 'line',
        smooth: true,
        itemStyle: { color: '#67C23A' },
        areaStyle: { color: 'rgba(103,194,58,0.2)' },
        symbol: 'circle',
        symbolSize: 6
      }
    ]
  })
}

function initBarChart(sortedData) {
  if (!barChartRef.value) return
  if (barChart) { barChart.dispose(); barChart = null }

  const classNames = sortedData.map(item => item.className)
  const avgStudiedCards = sortedData.map(item => item.avgStudiedCards)
  const avgRecognition = sortedData.map(item => item.avgRecognition)

  barChart = echarts.init(barChartRef.value)
  barChart.setOption({
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: function(params) {
        let result = '<strong>' + params[0].name + '</strong><br/>'
        params.forEach(p => {
          result += p.marker + ' ' + p.seriesName + ': <strong>' + p.value + '</strong><br/>'
        })
        return result
      }
    },
    legend: { data: ['人均学习卡片', '人均识别次数'], bottom: 0, itemHeight: 10, textStyle: { fontSize: 12 } },
    // 修改：调整 grid 确保"平均数"显示完整
    grid: { left: '5%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: classNames,
      // 修改：字体不旋转，正常显示
      axisLabel: { interval: 0, rotate: 0, fontSize: 12 }
    },
    yAxis: { 
      type: 'value', 
      name: '平均数', 
      nameTextStyle: { fontSize: 12 },
      // 确保Y轴标签显示完整
      axisLabel: { fontSize: 11 }
    },
    series: [
      {
        name: '人均学习卡片',
        type: 'bar',
        data: avgStudiedCards.map(val => ({ value: val, itemStyle: { color: '#67C23A' } })),
        barWidth: '30%',
        barGap: '20%'
      },
      {
        name: '人均识别次数',
        type: 'bar',
        data: avgRecognition.map(val => ({ value: val, itemStyle: { color: '#409EFF' } })),
        barWidth: '30%'
      }
    ]
  })
}

// 轮播控制
function nextChart() {
  isTransitioning.value = true
  currentChartIndex.value = (currentChartIndex.value + 1) % SLIDE_COUNT
  nextTick(() => { resizeCharts() })
}

function prevChart() {
  isTransitioning.value = true
  currentChartIndex.value = (currentChartIndex.value - 1 + SLIDE_COUNT) % SLIDE_COUNT
  nextTick(() => { resizeCharts() })
}

function goToChart(index) {
  if (index === currentChartIndex.value) return
  isTransitioning.value = true
  currentChartIndex.value = index
  nextTick(() => { resizeCharts() })
}

function resizeCharts() {
  nextTick(() => {
    if (classChart) classChart.resize()
    if (trendChart) trendChart.resize()
    if (barChart) barChart.resize()
  })
}

function startAutoPlay() {
  stopAutoPlay()
  autoPlayTimer.value = setInterval(() => {
    nextChart()
  }, AUTO_PLAY_INTERVAL)
}

function pauseAutoPlay() {
  stopAutoPlay()
}

function stopAutoPlay() {
  if (autoPlayTimer.value) {
    clearInterval(autoPlayTimer.value)
    autoPlayTimer.value = null
  }
}

// 监听窗口大小变化
function handleResize() {
  if (classChart) classChart.resize()
  if (trendChart) trendChart.resize()
  if (barChart) barChart.resize()
}

onMounted(() => {
  loadDashboard()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  stopAutoPlay()
  window.removeEventListener('resize', handleResize)
  if (classChart) { classChart.dispose(); classChart = null }
  if (trendChart) { trendChart.dispose(); trendChart = null }
  if (barChart) { barChart.dispose(); barChart = null }
})
</script>

<style scoped>
.dean-dashboard {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  min-height: 500px;
}

.data-cards {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.stat-card {
  padding: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}

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

.chart-row .el-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 轮播容器 */
.carousel-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  overflow: hidden;
}

/* 箭头按钮 */
.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.15);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: background 0.3s;
  font-size: 18px;
}

.carousel-arrow:hover {
  background: rgba(0, 0, 0, 0.3);
}

.carousel-arrow-left {
  left: 10px;
}

.carousel-arrow-right {
  right: 10px;
}

/* 轮播包装器 - 隐藏溢出 */
.carousel-wrapper {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: relative;
}

/* 轮播轨道 - 横向排列所有幻灯片 */
.carousel-track {
  display: flex;
  width: 400%; /* 4张幻灯片，每张25% */
  height: 100%;
}

/* 单个幻灯片 */
.chart-slide {
  width: 25%;
  height: 100%;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  padding: 40px 50px 30px;
  box-sizing: border-box;
}

/* 表格类型幻灯片 - 调整padding使表格占满空间 */
.table-slide {
  padding: 20px 40px 40px;
}

.table-slide .slide-content {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

/* 表格样式调整：让表格占满高度 */
.table-slide :deep(.el-table) {
  height: 100%;
}

.table-slide :deep(.el-table__body-wrapper) {
  overflow-y: auto;
}

.chart-header {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.chart {
  flex: 1;
  min-height: 0;
  width: 100%;
}

/* 指示器 */
.carousel-indicators {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.indicator-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ccc;
  cursor: pointer;
  transition: all 0.3s;
}

.indicator-dot.active {
  background: #409EFF;
  width: 20px;
  border-radius: 4px;
}
</style>