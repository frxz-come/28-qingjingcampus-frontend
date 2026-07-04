\# 青净校园 - 前端项目
\#28组，项目青净校园系统（智能垃圾分类）


\## 项目简介

"青净校园"生活垃圾智能分类与投放辅助系统的前端代码，包含微信小程序端和Web管理端。



\## 目录结构

├── qingjing-campus/    # 微信小程序前端（学生端）

│   ├── 技术栈：微信小程序原生 + Vant Weapp

│   └── 功能：拍照识别、学习卡片、班级、个人中心

│

└── qingjing-project/   # Web管理端（教师/教务/运维）

├── 技术栈：Vue3 + Vite + Element Plus + Pinia + ECharts

└── 功能：登录注册、数据大屏、班级管理、反馈处理





\## 技术栈

| 端 | 框架 | UI库 | 构建工具 |

| 小程序 | 微信小程序原生 | Vant Weapp | 微信开发者工具 |

| Web | Vue 3 | Element Plus | Vite |



\## 启动方式



\### 微信小程序

1\. 安装依赖：`cd qingjing-campus \&\& npm install`

2\. 微信开发者工具 → 导入项目 → 选择 `qingjing-campus` 文件夹

3\. 工具 → 构建 npm



\### Web前端

```bash

cd qingjing-project

npm install

npm run dev

环境要求

Node.js >= 16

微信开发者工具 >= 1.06

