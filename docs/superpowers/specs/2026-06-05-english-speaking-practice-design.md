# AI 英语口语陪练助手 — 设计文档

**日期：** 2026-06-05  
**议题：** 第三批 · 题目一「AI 英语口语陪练」  
**开发周期：** 2026-06-05 00:00 ~ 2026-06-07 23:59

---

## 一、项目概述

开发一款英语口语练习工具，帮助用户在指定场景下进行真实对话训练。支持场景选择、语音/文字输入、发音评测、语法与表达纠错、课后总结等核心能力。

---

## 二、整体架构

前后端分离，部署于同一仓库的两个子目录：

```
AI英语陪练助手/
├── frontend/     # Vite + React + TypeScript
└── backend/      # Node.js + Express + TypeScript
```

前端通过 Vite dev proxy 将 `/api/*` 转发至后端 `localhost:3001`。

---

## 三、前端架构

### 技术栈

| 用途 | 库 |
|------|----|
| 框架 | React 18 + TypeScript |
| 构建 | Vite |
| 路由 | React Router v6 |
| 状态 | Zustand |
| 样式 | Tailwind CSS v3 |
| 动画 | Framer Motion |
| 图表 | Recharts |
| 图标 | Lucide React |

### 页面路由

| 路由 | 页面 | 说明 |
|------|------|------|
| `/` | `PracticePage` | 主对话页（默认落地页） |
| `/history` | `HistoryPage` | 历史练习记录 |
| `/profile` | `ProfilePage` | 个人进度看板 |

### 页面布局（上下分区）

```
┌─────────────────────────────────────────┐
│  TopBar：场景名称 + 汉堡按钮             │
├─────────────────────────────────────────┤
│                                         │
│  ConversationFeed（可滚动）              │
│  └── MessageCard × N                   │
│       ├── MessageBubble（AI/用户文字）   │
│       └── FeedbackBlock（仅用户消息）    │
│           ├── 发音评分                  │
│           └── 纠错列表                  │
│                                         │
├─────────────────────────────────────────┤
│  ControlBar                             │
│  [文字输入框] [🎙录音按钮] [发送]         │
│  WaveformVisualizer（录音时展示）         │
└─────────────────────────────────────────┘

SceneDrawer（从左滑入，点击汉堡触发）
└── 场景列表：面试 / 点餐 / 会议 / 旅行 / 购物 …
```

### 组件树

```
App
├── Layout
│   ├── TopBar
│   └── SceneDrawer
├── PracticePage
│   ├── ConversationFeed
│   │   └── MessageCard
│   │       ├── MessageBubble
│   │       └── FeedbackBlock
│   └── ControlBar
│       ├── TextInput
│       ├── RecordButton
│       ├── WaveformVisualizer
│       └── SendButton
├── HistoryPage
│   └── SessionList → SessionCard → SessionDetail
└── ProfilePage
    ├── StatsBar
    ├── TrendChart
    ├── SceneChart
    └── ErrorTopList
```

### Zustand Store

```ts
practiceStore  // currentScene, messages[], isRecording, isLoading
historyStore   // sessions[]
profileStore   // stats, chartData
```

---

## 四、视觉风格规范

### 配色

| 用途 | 色值 |
|------|------|
| 主色渐变 | `#6C63FF → #4ECDC4` |
| 页面背景 | `#F8F7FF` |
| 卡片背景 | `#FFFFFF` |
| AI 卡片边框 | `#6C63FF` |
| 用户卡片边框 | `#4ECDC4` |
| 纠错高亮 | `#FF6B6B` |
| 发音高分 | `#51CF66` |
| 主文字 | `#2D3436` |
| 次文字 | `#636E72` |

### 圆角 & 间距

- 卡片圆角：`16px`
- 按钮圆角：`12px`
- 输入框圆角：`24px`（胶囊形）
- 卡片间距：`16px`，内边距：`20px`

### 关键动效

| 场景 | 动效 |
|------|------|
| 卡片出现 | 从下向上淡入（Framer Motion） |
| 录音波形 | 柱形实时跳动（Web Audio API + canvas） |
| 场景抽屉 | 从左滑入（`x: -100% → 0`） |
| 录音按钮 | 按下放大 + 脉冲光晕 |
| 发音分数 | 数字滚动动画 |

### 响应式

桌面端优先，最小宽度 `768px`。

---

## 五、数据模型

```ts
type Scene = {
  id: string
  name: string
  description: string
  prompt: string          // AI 系统提示词
}

type Correction = {
  original: string
  suggestion: string
  type: 'grammar' | 'expression' | 'pronunciation'
}

type Message = {
  id: string
  role: 'ai' | 'user'
  text: string
  audioUrl?: string
  feedback?: {
    pronunciationScore: number    // 0-100
    corrections: Correction[]
  }
  createdAt: string
}

type Session = {
  id: string
  sceneId: string
  messages: Message[]
  avgScore: number
  startedAt: string
  endedAt?: string
}
```

---

## 六、后端 API（Express）

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/sessions` | 创建新练习会话 |
| `POST` | `/api/sessions/:id/message` | 发送消息，返回 AI 回复 + 反馈 |
| `GET` | `/api/sessions` | 历史会话列表 |
| `GET` | `/api/sessions/:id` | 单个会话详情 |
| `GET` | `/api/scenes` | 可用场景列表 |
| `GET` | `/api/profile/stats` | 个人统计数据 |

---

## 七、MVP 范围

### 必须实现

- [ ] 场景选择（侧边抽屉，≥5 个场景）
- [ ] 文字输入发送消息，AI 回复
- [ ] 卡片式对话展示，内联反馈
- [ ] 发音评分 + 语法/表达纠错（文字模式先用规则/LLM 模拟）
- [ ] 底部完整控制栏（含波形动画占位）
- [ ] 历史记录页
- [ ] 进度看板页（折线图 + 饼图）
- [ ] 数据持久化（后端存储）

### 后续增强（语音相关）

- [ ] 浏览器 Web Speech API 语音识别
- [ ] 第三方 TTS 播放 AI 回复
- [ ] 真实发音评测 API 接入

---

## 八、已知限制

- MVP 阶段发音评分为 LLM 估算，非专业声学模型
- 响应式优先桌面端，移动端适配为次要
- 语音功能为后续接入，UI 控件先行实现
