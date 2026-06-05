# AI 英语口语陪练助手 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a web-based English speaking practice app with scene selection, card-style conversation UI, inline LLM-powered feedback, history tracking, and a progress dashboard.

**Architecture:** `/frontend` (Vite + React + TypeScript) proxies `/api/*` to `/backend` (Node.js + Express + TypeScript) on port 3001. Claude Haiku powers both conversation replies and grammar/expression feedback. Sessions persisted as JSON in `backend/data/db.json`.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS v3, Framer Motion, Recharts, Zustand, React Router v6, Express, @anthropic-ai/sdk, Vitest, React Testing Library, Jest, Supertest

---

## Prerequisites

- Node.js 18+ installed
- `ANTHROPIC_API_KEY` environment variable set in `backend/.env`

---

## Task 1: Project Scaffold

**Files:**
- Create: `frontend/` (Vite React-TS app)
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/jest.config.js`
- Create: `backend/.env.example`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tailwind.config.js`
- Create: `frontend/postcss.config.js`
- Create: `frontend/src/index.css`
- Create: `frontend/src/types/speech.d.ts`

- [ ] **Step 1: Create frontend with Vite**

Run in project root `C:\Users\23223\Desktop\AI英语陪练助手`:
```bash
npm create vite@latest frontend -- --template react-ts
```

- [ ] **Step 2: Install frontend dependencies**

```bash
cd frontend
npm install react-router-dom zustand framer-motion recharts lucide-react
npm install -D tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/jest-dom @vitest/coverage-v8 jsdom @types/node
npx tailwindcss init -p
```

- [ ] **Step 3: Install backend dependencies**

Run in project root:
```bash
mkdir backend
cd backend
npm init -y
npm install express cors dotenv @anthropic-ai/sdk uuid
npm install -D typescript @types/node @types/express @types/cors @types/uuid ts-node nodemon jest ts-jest @types/jest supertest @types/supertest
```

- [ ] **Step 4: Write `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Write `backend/jest.config.js`**

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  forceExit: true
}
```

- [ ] **Step 6: Update `backend/package.json` scripts**

Add to the `"scripts"` section:
```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "jest --forceExit"
  }
}
```

- [ ] **Step 7: Write `backend/.env.example`**

```
ANTHROPIC_API_KEY=your_key_here
PORT=3001
```

Then copy to `backend/.env` and fill in the real key.

- [ ] **Step 8: Overwrite `frontend/vite.config.ts`**

```ts
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001'
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts']
  }
})
```

- [ ] **Step 9: Overwrite `frontend/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        secondary: '#4ECDC4',
        error: '#FF6B6B',
        success: '#51CF66',
        bg: '#F8F7FF',
        text: '#2D3436',
        subtle: '#636E72'
      },
      borderRadius: {
        card: '16px',
        btn: '12px',
        pill: '24px'
      }
    }
  },
  plugins: []
}
```

- [ ] **Step 10: Overwrite `frontend/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #F8F7FF;
}

* {
  box-sizing: border-box;
}
```

- [ ] **Step 11: Create `frontend/src/test-setup.ts`**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 12: Create `frontend/src/types/speech.d.ts`**

```ts
interface Window {
  SpeechRecognition: typeof SpeechRecognition
  webkitSpeechRecognition: typeof SpeechRecognition
}
```

- [ ] **Step 13: Commit**

```bash
git add .
git commit -m "feat: project scaffold — frontend (Vite+React+TS) and backend (Express+TS)"
```

---

## Task 2: Shared Types + Backend Storage Service

**Files:**
- Create: `backend/src/types/index.ts`
- Create: `frontend/src/types/index.ts`
- Create: `backend/src/services/storageService.ts`
- Create: `backend/src/__tests__/storageService.test.ts`
- Create: `backend/data/.gitkeep`

- [ ] **Step 1: Write failing tests for storageService**

Create `backend/src/__tests__/storageService.test.ts`:

```ts
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(__dirname, '../../data/db.json')

beforeEach(() => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
})

afterAll(() => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
})

const mockSession = {
  id: 'test-id',
  sceneId: 'restaurant',
  sceneName: '餐厅点餐',
  messages: [],
  avgScore: 0,
  startedAt: '2026-06-05T00:00:00.000Z'
}

test('createSession stores and returns session', () => {
  const { storageService } = require('../services/storageService')
  const session = storageService.createSession(mockSession)
  expect(session.id).toBe('test-id')
  expect(session.sceneName).toBe('餐厅点餐')
})

test('getSessions returns stored sessions', () => {
  const { storageService } = require('../services/storageService')
  storageService.createSession(mockSession)
  const sessions = storageService.getSessions()
  expect(sessions).toHaveLength(1)
  expect(sessions[0].id).toBe('test-id')
})

test('getSession returns correct session', () => {
  const { storageService } = require('../services/storageService')
  storageService.createSession(mockSession)
  const found = storageService.getSession('test-id')
  expect(found?.sceneName).toBe('餐厅点餐')
})

test('getSession returns undefined for missing id', () => {
  const { storageService } = require('../services/storageService')
  expect(storageService.getSession('missing')).toBeUndefined()
})

test('updateSession modifies session', () => {
  const { storageService } = require('../services/storageService')
  storageService.createSession(mockSession)
  const updated = storageService.updateSession('test-id', { avgScore: 90 })
  expect(updated?.avgScore).toBe(90)
  expect(storageService.getSession('test-id')?.avgScore).toBe(90)
})

test('updateSession returns undefined for missing id', () => {
  const { storageService } = require('../services/storageService')
  expect(storageService.updateSession('missing', { avgScore: 90 })).toBeUndefined()
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd backend && npm test -- storageService
```

Expected: FAIL with "Cannot find module '../services/storageService'"

- [ ] **Step 3: Write `backend/src/types/index.ts`**

```ts
export type Scene = {
  id: string
  name: string
  description: string
  prompt: string
}

export type CorrectionType = 'grammar' | 'expression' | 'pronunciation'

export type Correction = {
  original: string
  suggestion: string
  type: CorrectionType
  explanation: string
}

export type Feedback = {
  pronunciationScore: number
  corrections: Correction[]
}

export type Message = {
  id: string
  role: 'ai' | 'user'
  text: string
  feedback?: Feedback
  createdAt: string
}

export type Session = {
  id: string
  sceneId: string
  sceneName: string
  messages: Message[]
  avgScore: number
  startedAt: string
  endedAt?: string
}
```

- [ ] **Step 4: Write `backend/src/services/storageService.ts`**

