import WebSocket from 'ws'
import crypto from 'crypto'

function buildTtsAuthUrl(): string {
  const host = 'tts-api.xfyun.cn'
  const date = new Date().toUTCString()
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/tts HTTP/1.1`
  const signature = crypto
    .createHmac('sha256', process.env.XFYUN_API_SECRET!)
    .update(signatureOrigin)
    .digest('base64')
  const authOrigin = `api_key="${process.env.XFYUN_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = Buffer.from(authOrigin).toString('base64')
  return (
    `wss://tts-api.xfyun.cn/v2/tts` +
    `?authorization=${encodeURIComponent(authorization)}` +
    `&date=${encodeURIComponent(date)}` +
    `&host=${encodeURIComponent(host)}`
  )
}

export function synthesize(text: string): Promise<Buffer> {
  return new Promise((resolve) => {
    let settled = false
    const done = (buf: Buffer) => {
      if (settled) return
      settled = true
      resolve(buf)
    }

    let ws: WebSocket
    try {
      ws = new WebSocket(buildTtsAuthUrl())
    } catch {
      return done(Buffer.alloc(0))
    }

    const chunks: Buffer[] = []
    const timeout = setTimeout(() => { ws.terminate(); done(Buffer.alloc(0)) }, 15000)

    ws.on('open', () => {
      ws.send(JSON.stringify({
        common: { app_id: process.env.XFYUN_APP_ID },
        business: {
          aue: 'lame',
          auf: 'audio/L16;rate=16000',
          vcn: 'x4_yezi',
          tte: 'utf8',
          speed: 50,
          volume: 80,
          pitch: 50,
        },
        data: {
          status: 2,
          text: Buffer.from(text).toString('base64'),
        },
      }))
    })

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.code !== 0) {
          console.error('[TTS] api error:', msg.code, msg.message)
          clearTimeout(timeout); ws.close(); done(Buffer.alloc(0)); return
        }
        if (msg.data?.audio) {
          chunks.push(Buffer.from(msg.data.audio, 'base64'))
        }
        if (msg.data?.status === 2) {
          clearTimeout(timeout)
          ws.close(1000)
          done(Buffer.concat(chunks))
        }
      } catch (e) {
        console.error('[TTS] parse error:', e)
        clearTimeout(timeout); ws.close(); done(Buffer.alloc(0))
      }
    })

    ws.on('error', (e) => { console.error('[TTS] ws error:', e.message); clearTimeout(timeout); done(Buffer.alloc(0)) })
    ws.on('close', (code) => { console.log('[TTS] ws closed:', code); clearTimeout(timeout); done(Buffer.concat(chunks)) })
  })
}
