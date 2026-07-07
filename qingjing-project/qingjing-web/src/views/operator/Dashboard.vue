<template>
  <div class="operator-dashboard">
    <!-- 数据卡片 -->
    <el-row :gutter="16" class="data-cards">
      <el-col :span="6">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon blue"><el-icon><Monitor /></el-icon></div>
          <div class="stat-value">{{ stats.todayActiveUsers }}</div>
          <div class="stat-label">今日活跃用户</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon orange"><el-icon><Message /></el-icon></div>
          <div class="stat-value">{{ stats.pendingFeedbackCount }}</div>
          <div class="stat-label">待处理反馈</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon green"><el-icon><User /></el-icon></div>
          <div class="stat-value">{{ stats.todayLogins }}</div>
          <div class="stat-label">今日登录次数</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card" :body-style="{ padding: '20px' }">
          <div class="stat-icon purple"><el-icon><DataAnalysis /></el-icon></div>
          <div class="stat-value">v1.3</div>
          <div class="stat-label">系统版本</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表与用户列表 -->
    <el-row :gutter="16" class="chart-row">
      <el-col :span="24">
        <el-card :body-style="{ padding: '16px', height: '100%' }">
          <template #header>
            <div class="card-header">
              <span>活跃用户角色分布</span>
              <el-tag type="info">共 {{ activeUsers.length }} 人</el-tag>
            </div>
          </template>
          <div class="pie-chart-wrapper">
            <div ref="pieChartRef" class="pie-chart"></div>
            <div class="user-list">
              <div class="list-title">最近活跃用户（Top 7）</div>
              <el-table :data="recentActiveUsers" border stripe size="small">
                <el-table-column prop="userName" label="姓名" min-width="100" />
                <el-table-column prop="role" label="角色" width="90" align="center">
                  <template #default="{ row }">
                    <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="userId" label="用户ID" min-width="160" show-overflow-tooltip />
                <el-table-column prop="loginTime" label="最近登录时间" width="170" align="center" />
              </el-table>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { Monitor, Message, User, DataAnalysis } from '@element-plus/icons-vue'
import { getOperatorDashboard } from '@/api/operator'
import * as echarts from 'echarts'

const stats = ref({
  todayActiveUsers: 0,
  todayLogins: 0,
  pendingFeedbackCount: 0,
  activeBreakdown: { teacher: 0, dean: 0, student: 0 }
})

const activeUsers = ref([])

const recentActiveUsers = computed(() => {
  return activeUsers.value.slice(0, 7)
})

const pieChartRef = ref(null)
let pieChart = null

function getRoleType(role) {
  const map = { teacher: 'primary', dean: 'warning', student: 'success', operator: 'info' }
  return map[role] || 'info'
}

function getRoleText(role) {
  const map = { teacher: '教师', dean: '教务主任', student: '学生', operator: '运维' }
  return map[role] || role
}

async function loadDashboard() {
  try {
    const res = await getOperatorDashboard()
    const data = res.data
    stats.value = {
      todayActiveUsers: data.todayActiveUsers || 0,
      todayLogins: data.todayLogins || 0,
      pendingFeedbackCount: data.pendingFeedbackCount || 0,
      activeBreakdown: data.activeBreakdown || { teacher: 0, dean: 0, student: 0 }
    }
    activeUsers.value = data.activeUsers || []
    await nextTick()
    initPieChart(data.activeBreakdown || { teacher: 0, dean: 0, student: 0 })
  } catch (e) {
    console.error('加载运维仪表盘失败:', e)
  }
}

function initPieChart(breakdown) {
  if (!pieChartRef.value) return
  if (pieChart) { pieChart.dispose(); pieChart = null }
  pieChart = echarts.init(pieChartRef.value)
  
  const data = [
    { value: breakdown.teacher || 0, name: '教师', itemStyle: { color: '#409EFF' } },
    { value: breakdown.dean || 0, name: '教务主任', itemStyle: { color: '#E6A23C' } },
    { value: breakdown.student || 0, name: '学生', itemStyle: { color: '#67C23A' } }
  ].filter(item => item.value > 0)
  
  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { bottom: 0, left: 'center' },
    series: [{
      type: 'pie',
      radius: ['35%', '60%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}人' },
      data: data.length > 0 ? data : [{ value: 0, name: '暂无数据', itemStyle: { color: '#ddd' } }]
    }]
  })
}

function handleResize() {
  if (pieChart) pieChart.resize()
}

onMounted(() => {
  loadDashboard()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (pieChart) { pieChart.dispose(); pieChart = null }
})
</script>

<style scoped>
.operator-dashboard {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 100px);
  min-height: 500px;
}

.data-cards {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.stat-card :deep(.el-card__body) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-bottom: 10px;
}

.stat-icon.blue { background: #e0f2fe; color: #0284c7; }
.stat-icon.orange { background: #ffedd5; color: #ea580c; }
.stat-icon.green { background: #dcfce7; color: #16a34a; }
.stat-icon.purple { background: #f3e8ff; color: #9333ea; }

.stat-value { 
  font-size: 24px; 
  font-weight: bold; 
  color: #333; 
  line-height: 1.2; 
  margin-bottom: 4px;
}

.stat-label { 
  font-size: 13px; 
  color: #666; 
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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pie-chart-wrapper {
  display: flex;
  height: 100%;
  gap: 20px;
}

.pie-chart {
  flex: 0 0 35%;
  min-width: 280px;
  height: 100%;
}

.user-list {
  flex: 1;
  min-width: 0;
  height: 100%;
  overflow: hidden;
}

.list-title {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
  padding-left: 4px;
}

.user-list :deep(.el-table) {
  height: calc(100% - 30px);
}
</style>