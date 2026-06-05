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
