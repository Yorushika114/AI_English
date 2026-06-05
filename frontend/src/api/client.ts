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