```ts
import fs from 'fs'
import path from 'path'
import { Session } from '../types'

const DB_PATH = path.join(__dirname, '../../data/db.json')

type DB = { sessions: Session[] }

function read(): DB {
  if (!fs.existsSync(DB_PATH)) return { sessions: [] }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return { sessions: [] }
  }
}

function write(db: DB): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export const storageService = {
  getSessions(): Session[] {
    return read().sessions
  },
  getSession(id: string): Session | undefined {
    return read().sessions.find(s => s.id === id)
  },
  createSession(session: Session): Session {
    const db = read()
    db.sessions.push(session)
    write(db)
    return session
  },
  updateSession(id: string, updates: Partial<Session>): Session | undefined {
    const db = read()
    const idx = db.sessions.findIndex(s => s.id === id)
    if (idx === -1) return undefined
    db.sessions[idx] = { ...db.sessions[idx], ...updates }
    write(db)
    return db.sessions[idx]
  }
}
```

- [ ] **Step 5: Create `backend/data/.gitkeep`**

Create an empty file at `backend/data/.gitkeep` so git tracks the directory.

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd backend && npm test -- storageService
```

Expected: PASS (6 tests)

- [ ] **Step 7: Write `frontend/src/types/index.ts`**

```ts
export type Scene = {
  id: string
  name: string
  description: string
  prompt: string
}

export type CorrectionType = 'grammar' | 'expression' | 'pronunciation'

export type Correction = {
  original: string
  suggestion: string
  type: CorrectionType
  explanation: string
}

export type Feedback = {
  pronunciationScore: number
  corrections: Correction[]
}

export type Message = {
  id: string
  role: 'ai' | 'user'
  text: string
  feedback?: Feedback
  createdAt: string
}

export type Session = {
  id: string
  sceneId: string
  sceneName: string
  messages: Message[]
  avgScore: number
  startedAt: string
  endedAt?: string
}
```

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: shared types and backend JSON storage service with tests"
```

---

## Task 3: Backend Scenes Data + AI Service

**Files:**
- Create: `backend/src/data/scenes.ts`
- Create: `backend/src/services/aiService.ts`

- [ ] **Step 1: Write `backend/src/data/scenes.ts`**

```ts
import { Scene } from '../types'

export const SCENES: Scene[] = [
  {
    id: 'job-interview',
    name: '求职面试',
    description: '模拟英语面试，练习自我介绍和常见问题',
    prompt: 'You are a friendly interviewer for a software engineering position. Ask questions about the candidate\'s experience, skills, and motivation. Keep each response to 1-2 sentences. Be encouraging but professional.'
  },
  {
    id: 'restaurant',
    name: '餐厅点餐',
    description: '在英语餐厅点餐、询问菜单、付款',
    prompt: 'You are a friendly waiter at a casual American restaurant. Take the customer\'s order, answer menu questions, and handle typical restaurant interactions. Keep responses natural and brief (1-2 sentences).'
  },
  {
    id: 'business-meeting',
    name: '商务会议',
    description: '参与英语商务会议，表达观点和讨论方案',
    prompt: 'You are a colleague in a business meeting discussing a new product launch strategy. Engage professionally, ask for opinions, respond to suggestions. Keep exchanges concise (1-2 sentences).'
  },
  {
    id: 'travel',
    name: '旅行出行',
    description: '机场、酒店、问路等旅行场景',
    prompt: 'You play various travel roles: airport staff, hotel receptionist, or a local giving directions. Respond naturally to the traveler\'s requests. Keep responses brief and helpful (1-2 sentences).'
  },
  {
    id: 'shopping',
    name: '购物场景',
    description: '在英语商店购物、询价、退换货',
    prompt: 'You are a sales associate at a clothing store. Help find products, answer questions about sizes and prices, handle returns. Be friendly and concise (1-2 sentences).'
  }
]
```

- [ ] **Step 2: Write `backend/src/services/aiService.ts`**

```ts
import Anthropic from '@anthropic-ai/sdk'
import { Message, Feedback, Scene } from '../types'

const client = new Anthropic()

export async function getAIReply(scene: Scene, history: Message[]): Promise<string> {
  const messages = history.map(m => ({
    role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
    content: m.text
  }))

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: scene.prompt,
    messages
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from AI')
  return block.text
}

export async function getFeedback(userText: string, sceneName: string): Promise<Feedback> {
  const prompt = `You are an English language teacher evaluating a student's sentence in a "${sceneName}" scenario.

Analyze: "${userText}"

Respond ONLY with valid JSON, no markdown code fences, no extra text:
{
  "pronunciationScore": <integer 0-100, based on grammar and expression quality>,
  "corrections": [
    {
      "original": "<exact problematic phrase from the sentence>",
      "suggestion": "<corrected version>",
      "type": "<grammar|expression|pronunciation>",
      "explanation": "<brief explanation in Chinese, max 20 characters>"
    }
  ]
}

If the sentence is grammatically correct and natural, return an empty corrections array and a high score (85-100). Be encouraging.`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from AI')
  return JSON.parse(block.text) as Feedback
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: backend scenes data and Claude AI service (reply + feedback)"
```

---

## Task 4: Backend Routes + Express App

**Files:**
- Create: `backend/src/routes/scenes.ts`
- Create: `backend/src/routes/sessions.ts`
- Create: `backend/src/routes/profile.ts`
- Create: `backend/src/index.ts`
- Create: `backend/src/__tests__/sessions.test.ts`

- [ ] **Step 1: Write failing tests for sessions routes**

Create `backend/src/__tests__/sessions.test.ts`:

```ts
import request from 'supertest'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(__dirname, '../../data/db.json')

beforeEach(() => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
  jest.resetModules()
})

afterAll(() => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
})

function getApp() {
  return require('../index').default
}

test('GET /api/health returns ok', async () => {
  const res = await request(getApp()).get('/api/health')
  expect(res.status).toBe(200)
  expect(res.body.ok).toBe(true)
})

test('GET /api/scenes returns 5 scenes', async () => {
  const res = await request(getApp()).get('/api/scenes')
  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(5)
})

test('POST /api/sessions creates session', async () => {
  const res = await request(getApp())
    .post('/api/sessions')
    .send({ sceneId: 'restaurant' })
  expect(res.status).toBe(200)
  expect(res.body.sceneId).toBe('restaurant')
  expect(res.body.id).toBeDefined()
  expect(res.body.messages).toEqual([])
})

test('POST /api/sessions returns 400 for invalid sceneId', async () => {
  const res = await request(getApp())
    .post('/api/sessions')
    .send({ sceneId: 'invalid-scene' })
  expect(res.status).toBe(400)
})

test('GET /api/sessions returns session list', async () => {
  const app = getApp()
  await request(app).post('/api/sessions').send({ sceneId: 'restaurant' })
  const res = await request(app).get('/api/sessions')
  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(1)
})

test('GET /api/sessions/:id returns 404 for missing', async () => {
  const res = await request(getApp()).get('/api/sessions/nonexistent-id')
  expect(res.status).toBe(404)
})

test('POST /api/sessions/:id/message returns 400 without text', async () => {
  const app = getApp()
  const { body: session } = await request(app)
    .post('/api/sessions')
    .send({ sceneId: 'restaurant' })
  const res = await request(app)
    .post(`/api/sessions/${session.id}/message`)
    .send({})
  expect(res.status).toBe(400)
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd backend && npm test -- sessions
```

