import { create } from 'zustand'
import type { ProfileStats } from '../api/client'
import { api } from '../api/client'

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
