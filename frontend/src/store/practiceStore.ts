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
    const { currentScene } = get()
    if (!currentScene && scenes.length > 0) {
      set({ currentScene: scenes[0] })
    }
  },

  setScene: async (scene) => {
    set({ isLoading: true, currentScene: scene, currentSession: null, messages: [] })
    try {
      const session = await api.createSession(scene.id)
      set({ currentSession: session, isLoading: false })
    } catch {
      set({ isLoading: false })
    }
  },

  sendMessage: async (text) => {
    const { currentSession, currentScene } = get()
    if (!currentScene) return
    set({ isLoading: true })
    try {
      let session = currentSession
      if (!session) {
        session = await api.createSession(currentScene.id)
        set({ currentSession: session })
      }
      const { userMessage, aiMessage } = await api.sendMessage(session.id, text)
      set(state => ({
        messages: [...state.messages, userMessage, aiMessage],
        isLoading: false
      }))
    } catch {
      set({ isLoading: false })
    }
  },

  setIsRecording: (v) => set({ isRecording: v })
}))
