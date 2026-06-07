# AI 英语口语陪练助手

> 第三批议题 · 题目一（XEngineer 新工科计划 · 七牛云 Hackathon）

## 在线体验 & Demo 视频

[![在线体验](https://img.shields.io/badge/🚀%20在线体验-Railway-7B2FBE?style=for-the-badge)](https://aienglish-production-c27e.up.railway.app/)
[![Demo 视频](https://img.shields.io/badge/▶%20观看%20Demo-Bilibili-00A1D6?style=for-the-badge&logo=bilibili)](https://www.bilibili.com/video/BV16GEb6aEWS/)

> 体验地址：https://aienglish-production-c27e.up.railway.app/
> 视频链接：https://www.bilibili.com/video/BV16GEb6aEWS/

---

## 项目概述

基于网页的英语口语练习工具，帮助用户在 5 个真实场景中进行英文对话训练。Claude AI 驱动对话回复和语法/表达内联纠错，每条用户消息下方即时展示评分与建议。

## 核心功能

- **场景选择**：5 个练习场景（求职面试 / 餐厅点餐 / 商务会议 / 旅行出行 / 购物场景），侧边抽屉选择
- **卡片式对话**：每轮对话独立卡片，AI（紫色边框）/ 用户（青绿边框）视觉区分，从下向上淡入动画
- **内联反馈**：每条用户消息下方展示发音评分（0-100）、语法纠错和建议
- **语音输入**：支持浏览器 Web Speech API（Chrome），含实时波形可视化
- **文字输入兜底**：可直接在输入框键入英文，Enter 发送
- **历史记录**：按时间倒序展示历史练习，可展开查看对话详情
- **进度看板**：评分趋势折线图、场景分布饼图、常见纠错 Top 5

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite |
| 路由 | React Router v6 |
| 状态 | Zustand |
| 样式 | Tailwind CSS v3 |
| 动画 | Framer Motion |
| 图表 | Recharts |
| 图标 | Lucide React |
| 后端 | Node.js + Express 5 + TypeScript |
| AI | @anthropic-ai/sdk (claude-4-5-20251001) |
| 存储 | JSON 文件（`backend/data/db.json`） |
| 前端测试 | Vitest + React Testing Library |
| 后端测试 | Jest + Supertest |

## 语音说明

语音识别与发音评测均使用**科大讯飞**服务：

- **语音转文字（STT）**：讯飞实时语音转写 WebSocket API
- **发音评测（ISE）**：讯飞智能语音评测，对用户录音进行声学分析，返回准确度分、流畅度分及音节级错误（多读 / 漏读 / 替换），评分区间 0-100
- **AI 对话与语法纠错**：DeepSeek 大语言模型（OpenAI 兼容接口）

## 原创实现

- 基于 LLM 的实时语法纠错与 JSON 评分解析（`aiService.getFeedback`）
- Framer Motion 卡片从下向上淡入动画 + 录音按钮脉冲动画
- Web Audio API + Canvas 实时频谱波形可视化
- JSON 文件持久化存储服务（`storageService`）
- 自定义 Tailwind 设计令牌（primary / secondary / error / success / subtle）

## 安装与运行

**环境要求：** Node.js 18+，Chrome 浏览器

```bash
# 1. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 2. 配置 API Key
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入你的 ANTHROPIC_API_KEY

# 3. 启动后端（端口 3001）
cd backend && npm run dev

# 4. 启动前端（新终端，端口 5173）
cd frontend && npm run dev

# 5. 打开浏览器
# http://localhost:5173
```

## 运行测试

```bash
# 后端测试（13 个）
cd backend && npm test

# 前端测试（12 个）
cd frontend && npx vitest run
```

## 演示用法

1. 点击左上角菜单，选择**餐厅点餐**
2. 输入 `Hi, I want order a coffee and a sandwich.`
3. 查看 AI 回复和内联纠错反馈（如："I want order" → "I'd like to order"，语法评分）
4. 点击麦克风按钮，用英文说话（Chrome 必需）
5. 切换到「历史」页查看对话记录
6. 切换到「我的」页查看评分趋势图和纠错统计

## 已知限制

- 语音识别与发音评测依赖讯飞 API，需配置有效的 XFYUN_APP_ID / API_KEY / API_SECRET
- 讯飞 ISE 评测需音频时长足够（过短的录音会跳过评分）
- 桌面端优先，最小宽度 768px
- 数据存储为本地 JSON 文件，无多用户支持
- 生产环境需单独部署并配置 CORS 与 HTTPS


