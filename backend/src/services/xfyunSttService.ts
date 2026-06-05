import WebSocket from 'ws'
import crypto from 'crypto'

function buildAuthUrl(): string {
  const host = 'iat-api.xfyun.cn'
  const date = new Date().toUTCString()

  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/iat HTTP/1.1`
  const signature = crypto
    .createHmac('sha256', process.env.XFYUN_API_SECRET!)
    .update(signatureOrigin)
    .digest('base64')

  const authOrigin = `api_key="${process.env.XFYUN_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = Buffer.from(authOrigin).toString('base64')

  return (
    `wss://iat-api.xfyun.cn/v2/iat` +
    `?authorization=${encodeURIComponent(authorization)}` +
    `&date=${encodeURIComponent(date)}` +
    `&host=${encodeURIComponent(host)}`
  )
}

type SttCallbacks = {
  onPartial: (text: string) => void
  onDone: (fullText: string) => void
  onError: (err: Error) => void
}

// Streaming session: open once, push chunks as they arrive from the microphone
export class XfyunSttSession {
  private ws: WebSocket | null = null
  private isFirstChunk = true
  private connected = false
  private pendingChunks: Buffer[] = []
  private transcript = ''

  constructor(private readonly cb: SttCallbacks) {}

  start(): void {
    this.ws = new WebSocket(buildAuthUrl())

    this.ws.on('open', () => {
      this.connected = true
      // Flush any chunks that arrived before connection opened
      for (const chunk of this.pendingChunks) this._send(chunk)
      this.pendingChunks = []
    })

    this.ws.on('message', (raw: Buffer) => {
      const msg = JSON.parse(raw.toString())

      if (msg.code !== 0) {
        this.ws?.close()
        this.cb.onError(new Error(`xfyun STT error ${msg.code}: ${msg.message}`))
        return
      }

      if (msg.data?.result?.ws) {
        const words: string = msg.data.result.ws
          .flatMap((w: { cw: { w: string }[] }) => w.cw)
          .map((cw: { w: string }) => cw.w)
          .join('')
        this.transcript += words
        this.cb.onPartial(this.transcript)
      }

      if (msg.data?.status === 2) {
        this.ws?.close(1000)
        this.cb.onDone(this.transcript.trim())
      }
    })

    this.ws.on('error', (err) => this.cb.onError(err))
    this.ws.on('close', () => { this.connected = false })
  }

  sendChunk(pcm: Buffer): void {
    if (!this.connected) {
      this.pendingChunks.push(pcm)
      return
    }
    this._send(pcm)
  }

  end(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    this.ws.send(JSON.stringify({
      data: { status: 2, format: 'audio/L16;rate=16000', encoding: 'raw', audio: '' },
    }))
  }

  private _send(pcm: Buffer): void {
    if (this.ws?.readyState !== WebSocket.OPEN) return
    const payload = this.isFirstChunk
      ? {
          common: { app_id: process.env.XFYUN_APP_ID },
          business: { language: 'en_us', domain: 'iat', accent: 'mandarin', ptt: 0, eos: 3000 },
          data: { status: 0, format: 'audio/L16;rate=16000', encoding: 'raw', audio: pcm.toString('base64') },
        }
      : {
          data: { status: 1, format: 'audio/L16;rate=16000', encoding: 'raw', audio: pcm.toString('base64') },
        }
    this.isFirstChunk = false
    this.ws.send(JSON.stringify(payload))
  }
}
