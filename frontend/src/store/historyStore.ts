import { create } from 'zustand'
import type { Session } from '../types'
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