Expected: FAIL with "Cannot find module '../index'"

- [ ] **Step 3: Write `backend/src/routes/scenes.ts`**

```ts
import { Router } from 'express'
import { SCENES } from '../data/scenes'

const router = Router()

router.get('/', (_req, res) => {
  res.json(SCENES)
})

export default router
```

- [ ] **Step 4: Write `backend/src/routes/profile.ts`**

```ts
import { Router } from 'express'
import { storageService } from '../services/storageService'

const router = Router()

router.get('/stats', (_req, res) => {
  const sessions = storageService.getSessions()

  const allMessages = sessions.flatMap(s => s.messages)
  const scoredMessages = allMessages.filter(m => m.feedback !== undefined)

  const avgScore = scoredMessages.length
    ? Math.round(scoredMessages.reduce((a, m) => a + m.feedback!.pronunciationScore, 0) / scoredMessages.length)
    : 0

  const scoreHistory = sessions
    .filter(s => s.avgScore > 0)
    .map(s => ({ date: s.startedAt.slice(0, 10), score: s.avgScore }))
    .slice(-30)

  const sceneMap: Record<string, number> = {}
  sessions.forEach(s => {
    sceneMap[s.sceneName] = (sceneMap[s.sceneName] ?? 0) + 1
  })
  const sceneDistribution = Object.entries(sceneMap).map(([sceneName, count]) => ({ sceneName, count }))

  const errorMap: Record<string, { suggestion: string; type: string; count: number }> = {}
  allMessages
    .flatMap(m => m.feedback?.corrections ?? [])
    .forEach(c => {
      const key = c.suggestion
      if (!errorMap[key]) errorMap[key] = { suggestion: c.suggestion, type: c.type, count: 0 }
      errorMap[key].count++
    })
  const topErrors = Object.values(errorMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  res.json({
    totalSessions: sessions.length,
    totalMessages: allMessages.length,
    avgScore,
    scoreHistory,
    sceneDistribution,
    topErrors
  })
})

export default router
```

- [ ] **Step 5: Write `backend/src/routes/sessions.ts`**

```ts
import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { storageService } from '../services/storageService'
import { getAIReply, getFeedback } from '../services/aiService'
import { SCENES } from '../data/scenes'
import { Message } from '../types'

const router = Router()

router.post('/', (req: Request, res: Response) => {
  const { sceneId } = req.body
  const scene = SCENES.find(s => s.id === sceneId)
  if (!scene) return res.status(400).json({ error: 'Invalid sceneId' })

  const session = storageService.createSession({
    id: uuidv4(),
    sceneId,
    sceneName: scene.name,
    messages: [],
    avgScore: 0,
    startedAt: new Date().toISOString()
  })
  return res.json(session)
})

router.get('/', (_req: Request, res: Response) => {
  res.json(storageService.getSessions())
})

router.get('/:id', (req: Request, res: Response) => {
  const session = storageService.getSession(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })
  return res.json(session)
})

router.post('/:id/message', async (req: Request, res: Response) => {
  const session = storageService.getSession(req.params.id)
  if (!session) return res.status(404).json({ error: 'Session not found' })

  const { text } = req.body
  if (!text?.trim()) return res.status(400).json({ error: 'text is required' })

  const scene = SCENES.find(s => s.id === session.sceneId)!

  const userMessage: Message = {
    id: uuidv4(),
    role: 'user',
    text: text.trim(),
    createdAt: new Date().toISOString()
  }

  const historyWithUser = [...session.messages, userMessage]

  const [aiReply, feedback] = await Promise.all([
    getAIReply(scene, historyWithUser),
    getFeedback(text.trim(), scene.name)
  ])

  userMessage.feedback = feedback

  const aiMessage: Message = {
    id: uuidv4(),
    role: 'ai',
    text: aiReply,
    createdAt: new Date().toISOString()
  }

  const updatedMessages = [...session.messages, userMessage, aiMessage]
  const scores = updatedMessages
    .filter(m => m.feedback !== undefined)
    .map(m => m.feedback!.pronunciationScore)
  const avgScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  storageService.updateSession(session.id, { messages: updatedMessages, avgScore })

  return res.json({ userMessage, aiMessage })
})

export default router
```

- [ ] **Step 6: Write `backend/src/index.ts`**

```ts
import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sessionsRouter from './routes/sessions'
import scenesRouter from './routes/scenes'
import profileRouter from './routes/profile'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())

app.use('/api/sessions', sessionsRouter)
app.use('/api/scenes', scenesRouter)
app.use('/api/profile', profileRouter)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

if (require.main === module) {
  const PORT = process.env.PORT ?? 3001
  app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`))
}

export default app
```

- [ ] **Step 7: Run tests — expect PASS (excluding message test that calls Claude)**

```bash
cd backend && npm test -- sessions
```

Expected: 6 of 7 tests PASS. The `POST /:id/message` test without text should PASS (400). Tests that hit Claude are integration tests — skip for now.

- [ ] **Step 8: Verify backend starts**

```bash
cd backend && npm run dev
```

Expected: "Backend running on http://localhost:3001" — then Ctrl+C.

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: backend Express app — scenes, sessions, profile routes"
```

---

## Task 5: Frontend API Client

**Files:**
- Create: `frontend/src/api/client.ts`

- [ ] **Step 1: Write `frontend/src/api/client.ts`**

