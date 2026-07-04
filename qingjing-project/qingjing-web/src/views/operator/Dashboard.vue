<template>
  <div class="operator-dashboard">
    <el-row :gutter="20" class="data-cards">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon blue"><el-icon><Monitor /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayActiveUsers }}</div>
            <div class="stat-label">今日活跃用户</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon orange"><el-icon><Message /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.pendingFeedbackCount }}</div>
            <div class="stat-label">待处理反馈</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon green"><el-icon><User /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.todayLogins }}</div>
            <div class="stat-label">今日登录次数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-icon purple"><el-icon><DataAnalysis /></el-icon></div>
          <div class="stat-info">
            <div class="stat-value">v1.3</div>
            <div class="stat-label">系统版本</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <el-col :span="8">
        <el-card>
          <template #header><span>活跃用户角色分布</span></template>
          <div ref="pieChartRef" class="chart"></div>
        </el-card>
      </el-col>
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>今日活跃用户列表</span>
              <el-tag type="info">共 {{ activeUsers.length }} 人</el-tag>
            </div>
          </template>
          <el-table :data="activeUsers" border stripe size="small" max-height="400">
            <el-table-column prop="userName" label="姓名" min-width="120" />
            <el-table-column prop="role" label="角色" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getRoleType(row.role)">{{ getRoleText(row.role) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="userId" label="用户ID" min-width="180" show-overflow-tooltip />
            <el-table-column prop="loginTime" label="最近登录时间" width="180" align="center" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
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
const pieChartRef = ref(null)
let pieChart = null

function getRoleType(role) {
  const map = { teacher: 'success', dean: 'warning', student: 'primary', operator: 'info' }
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
    { value: breakdown.teacher || 0, name: '教师', itemStyle: { color: '#67C23A' } },
    { value: breakdown.dean || 0, name: '教务主任', itemStyle: { color: '#E6A23C' } },
    { value: breakdown.student || 0, name: '学生', itemStyle: { color: '#409EFF' } }
  ].filter(item => item.value > 0)

  pieChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{c}人' },
      data: data.length > 0 ? data : [{ value: 0, name: '暂无数据', itemStyle: { color: '#ddd' } }]
    }]
  })
}

onMounted(() => { loadDashboard() })
</script>

<style scoped>
.data-cards { margin-bottom: 20px; }
.stat-card { display: flex; align-items: center; padding: 10px; }
.stat-icon { width: 60px; height: 60px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 28px; margin-right: 16px; }
.stat-icon.blue { background: #e0f2fe; color: #0284c7; }
.stat-icon.orange { background: #ffedd5; color: #ea580c; }
.stat-icon.green { background: #dcfce7; color: #16a34a; }
.stat-icon.purple { background: #f3e8ff; color: #9333ea; }
.stat-value { font-size: 28px; font-weight: bold; color: #333; }
.stat-label { font-size: 14px; color: #666; margin-top: 4px; }
.chart-row { margin-top: 20px; }
.chart { height: 300px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>