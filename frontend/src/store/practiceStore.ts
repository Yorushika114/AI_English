import { create } from 'zustand'
import type { Scene, Message, Session } from '../types'
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
