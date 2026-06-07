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

function buildWavUrl(chunks: ArrayBuffer[]): string | null {
  if (chunks.length === 0) return null
  const totalBytes = chunks.reduce((s, c) => s + c.byteLength, 0)
  const sampleRate = 16000
  const buffer = new ArrayBuffer(44 + totalBytes)
  const view = new DataView(buffer)
  const write = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i))
  }
  write(0, 'RIFF')
  view.setUint32(4, 36 + totalBytes, true)
  write(8, 'WAVE')
  write(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)   // PCM
  view.setUint16(22, 1, true)   // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true)  // byte rate
  view.setUint16(32, 2, true)   // block align
  view.setUint16(34, 16, true)  // bits per sample
  write(36, 'data')
  view.setUint32(40, totalBytes, true)
  let offset = 44
  for (const chunk of chunks) {
    new Uint8Array(buffer, offset, chunk.byteLength).set(new Uint8Array(chunk))
    offset += chunk.byteLength
  }
  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }))
}

export function useVoiceRecorder({ sessionId, onMessage }: Options) {
  const wsRef = useRef<WebSocket | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)
  const workletRef = useRef<AudioWorkletNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const pcmChunksRef = useRef<ArrayBuffer[]>([])

  const start = useCallback(async () => {
    pcmChunksRef.current = []

    const wsUrl = `ws://${location.host}/ws/audio`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (e) => onMessage(JSON.parse(e.data) as WsMessage)

    await new Promise<void>((resolve, reject) => {
      ws.onopen = () => resolve()
      ws.onerror = () => reject(new Error('无法连接语音服务，请检查后端是否运行'))
      ws.onclose = (ev) => {
        if (ev.code !== 1000) reject(new Error(`WebSocket 已断开 (${ev.code})`))
      }
    })

    ws.send(JSON.stringify({ type: 'start', sessionId }))

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
    } catch {
      ws.close()
      throw new Error('麦克风权限被拒绝或设备不可用')
    }
    streamRef.current = stream

    const ctx = new AudioContext({ sampleRate: 16000 })
    ctxRef.current = ctx

    try {
      await ctx.audioWorklet.addModule('/audio-processor.js')
    } catch {
      stream.getTracks().forEach(t => t.stop())
      ws.close()
      throw new Error('AudioWorklet 加载失败，请使用 Chrome 浏览器')
    }

    const source = ctx.createMediaStreamSource(stream)
    const worklet = new AudioWorkletNode(ctx, 'audio-processor')
    workletRef.current = worklet

    worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(e.data)
      pcmChunksRef.current.push(e.data.slice(0))
    }

    source.connect(worklet)
    worklet.connect(ctx.destination)
  }, [sessionId, onMessage])

  // Returns a WAV blob URL of the recorded audio, or null if nothing was recorded
  const stop = useCallback((): string | null => {
    wsRef.current?.send(JSON.stringify({ type: 'stop' }))
    workletRef.current?.disconnect()
    streamRef.current?.getTracks().forEach((t) => t.stop())
    ctxRef.current?.close()

    const url = buildWavUrl(pcmChunksRef.current)
    pcmChunksRef.current = []

    wsRef.current = null
    workletRef.current = null
    streamRef.current = null
    ctxRef.current = null

    return url
  }, [])

  return { start, stop }
}
