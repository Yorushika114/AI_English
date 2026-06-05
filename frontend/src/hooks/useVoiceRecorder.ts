import { useRef, useCallback } from 'react'
import type { Feedback } from '../types'

export type WsMessage =
  | { type: 'partial'; text: string }
  | { type: 'transcript'; text: string }
  | { type: 'ai_chunk'; text: string }
  | { type: 'ai_done' }
  | { type: 'feedback'; feedback: Feedback; hasPhonemicsData?: boolean; messageId?: string }
  | { type: 'tts_audio'; data: string }
  | { type: 'error'; message: string }

type Options = {
  sessionId: string
  onMessage: (msg: WsMessage) => void
}

export function useVoiceRecorder({ sessionId, onMessage }: Options) {
  const wsRef = useRef<WebSocket | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const start = useCallback(async () => {
    // 1. Connect WebSocket
    const wsUrl = `ws://${location.host}/ws/audio`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    // Use a ref-based handler so it always calls the latest onMessage
    ws.onmessage = (e) => onMessage(JSON.parse(e.data) as WsMessage)

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve()
      ws.onerror = () => reject(new Error('无法连接语音服务，请检查后端是否运行'))
      ws.onclose = (ev) => {
        if (ev.code !== 1000) reject(new Error(`WebSocket 已断开 (${ev.code})`))
      }
    })

    ws.send(JSON.stringify({ type: 'start', sessionId }))

    // 2. Request microphone
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {
      ws.close()
      throw new Error('麦克风权限被拒绝或设备不可用')
    }
    streamRef.current = stream

    // 3. Create 16kHz AudioContext (matches iFlytek STT requirement)
    const ctx = new AudioContext({ sampleRate: 16000 })
    ctxRef.current = ctx

    // 4. Load AudioWorklet processor
    try {
      await ctx.audioWorklet.addModule('/audio-processor.js')
    } catch {
      stream.getTracks().forEach(t => t.stop())
      ws.close()
      throw new Error('AudioWorklet 加载失败，请使用 Chrome 浏览器')
    }

    // 5. Wire up audio graph: mic → worklet → send PCM chunks via WS
    const source = ctx.createMediaStreamSource(stream)
    const worklet = new AudioWorkletNode(ctx, 'audio-processor')
    workletRef.current = worklet

    worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(e.data)
    }

    source.connect(worklet)
    worklet.connect(ctx.destination)
  }, [sessionId, onMessage])

  const stop = useCallback(() => {
    wsRef.current?.send(JSON.stringify({ type: 'stop' }))
    workletRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    ctxRef.current?.close()
    wsRef.current = null
    workletRef.current = null
    streamRef.current = null
    ctxRef.current = null
  }, [])

  return { start, stop }
}