```ts
import type { Scene, Session, Message } from '../types'

export type ProfileStats = {
  totalSessions: number
  totalMessages: number
  avgScore: number
  scoreHistory: Array<{ date: string; score: number }>
  sceneDistribution: Array<{ sceneName: string; count: number }>
  topErrors: Array<{ suggestion: string; type: string; count: number }>
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `API error ${res.status}`)
  }
  return res.json()
}

export const api = {
  getScenes: () => request<Scene[]>('/scenes'),

  createSession: (sceneId: string) =>
    request<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ sceneId })
    }),

  sendMessage: (sessionId: string, text: string) =>
    request<{ userMessage: Message; aiMessage: Message }>(
      `/sessions/${sessionId}/message`,
      { method: 'POST', body: JSON.stringify({ text }) }
    ),

  getSessions: () => request<Session[]>('/sessions'),

  getSession: (id: string) => request<Session>(`/sessions/${id}`),

  getProfileStats: () => request<ProfileStats>('/profile/stats')
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "feat: frontend API client"
```

---

## Task 6: Zustand Stores

**Files:**
- Create: `frontend/src/store/practiceStore.ts`
- Create: `frontend/src/store/historyStore.ts`
- Create: `frontend/src/store/profileStore.ts`
- Create: `frontend/src/__tests__/practiceStore.test.ts`

- [ ] **Step 1: Write failing tests for practiceStore**

Create `frontend/src/__tests__/practiceStore.test.ts`:

```ts
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

vi.mock('../api/client', () => ({
  api: {
    getScenes: vi.fn(),
    createSession: vi.fn(),
    sendMessage: vi.fn()
  }
}))

import { api } from '../api/client'
import { usePracticeStore } from '../store/practiceStore'

const mockScene = { id: 'restaurant', name: '餐厅点餐', description: '...', prompt: '...' }
const mockSession = {
  id: 'sess-1', sceneId: 'restaurant', sceneName: '餐厅点餐',
  messages: [], avgScore: 0, startedAt: '2026-06-05T00:00:00.000Z'
}
const mockUserMsg = { id: 'u1', role: 'user' as const, text: 'Hello', createdAt: '', feedback: undefined }
const mockAIMsg = { id: 'a1', role: 'ai' as const, text: 'Hi there!', createdAt: '', feedback: undefined }

beforeEach(() => {
  usePracticeStore.setState({
    scenes: [], currentScene: null, currentSession: null,
    messages: [], isLoading: false, isRecording: false
  })
  vi.clearAllMocks()
})

test('loadScenes populates scenes', async () => {
  vi.mocked(api.getScenes).mockResolvedValue([mockScene])
  await act(async () => { await usePracticeStore.getState().loadScenes() })
  expect(usePracticeStore.getState().scenes).toEqual([mockScene])
})

test('setScene creates session and resets messages', async () => {
  vi.mocked(api.createSession).mockResolvedValue(mockSession)
  await act(async () => { await usePracticeStore.getState().setScene(mockScene) })
  const state = usePracticeStore.getState()
  expect(state.currentScene).toEqual(mockScene)
  expect(state.currentSession).toEqual(mockSession)
  expect(state.messages).toEqual([])
})

test('sendMessage appends both messages', async () => {
  usePracticeStore.setState({ currentSession: mockSession })
  vi.mocked(api.sendMessage).mockResolvedValue({ userMessage: mockUserMsg, aiMessage: mockAIMsg })
  await act(async () => { await usePracticeStore.getState().sendMessage('Hello') })
  expect(usePracticeStore.getState().messages).toEqual([mockUserMsg, mockAIMsg])
})

test('sendMessage does nothing without session', async () => {
  await act(async () => { await usePracticeStore.getState().sendMessage('Hello') })
  expect(api.sendMessage).not.toHaveBeenCalled()
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd frontend && npx vitest run src/__tests__/practiceStore.test.ts
```

Expected: FAIL with "Cannot find module '../store/practiceStore'"

- [ ] **Step 3: Write `frontend/src/store/practiceStore.ts`**

```ts
import { create } from 'zustand'
import { Scene, Message, Session } from '../types'
import { api } from '../api/client'

type PracticeState = {
  scenes: Scene[]
  currentScene: Scene | null
  currentSession: Session | null
  messages: Message[]
  isLoading: boolean
  isRecording: boolean
  loadScenes: () => Promise<void>
  setScene: (scene: Scene) => Promise<void>
  sendMessage: (text: string) => Promise<void>
  setIsRecording: (v: boolean) => void
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  scenes: [],
  currentScene: null,
  currentSession: null,
  messages: [],
  isLoading: false,
  isRecording: false,

  loadScenes: async () => {
    const scenes = await api.getScenes()
    set({ scenes })
  },

  setScene: async (scene) => {
    set({ isLoading: true })
    const session = await api.createSession(scene.id)
    set({ currentScene: scene, currentSession: session, messages: [], isLoading: false })
  },

  sendMessage: async (text) => {
    const { currentSession } = get()
    if (!currentSession) return
    set({ isLoading: true })
    const { userMessage, aiMessage } = await api.sendMessage(currentSession.id, text)
    set(state => ({
      messages: [...state.messages, userMessage, aiMessage],
      isLoading: false
    }))
  },

  setIsRecording: (v) => set({ isRecording: v })
}))
```

- [ ] **Step 4: Write `frontend/src/store/historyStore.ts`**

```ts
import { create } from 'zustand'
import { Session } from '../types'
import { api } from '../api/client'

type HistoryState = {
  sessions: Session[]
  isLoading: boolean
  loadSessions: () => Promise<void>
}

export const useHistoryStore = create<HistoryState>((set) => ({
  sessions: [],
  isLoading: false,
  loadSessions: async () => {
    set({ isLoading: true })
    const sessions = await api.getSessions()
    set({
      sessions: sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
      isLoading: false
    })
  }
}))
```

- [ ] **Step 5: Write `frontend/src/store/profileStore.ts`**

```ts
import { create } from 'zustand'
import { ProfileStats, api } from '../api/client'

type ProfileState = {
  stats: ProfileStats | null
  isLoading: boolean
  loadStats: () => Promise<void>
}

export const useProfileStore = create<ProfileState>((set) => ({
  stats: null,
  isLoading: false,
  loadStats: async () => {
    set({ isLoading: true })
    const stats = await api.getProfileStats()
    set({ stats, isLoading: false })
  }
}))
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd frontend && npx vitest run src/__tests__/practiceStore.test.ts
```

Expected: PASS (4 tests)

- [ ] **Step 7: Commit**

```bash
git add .
git commit -m "feat: Zustand stores (practice, history, profile) with tests"
```

---

## Task 7: Layout Components

**Files:**
- Create: `frontend/src/components/layout/AppLayout.tsx`
- Create: `frontend/src/components/layout/TopBar.tsx`
- Create: `frontend/src/components/layout/SceneDrawer.tsx`

- [ ] **Step 1: Write `frontend/src/components/layout/AppLayout.tsx`**

