import { useState, useCallback } from 'react'
import { api } from '../api/client'

export function useTtsPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)

  const play = useCallback(async (text: string) => {
    if (isPlaying) return
    setIsPlaying(true)
    try {
      const { audio } = await api.synthesize(text)
      const binary = atob(audio)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }))
      const el = new Audio(url)
      el.play().catch(() => {})
      el.onended = () => {
        URL.revokeObjectURL(url)
        setIsPlaying(false)
      }
      el.onerror = () => setIsPlaying(false)
    } catch {
      setIsPlaying(false)
    }
  }, [isPlaying])

  return { play, isPlaying }
}
