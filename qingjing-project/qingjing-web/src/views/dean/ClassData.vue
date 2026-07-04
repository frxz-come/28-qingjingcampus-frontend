<template>
  <div class="class-data">
    <!-- 班级排名表 - 只显示前5名 -->
    <el-card class="rank-card" :body-style="{ padding: '12px' }">
      <template #header>
        <div class="card-header">
          <span>班级排名（Top 5）</span>
        </div>
      </template>
      <el-table :data="top5RankList" border v-loading="rankLoading" size="small">
        <el-table-column type="index" label="排名" width="70" align="center">
          <template #default="{ $index }">
            <el-tag v-if="$index < 3" :type="['danger', 'warning', 'success'][$index]">{{ $index + 1 }}</el-tag>
            <span v-else>{{ $index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="className" label="班级" min-width="100" />
        <el-table-column prop="grade" label="年级" width="90" align="center" />
        <el-table-column prop="teacherName" label="任课老师" min-width="100" align="center" />
        <el-table-column prop="studentCount" label="班级人数" width="90" align="center" />
        <el-table-column prop="participationRate" label="参与率" width="90" align="center">
          <template #default="{ row }">
            {{ row.participationRate }}%
          </template>
        </el-table-column>
        <el-table-column prop="avgRecognition" label="人均识别" width="100" align="center" />
        <el-table-column prop="avgStudiedCards" label="人均学习卡片" width="110" align="center" />
        <el-table-column label="综合得分" width="100" align="center">
          <template #default="{ row }">
            <el-tag type="primary" effect="plain">{{ row.compositeScore }}</el-tag>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="top5RankList.length === 0 && !rankLoading" description="暂无班级排名数据" />
    </el-card>

    <!-- 人均识别数与人均学习卡片数柱状图 -->
    <el-card class="chart-card" :body-style="{ padding: '12px' }">
      <template #header>
        <span>各班人均识别数与人均学习卡片数</span>
      </template>
      <div v-show="hasData" ref="barChartRef" class="chart"></div>
      <el-empty v-if="!hasData && !rankLoading" description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onBeforeUnmount, computed } from 'vue'
import * as echarts from 'echarts'
import { getDeanDashboard } from '@/api/dean'

const rankList = ref([])
const rankLoading = ref(false)
const barChartRef = ref(null)
let barChart = null

const hasData = computed(() => rankList.value.length > 0)

// 只取前5名
const top5RankList = computed(() => rankList.value.slice(0, 5))

async function loadData() {
  rankLoading.value = true
  try {
    const res = await getDeanDashboard()
    const data = res.data
    const classComparison = data.classComparison || []
    console.log('[ClassData] 原始数据:', classComparison)

    // 按 人均识别 + 人均学习卡片 降序排列
    rankList.value = classComparison.map(item => {
      const studentCount = item.studentCount || 0
      const totalStudiedCards = item.totalStudiedCards || 0
      const totalRecognition = item.totalRecognition || 0
      
      const avgStudiedCards = studentCount > 0
        ? parseFloat((totalStudiedCards / studentCount).toFixed(1))
        : 0
      const avgRecognition = studentCount > 0
        ? parseFloat((totalRecognition / studentCount).toFixed(1))
        : (item.avgRecognition || 0)
      
      // 综合得分 = 人均识别 + 人均学习卡片
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
    }).sort((a, b) => b.compositeScore - a.compositeScore) // 按综合得分降序

    console.log('[ClassData] 排序后数据:', rankList.value)
    await nextTick()
    initBarChart()
  } catch (e) {
    console.error('加载各班数据失败:', e)
  } finally {
    rankLoading.value = false
  }
}

function initBarChart() {
  if (!barChartRef.value) {
    console.log('[ClassData] barChartRef 不存在')
    return
  }
  if (barChart) {
    barChart.dispose()
    barChart = null
  }

  const classes = rankList.value
  if (classes.length === 0) {
    console.log('[ClassData] 无数据，跳过图表渲染')
    return
  }

  const classNames = classes.map(item => item.className)
  const avgStudiedCards = classes.map(item => item.avgStudiedCards)
  const avgRecognition = classes.map(item => item.avgRecognition)

  console.log('[ClassData] 图表数据:', { classNames, avgStudiedCards, avgRecognition })

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
    grid: { left: '3%', right: '4%', bottom: '15%', top: '8%', containLabel: true },
    xAxis: {
      type: 'category',
      data: classNames,
      axisLabel: { interval: 0, rotate: classNames.length > 5 ? 30 : 0, fontSize: 12 }
    },
    yAxis: { type: 'value', name: '平均数', nameTextStyle: { fontSize: 12 } },
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
  }, true)
  console.log('[ClassData] 图表渲染完成')
}

function handleResize() {
  barChart && barChart.resize()
}

onMounted(() => {
  loadData()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (barChart) {
    barChart.dispose()
    barChart = null
  }
})
</script>

<style scoped>
.class-data {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.rank-card {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-card {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chart-card :deep(.el-card__body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.chart {
  flex: 1;
  min-height: 0;
  width: 100%;
}
</style>