```tsx
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import TopBar from './TopBar'
import SceneDrawer from './SceneDrawer'

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  return (
    <div className="min-h-screen bg-bg flex flex-col" style={{ minWidth: 768 }}>
      <TopBar onMenuClick={() => setDrawerOpen(true)} />
      <SceneDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="flex-1 flex flex-col overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
```

- [ ] **Step 2: Write `frontend/src/components/layout/TopBar.tsx`**

```tsx
import { Menu, Mic } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { usePracticeStore } from '../../store/practiceStore'

type Props = { onMenuClick: () => void }

const NAV = [
  { path: '/', label: '练习' },
  { path: '/history', label: '历史' },
  { path: '/profile', label: '我的' }
]

export default function TopBar({ onMenuClick }: Props) {
  const { currentScene } = usePracticeStore()
  const { pathname } = useLocation()

  return (
    <header className="h-14 bg-white shadow-sm flex items-center px-4 gap-3 z-10 shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-btn hover:bg-bg transition-colors"
        aria-label="打开场景菜单"
      >
        <Menu size={20} className="text-text" />
      </button>
      <div className="flex items-center gap-2 flex-1">
        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center shrink-0">
          <Mic size={14} className="text-white" />
        </div>
        <span className="font-bold text-text">英语口语陪练</span>
        {currentScene && pathname === '/' && (
          <span className="ml-2 text-sm text-subtle bg-bg px-2 py-0.5 rounded-full truncate max-w-32">
            {currentScene.name}
          </span>
        )}
      </div>
      <nav className="flex gap-1">
        {NAV.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-3 py-1.5 rounded-btn text-sm font-medium transition-colors ${
              pathname === item.path
                ? 'bg-gradient-to-r from-primary to-secondary text-white'
                : 'text-subtle hover:text-text hover:bg-bg'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
```

- [ ] **Step 3: Write `frontend/src/components/layout/SceneDrawer.tsx`**

