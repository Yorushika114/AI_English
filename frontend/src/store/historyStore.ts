import { create } from 'zustand'
import type { Session } from '../types'
import { api } from '../api/client'

type HistoryState = {
  sessions: Session[]
  isLoading: boolean
  loadSessions: () => Promise<void>
  deleteSession: (id: string) => Promise<void>
  deleteSessions: (ids: string[]) => Promise<void>
}

export const useHistoryStore = create<HistoryState>((set) => ({
  sessions: [],
  isLoading: false,
  loadSessions: async () => {
    set({ isLoading: true })
    const sessions = await api.getSessions()
    set({
      sessions: sessions
        .filter(s => s.messages.length > 0)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt)),
      isLoading: false
    })
  },
  deleteSession: async (id: string) => {
    set(state => ({ sessions: state.sessions.filter(s => s.id !== id) }))
    await api.deleteSession(id)
  },
  deleteSessions: async (ids: string[]) => {
    const idSet = new Set(ids)
    set(state => ({ sessions: state.sessions.filter(s => !idSet.has(s.id)) }))
    await api.deleteSessions(ids)
  }
}))
