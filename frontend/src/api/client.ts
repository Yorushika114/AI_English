import type { Scene, Session, Message } from '../types'

export type ProfileStats = {
  totalSessions: number
  totalMessages: number
  avgScore: number
  scoreHistory: Array<{ date: string; score: number }>
  sceneDistribution: Array<{ sceneName: string; count: number }>
  topErrors: Array<{ type: string; count: number }>
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

async function requestVoid(path: string, options?: RequestInit): Promise<void> {
  const res = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? `API error ${res.status}`)
  }
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

  getProfileStats: () => request<ProfileStats>('/profile/stats'),

  deleteSession: (id: string) =>
    requestVoid(`/sessions/${id}`, { method: 'DELETE' }),

  deleteSessions: (ids: string[]) =>
    requestVoid('/sessions', {
      method: 'DELETE',
      body: JSON.stringify({ ids })
    }),

  phonemeAnalysis: (sessionId: string, messageId: string) =>
    request<import('../types').PhonemeAnalysisResult>(
      `/sessions/${sessionId}/messages/${messageId}/phoneme-analysis`,
      { method: 'POST' }
    ),

  synthesize: (text: string) =>
    request<{ audio: string }>('/tts', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),
}