```tsx
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePracticeStore } from '../../store/practiceStore'

const EMOJI: Record<string, string> = {
  'job-interview': '💼',
  'restaurant': '🍽️',
  'business-meeting': '📊',
  'travel': '✈️',
  'shopping': '🛍️'
}

type Props = { open: boolean; onClose: () => void }

export default function SceneDrawer({ open, onClose }: Props) {
  const { scenes, currentScene, setScene, isLoading } = usePracticeStore()
  const navigate = useNavigate()

  const handleSelect = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return
    onClose()
    await setScene(scene)
    navigate('/')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-20"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-white z-30 shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="font-bold text-text text-lg">选择场景</h2>
              <button onClick={onClose} className="p-1 rounded-btn hover:bg-bg">
                <X size={20} className="text-subtle" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
              {scenes.length === 0 && (
                <p className="text-sm text-subtle text-center mt-8">加载中…</p>
              )}
              {scenes.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => handleSelect(scene.id)}
                  disabled={isLoading}
                  className={`w-full text-left p-4 rounded-card border-2 transition-all disabled:opacity-50 ${
                    currentScene?.id === scene.id
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent bg-bg hover:border-secondary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{EMOJI[scene.id] ?? '🎤'}</span>
                    <div>
                      <div className="font-semibold text-text">{scene.name}</div>
                      <div className="text-xs text-subtle mt-0.5">{scene.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add .
git commit -m "feat: layout components — AppLayout, TopBar, SceneDrawer"
```

---

## Task 8: Conversation Components

**Files:**
- Create: `frontend/src/components/conversation/FeedbackBlock.tsx`
- Create: `frontend/src/components/conversation/MessageBubble.tsx`
- Create: `frontend/src/components/conversation/MessageCard.tsx`
- Create: `frontend/src/components/conversation/ConversationFeed.tsx`
- Create: `frontend/src/__tests__/FeedbackBlock.test.tsx`
- Create: `frontend/src/__tests__/MessageCard.test.tsx`

- [ ] **Step 1: Write failing component tests**

Create `frontend/src/__tests__/FeedbackBlock.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import FeedbackBlock from '../components/conversation/FeedbackBlock'
import type { Feedback } from '../types'

const goodFeedback: Feedback = { pronunciationScore: 92, corrections: [] }
const badFeedback: Feedback = {
  pronunciationScore: 62,
  corrections: [{
    original: 'I want order',
    suggestion: "I'd like to order",
    type: 'grammar',
    explanation: '缺少不定式'
  }]
}

test('renders pronunciation score', () => {
  render(<FeedbackBlock feedback={goodFeedback} />)
  expect(screen.getByText('92')).toBeInTheDocument()
})

test('shows no corrections message for perfect sentence', () => {
  const { container } = render(<FeedbackBlock feedback={goodFeedback} />)
  // check icon svg present
  expect(container.querySelector('svg')).toBeInTheDocument()
})

test('renders correction original and suggestion', () => {
  render(<FeedbackBlock feedback={badFeedback} />)
  expect(screen.getByText('I want order')).toBeInTheDocument()
  expect(screen.getByText("I'd like to order")).toBeInTheDocument()
})

test('renders correction explanation', () => {
  render(<FeedbackBlock feedback={badFeedback} />)
  expect(screen.getByText('缺少不定式')).toBeInTheDocument()
})
```

Create `frontend/src/__tests__/MessageCard.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react'
import MessageCard from '../components/conversation/MessageCard'
import type { Message } from '../types'

const aiMessage: Message = { id: '1', role: 'ai', text: 'Hello! How can I help you?', createdAt: '' }
const userMessage: Message = {
  id: '2', role: 'user', text: 'I want a coffee.',
  createdAt: '',
  feedback: { pronunciationScore: 75, corrections: [] }
}

test('renders AI message text', () => {
  render(<MessageCard message={aiMessage} />)
  expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument()
})

test('renders user message text', () => {
  render(<MessageCard message={userMessage} />)
  expect(screen.getByText('I want a coffee.')).toBeInTheDocument()
})

test('shows feedback block for user message with feedback', () => {
  render(<MessageCard message={userMessage} />)
  expect(screen.getByText('75')).toBeInTheDocument()
})

test('does not show feedback for AI message', () => {
  render(<MessageCard message={aiMessage} />)
  expect(screen.queryByText('发音评分')).not.toBeInTheDocument()
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd frontend && npx vitest run src/__tests__/FeedbackBlock.test.tsx src/__tests__/MessageCard.test.tsx
```

Expected: FAIL with "Cannot find module"

- [ ] **Step 3: Write `frontend/src/components/conversation/FeedbackBlock.tsx`**

```tsx
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle } from 'lucide-react'
import type { Feedback } from '../../types'

const scoreColor = (score: number) =>
  score >= 80 ? 'text-success' : score >= 60 ? 'text-yellow-500' : 'text-error'

const typeBadgeClass: Record<string, string> = {
  grammar: 'bg-blue-100 text-blue-700',
  expression: 'bg-purple-100 text-purple-700',
  pronunciation: 'bg-orange-100 text-orange-700'
}

type Props = { feedback: Feedback }

export default function FeedbackBlock({ feedback }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 pt-3 border-t border-gray-100 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-subtle font-medium">发音评分</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-lg font-bold ${scoreColor(feedback.pronunciationScore)}`}
        >
          {feedback.pronunciationScore}
        </motion.span>
        <span className="text-xs text-subtle">/ 100</span>
        {feedback.corrections.length === 0 && (
          <CheckCircle size={14} className="text-success ml-auto" />
        )}
      </div>
      {feedback.corrections.map((c, i) => (
        <div key={i} className="flex flex-col gap-1 mb-2 last:mb-0">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-error mt-0.5 shrink-0" />
            <div className="flex-1 flex flex-wrap items-center gap-1">
              <span className="line-through text-error text-sm">{c.original}</span>
              <span className="text-subtle text-sm">→</span>
              <span className="text-success text-sm font-medium">{c.suggestion}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${typeBadgeClass[c.type] ?? 'bg-gray-100 text-gray-600'}`}>
                {c.type}
              </span>
            </div>
          </div>
          <p className="text-xs text-subtle ml-5">{c.explanation}</p>
        </div>
      ))}
    </motion.div>
  )
}
```

- [ ] **Step 4: Write `frontend/src/components/conversation/MessageBubble.tsx`**

```tsx
import { Bot, User } from 'lucide-react'

type Props = { role: 'ai' | 'user'; text: string }

export default function MessageBubble({ role, text }: Props) {
  const isAI = role === 'ai'
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isAI ? 'bg-primary/10' : 'bg-secondary/10'
      }`}>
        {isAI
          ? <Bot size={16} className="text-primary" />
          : <User size={16} className="text-secondary" />
        }
      </div>
      <div>
        <span className="text-xs font-medium text-subtle mb-1 block">
          {isAI ? 'AI 教练' : '你'}
        </span>
        <p className="text-text leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Write `frontend/src/components/conversation/MessageCard.tsx`**

```tsx
import { motion } from 'framer-motion'
import MessageBubble from './MessageBubble'
import FeedbackBlock from './FeedbackBlock'
import type { Message } from '../../types'

type Props = { message: Message }

export default function MessageCard({ message }: Props) {
  const isAI = message.role === 'ai'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-card p-5 shadow-sm border-l-4 ${
        isAI ? 'border-primary' : 'border-secondary'
      }`}
    >
      <MessageBubble role={message.role} text={message.text} />
      {message.feedback && <FeedbackBlock feedback={message.feedback} />}
    </motion.div>
  )
}
```

- [ ] **Step 6: Write `frontend/src/components/conversation/ConversationFeed.tsx`**

```tsx
import { useEffect, useRef } from 'react'
import MessageCard from './MessageCard'
import type { Message } from '../../types'

type Props = { messages: Message[]; isLoading: boolean }

export default function ConversationFeed({ messages, isLoading }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, isLoading])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-subtle p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">🎤</div>
          <p className="font-semibold text-lg text-text">选择场景开始练习</p>
          <p className="text-sm mt-2">点击左上角菜单选择练习场景</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {messages.map(msg => <MessageCard key={msg.id} message={msg} />)}
      {isLoading && (
        <div className="bg-white rounded-card p-5 shadow-sm border-l-4 border-primary animate-pulse">
          <div className="flex gap-3 items-center">
            <div className="w-8 h-8 rounded-full bg-primary/10 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
```

- [ ] **Step 7: Run tests — expect PASS**

```bash
cd frontend && npx vitest run src/__tests__/FeedbackBlock.test.tsx src/__tests__/MessageCard.test.tsx
```

Expected: PASS (8 tests total)

- [ ] **Step 8: Commit**

```bash
git add .
git commit -m "feat: conversation components — FeedbackBlock, MessageBubble, MessageCard, ConversationFeed with tests"
```

---

## Task 9: ControlBar Components

**Files:**
- Create: `frontend/src/components/controls/RecordButton.tsx`
- Create: `frontend/src/components/controls/WaveformVisualizer.tsx`
- Create: `frontend/src/components/controls/ControlBar.tsx`

- [ ] **Step 1: Write `frontend/src/components/controls/RecordButton.tsx`**

```tsx
import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'

type Props = {
  isRecording: boolean
  onToggle: () => void
  disabled?: boolean
}

export default function RecordButton({ isRecording, onToggle, disabled }: Props) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onToggle}
      disabled={disabled}
      aria-label={isRecording ? '停止录音' : '开始录音'}
      className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isRecording
          ? 'bg-error text-white'
          : 'bg-gradient-to-r from-primary to-secondary text-white'
      }`}
    >
      {isRecording && (
        <motion.span
          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 rounded-full bg-error"
        />
      )}
      <span className="relative z-10">
        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
      </span>
    </motion.button>
  )
}
```

- [ ] **Step 2: Write `frontend/src/components/controls/WaveformVisualizer.tsx`**

```tsx
import { useEffect, useRef } from 'react'

type Props = { isRecording: boolean }

export default function WaveformVisualizer({ isRecording }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (!isRecording) {
      cancelAnimationFrame(animRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')!
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
      return
    }

    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
      streamRef.current = stream
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 64
      source.connect(analyser)

      const draw = () => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')!
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        const barW = canvas.width / data.length
        data.forEach((v, i) => {
          const h = Math.max(2, (v / 255) * canvas.height)
          const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - h)
          gradient.addColorStop(0, '#6C63FF')
          gradient.addColorStop(1, '#4ECDC4')
          ctx.fillStyle = gradient
          ctx.fillRect(i * barW, canvas.height - h, Math.max(1, barW - 1), h)
        })
        animRef.current = requestAnimationFrame(draw)
      }
      draw()
    }).catch(() => {
      // Microphone access denied — waveform stays hidden
    })

    return () => {
      cancelAnimationFrame(animRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [isRecording])

  return (
    <canvas
      ref={canvasRef}
      width={300}
      height={40}
      className={`transition-opacity duration-300 ${isRecording ? 'opacity-100' : 'opacity-0 h-0'}`}
    />
  )
}
```

- [ ] **Step 3: Write `frontend/src/components/controls/ControlBar.tsx`**

```tsx
import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import RecordButton from './RecordButton'
import WaveformVisualizer from './WaveformVisualizer'
import { usePracticeStore } from '../../store/practiceStore'

export default function ControlBar() {
  const [text, setText] = useState('')
  const { sendMessage, isLoading, isRecording, setIsRecording, currentSession } = usePracticeStore()
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading || !currentSession) return
    setText('')
    await sendMessage(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) {
      alert('您的浏览器不支持语音识别，请使用 Chrome 浏览器')
      return
    }

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('')
      setText(transcript)
    }

    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
  }

  const disabled = !currentSession || isLoading

  return (
    <div className="bg-white border-t border-gray-100 p-4 shrink-0">
      {isRecording && (
        <div className="flex justify-center mb-2">
          <WaveformVisualizer isRecording={isRecording} />
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? '请先在左上角菜单选择练习场景…' : '输入英文或点击麦克风说话…'}
          className="flex-1 h-11 px-4 rounded-pill border border-gray-200 text-text placeholder:text-subtle text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-bg disabled:cursor-not-allowed transition-colors"
        />
        <RecordButton isRecording={isRecording} onToggle={toggleRecording} disabled={disabled} />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="w-11 h-11 rounded-btn bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
          aria-label="发送"
        >
          <Send size={18} />
        </motion.button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd frontend && npx tsc --noEmit
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: control bar — RecordButton with pulse animation, WaveformVisualizer, ControlBar"
```

---

## Task 10: Router, Pages + App Entry

**Files:**
- Create: `frontend/src/router.tsx`
- Overwrite: `frontend/src/App.tsx`
- Overwrite: `frontend/src/main.tsx`
- Create: `frontend/src/pages/PracticePage.tsx`
- Create: `frontend/src/pages/HistoryPage.tsx`
- Create: `frontend/src/pages/ProfilePage.tsx`

- [ ] **Step 1: Write `frontend/src/router.tsx`**

```tsx
import { createBrowserRouter } from 'react-router-dom'
import AppLayout from './components/layout/AppLayout'
import PracticePage from './pages/PracticePage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <PracticePage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'profile', element: <ProfilePage /> }
    ]
  }
])
```

- [ ] **Step 2: Overwrite `frontend/src/App.tsx`**

```tsx
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

export default function App() {
  return <RouterProvider router={router} />
}
```

- [ ] **Step 3: Overwrite `frontend/src/main.tsx`**

```tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 4: Write `frontend/src/pages/PracticePage.tsx`**

```tsx
import { useEffect } from 'react'
import ConversationFeed from '../components/conversation/ConversationFeed'
import ControlBar from '../components/controls/ControlBar'
import { usePracticeStore } from '../store/practiceStore'

export default function PracticePage() {
  const { messages, isLoading, loadScenes } = usePracticeStore()

  useEffect(() => {
    loadScenes()
  }, [loadScenes])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ConversationFeed messages={messages} isLoading={isLoading} />
      <ControlBar />
    </div>
  )
}
```

- [ ] **Step 5: Write `frontend/src/pages/HistoryPage.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useHistoryStore } from '../store/historyStore'
import type { Session } from '../types'

