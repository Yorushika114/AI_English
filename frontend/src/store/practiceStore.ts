import { create } from 'zustand'
import type { Scene, Message, Session, Feedback } from '../types'
import { api } from '../api/client'

type PracticeState = {
  scenes: Scene[]
  currentScene: Scene | null
  currentSession: Session | null
  messages: Message[]
  isLoading: boolean
  isRecording: boolean
  partialTranscript: string   // live STT text shown while user speaks
  streamingAiText: string     // accumulates AI reply chunks

  loadScenes: () => Promise<void>
  setScene: (scene: Scene) => Promise<void>
  sendMessage: (text: string) => Promise<void>
  setIsRecording: (v: boolean) => void

  // WebSocket voice flow handlers
  handlePartial: (text: string) => void
  handleTranscript: (text: string) => void
  handleAiChunk: (chunk: string) => void
  handleAiDone: () => void
  handleFeedback: (feedback: Feedback, hasPhonemicsData?: boolean, backendMessageId?: string) => void
  handleTtsAudio: (base64: string) => void
  handleError: () => void
}

export const usePracticeStore = create<PracticeState>((set, get) => ({
  scenes: [],
  currentScene: null,
  currentSession: null,
  messages: [],
  isLoading: false,
  isRecording: false,
  partialTranscript: '',
  streamingAiText: '',

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

  // Text-input path (unchanged)
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

  setIsRecording: (v) => set({ isRecording: v }),

  handlePartial: (text) => set({ partialTranscript: text }),

  handleTranscript: (text) => {
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      text,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({
      messages: [...s.messages, userMsg],
      partialTranscript: '',
      streamingAiText: '',
      isLoading: true,
    }))
  },

  // AI reply arrives chunk by chunk
  handleAiChunk: (chunk) => set((s) => ({ streamingAiText: s.streamingAiText + chunk })),

  // AI reply complete → commit as message
  handleAiDone: () => {
    const { streamingAiText } = get()
    const aiMsg: Message = {
      id: crypto.randomUUID(),
      role: 'ai',
      text: streamingAiText,
      createdAt: new Date().toISOString(),
    }
    set((s) => ({ messages: [...s.messages, aiMsg], streamingAiText: '', isLoading: false }))
  },

  handleTtsAudio: (base64) => {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }))
    const audio = new Audio(url)
    audio.play().catch(() => {})
    audio.onended = () => URL.revokeObjectURL(url)
  },

  handleError: () => set({ isLoading: false, streamingAiText: '' }),

  // Grammar feedback arrives after AI reply — patch the last user message
  handleFeedback: (feedback, hasPhonemicsData, backendMessageId) => {
    set((s) => {
      const msgs = [...s.messages]
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'user' && !msgs[i].feedback) {
          msgs[i] = {
            ...msgs[i],
            id: backendMessageId ?? msgs[i].id,
            feedback,
            hasPhonemicsData,
          }
          break
        }
      }
      return { messages: msgs }
    })
  },
}))