function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor =
    session.avgScore >= 80 ? 'text-success' :
    session.avgScore >= 60 ? 'text-yellow-500' : 'text-error'
  const date = new Date(session.startedAt).toLocaleDateString('zh-CN')
  const userMsgCount = session.messages.filter(m => m.role === 'user').length

  return (
    <div className="bg-white rounded-card shadow-sm overflow-hidden">
      <button
        className="w-full p-4 flex items-center gap-3 hover:bg-bg transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1">
          <div className="font-semibold text-text">{session.sceneName}</div>
          <div className="text-xs text-subtle mt-0.5">
            {date} · 对话 {userMsgCount} 轮
          </div>
        </div>
        <span className={`text-xl font-bold ${scoreColor}`}>
          {session.avgScore > 0 ? session.avgScore : '—'}
        </span>
        {expanded
          ? <ChevronUp size={16} className="text-subtle shrink-0" />
          : <ChevronDown size={16} className="text-subtle shrink-0" />
        }
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2 border-t border-gray-50 pt-3">
              {session.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`text-sm p-3 rounded-lg ${
                    msg.role === 'ai'
                      ? 'bg-primary/5 text-primary'
                      : 'bg-secondary/5 text-text'
                  }`}
                >
                  <span className="font-medium mr-2">
                    {msg.role === 'ai' ? 'AI:' : '你:'}
                  </span>
                  {msg.text}
                  {msg.feedback && (
                    <span className="ml-2 text-xs text-subtle">
                      ({msg.feedback.pronunciationScore} 分)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HistoryPage() {
  const { sessions, isLoading, loadSessions } = useHistoryStore()

  useEffect(() => { loadSessions() }, [loadSessions])

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-subtle">加载中…</div>
  }

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-subtle p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-semibold text-lg text-text">还没有练习记录</p>
          <p className="text-sm mt-2">完成一次对话后记录会显示在这里</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      <h2 className="text-lg font-bold text-text">练习历史</h2>
      {sessions.map(s => <SessionCard key={s.id} session={s} />)}
    </div>
  )
}
```

- [ ] **Step 6: Write `frontend/src/pages/ProfilePage.tsx`**

```tsx
import { useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'
import { useProfileStore } from '../store/profileStore'

const COLORS = ['#6C63FF', '#4ECDC4', '#FF6B6B', '#51CF66', '#FFD93D']

export default function ProfilePage() {
  const { stats, isLoading, loadStats } = useProfileStore()

  useEffect(() => { loadStats() }, [loadStats])

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-subtle">加载中…</div>
  }

  if (!stats || stats.totalSessions === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-subtle p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="font-semibold text-lg text-text">完成练习后查看进度</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      <h2 className="text-lg font-bold text-text">我的进度</h2>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '练习次数', value: stats.totalSessions },
          { label: '对话条数', value: stats.totalMessages },
          { label: '平均评分', value: stats.avgScore }
        ].map(item => (
          <div key={item.label} className="bg-white rounded-card p-4 shadow-sm text-center">
            <div className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {item.value}
            </div>
            <div className="text-xs text-subtle mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      {stats.scoreHistory.length > 1 && (
        <div className="bg-white rounded-card p-4 shadow-sm">
          <h3 className="font-semibold text-text mb-3 text-sm">评分趋势</h3>
          <ResponsiveContainer width="100%" height={160}>
            <LineChart data={stats.scoreHistory}>
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#6C63FF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {stats.sceneDistribution.length > 0 && (
        <div className="bg-white rounded-card p-4 shadow-sm">
          <h3 className="font-semibold text-text mb-3 text-sm">场景分布</h3>
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie
                  data={stats.sceneDistribution}
                  dataKey="count"
                  nameKey="sceneName"
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
                >
                  {stats.sceneDistribution.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-1.5">
              {stats.sceneDistribution.map((item, i) => (
                <div key={item.sceneName} className="flex items-center gap-2 text-sm">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-text">{item.sceneName}</span>
                  <span className="text-subtle">({item.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {stats.topErrors.length > 0 && (
        <div className="bg-white rounded-card p-4 shadow-sm">
          <h3 className="font-semibold text-text mb-3 text-sm">常见纠错 Top 5</h3>
          {stats.topErrors.map((err, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-1.5 border-b border-gray-50 last:border-0"
            >
              <span className="text-xs text-subtle w-4">{i + 1}.</span>
              <span className="text-sm text-success font-medium flex-1">{err.suggestion}</span>
              <span className="text-xs text-subtle">{err.type} · ×{err.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Delete Vite default files**

Delete these files that conflict with our setup:
- `frontend/src/App.css` (if exists)
- `frontend/src/assets/react.svg` (if exists)
- `frontend/public/vite.svg` (if exists)

Also clear the content of `frontend/index.html` `<title>` to "英语口语陪练":
```html
<title>英语口语陪练</title>
```

- [ ] **Step 8: Run full test suite**

```bash
cd frontend && npx vitest run
```

Expected: all tests PASS

- [ ] **Step 9: Commit**

```bash
git add .
git commit -m "feat: pages and router — PracticePage, HistoryPage, ProfilePage wired to stores"
```

---

## Task 11: End-to-End Smoke Test + Final Commit

**Files:**
- Create: `README.md`

- [ ] **Step 1: Start backend**

In one terminal:
```bash
cd backend && npm run dev
```

Expected: "Backend running on http://localhost:3001"

- [ ] **Step 2: Start frontend**

In another terminal:
```bash
cd frontend && npm run dev
```

Expected: Vite server on http://localhost:5173

- [ ] **Step 3: Smoke test the full flow**

Open http://localhost:5173 in Chrome. Verify:

1. Page loads with empty state message "选择场景开始练习"
2. Click hamburger → SceneDrawer slides in from left with 5 scenes
3. Click "餐厅点餐" → drawer closes, TopBar shows scene name
4. Type "Hello, I would like a coffee please." in input → press Enter
5. Loading skeleton appears, then:
   - User card appears with left border in teal (`#4ECDC4`)
   - FeedbackBlock shows pronunciation score and corrections (or ✓ if perfect)
   - AI card appears with left border in purple (`#6C63FF`)
6. Navigate to `/history` → session appears
7. Click session card → messages expand
8. Navigate to `/profile` → stats show (after 1+ sessions with scores)

- [ ] **Step 4: Write `README.md`**

```markdown
# AI 英语口语陪练助手

> 第三批议题 · 题目一

## 项目概述

基于网页的英语口语练习工具，帮助用户在指定场景下进行真实对话训练。Claude AI 驱动对话回复和语法/表达纠错。

## 核心功能

- **场景选择**：5 个练习场景（面试 / 点餐 / 会议 / 旅行 / 购物），侧边抽屉选择
- **卡片式对话**：每轮对话独立卡片，AI（紫色边框）/ 用户（青绿边框）视觉区分
- **内联反馈**：每条用户消息下方展示发音评分（0-100）、语法纠错和建议
- **语音输入**：支持浏览器 Web Speech API（Chrome），含实时波形动画
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
| 后端 | Node.js + Express + TypeScript |
| AI | @anthropic-ai/sdk (claude-haiku-4-5) |
| 存储 | JSON 文件（backend/data/db.json） |
| 测试 | Vitest + React Testing Library（前端）· Jest + Supertest（后端） |

## 语音说明

语音识别使用浏览器原生 **Web Speech API**，仅支持 Chrome/Edge。发音评分为 **Claude Haiku 基于文本的语法与表达质量估算**，非专业声学模型。

## 原创实现

- 中文日期/时间无关的场景提示词设计
- 基于 LLM 的实时语法纠错与评分 JSON 解析
- Framer Motion 卡片从下向上淡入动画
- Web Audio API 实时波形可视化
- JSON 文件持久化存储服务

## 安装与运行

```bash
# 1. 安装依赖
cd backend && npm install
cd ../frontend && npm install

# 2. 配置 API Key
cp backend/.env.example backend/.env
# 编辑 backend/.env，填入 ANTHROPIC_API_KEY

# 3. 启动后端（端口 3001）
cd backend && npm run dev

# 4. 启动前端（新终端，端口 5173）
cd frontend && npm run dev

# 5. 打开浏览器
# http://localhost:5173
```

## 运行测试

```bash
cd backend && npm test
cd frontend && npx vitest run
```

## 演示用法

1. 点击左上角菜单，选择"餐厅点餐"
2. 输入 "Hi, I want order a coffee and a sandwich."
3. 查看 AI 回复和纠错反馈（建议："I'd like to order"）
4. 切换到「历史」页查看对话记录
5. 切换到「我的」页查看评分趋势

## 已知限制

- 语音识别仅支持 Chrome/Edge（Web Speech API）
- 发音评分为 LLM 文本质量估算，非声学发音评测
- 桌面端优先，最小宽度 768px
- 数据存储为本地 JSON 文件，无多用户支持

## Demo 视频

[待上传]
```

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "docs: README with setup instructions, tech stack, and known limitations"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|---|---|
| 场景选择（≥5 个场景） | Task 3 (scenes data) + Task 7 (SceneDrawer) |
| 文字输入发送消息，AI 回复 | Task 4 (sessions route) + Task 9 (ControlBar) |
| 卡片式对话展示，内联反馈 | Task 8 (conversation components) |
| 发音评分 + 语法/表达纠错 | Task 3 (aiService.getFeedback) |
| 底部完整控制栏（含波形动画） | Task 9 (ControlBar, WaveformVisualizer) |
| 历史记录页 | Task 10 (HistoryPage) |
| 进度看板页（折线图 + 饼图） | Task 10 (ProfilePage) |
| 数据持久化（后端存储） | Task 2 (storageService) |
| Duolingo 活泼视觉风格 | Task 1 (Tailwind config) + all components |
| 顶栏 + 汉堡菜单 | Task 7 (TopBar) |
| 从下向上淡入动画 | Task 8 (MessageCard) |
| 录音按钮脉冲动画 | Task 9 (RecordButton) |

All requirements covered. No gaps found.
