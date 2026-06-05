import WebSocket from 'ws'
import crypto from 'crypto'

function buildIseAuthUrl(): string {
  const host = 'ise-api.xfyun.cn'
  const date = new Date().toUTCString()
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET /v2/open-ise HTTP/1.1`
  const signature = crypto
    .createHmac('sha256', process.env.XFYUN_API_SECRET!)
    .update(signatureOrigin)
    .digest('base64')
  const authOrigin = `api_key="${process.env.XFYUN_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`
  const authorization = Buffer.from(authOrigin).toString('base64')
  return (
    `wss://ise-api.xfyun.cn/v2/open-ise` +
    `?authorization=${encodeURIComponent(authorization)}` +
    `&date=${encodeURIComponent(date)}` +
    `&host=${encodeURIComponent(host)}`
  )
}

const FRAME_SIZE = 1280  // 40ms @ 16kHz 16-bit mono
const MIN_AUDIO_BYTES = 16000  // skip ISE if < 0.5s of audio

export function evaluatePronunciation(audioBuffer: Buffer, referenceText: string): Promise<number> {
  if (!referenceText.trim() || audioBuffer.length < MIN_AUDIO_BYTES) return Promise.resolve(0)

  return new Promise((resolve) => {
    let settled = false
    const done = (score: number) => {
      if (settled) return
      settled = true
      resolve(score)
    }

    let ws: WebSocket
    try {
      ws = new WebSocket(buildIseAuthUrl())
    } catch {
      return done(0)
    }

    const timeout = setTimeout(() => { ws.terminate(); done(0) }, 15000)

    ws.on('open', () => {
      // Frame 1: config (cmd=ssb), data.data must be empty string
      ws.send(JSON.stringify({
        common: { app_id: process.env.XFYUN_APP_ID },
        business: {
          sub: 'ise',
          ent: 'en_vip',
          category: 'read_sentence',
          cmd: 'ssb',
          auf: 'audio/L16;rate=16000',
          aue: 'raw',
          tte: 'utf-8',
          text: '﻿' + referenceText,
        },
        data: { status: 0, data: '' },
      }))

      // Audio frames: cmd=auw in business, audio in data.data, aus=1/2/4
      let offset = 0
      let isFirstAudio = true
      while (offset < audioBuffer.length) {
        const end = Math.min(offset + FRAME_SIZE, audioBuffer.length)
        const chunk = audioBuffer.subarray(offset, end)
        const isLast = end >= audioBuffer.length
        ws.send(JSON.stringify({
          business: { cmd: 'auw', aus: isFirstAudio ? 1 : isLast ? 4 : 2 },
          data: { status: isLast ? 2 : 1, data: chunk.toString('base64') },
        }))
        isFirstAudio = false
        offset = end
      }
    })

    ws.on('message', (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString())
        if (msg.code !== 0) { clearTimeout(timeout); ws.close(); done(0); return }
        if (msg.data?.status === 2) {
          clearTimeout(timeout)
          ws.close(1000)
          const xmlStr = Buffer.from(msg.data.data ?? '', 'base64').toString('utf8')
          const accMatch = xmlStr.match(/accuracy_score="([\d.]+)"/)
          const fluMatch = xmlStr.match(/fluency_score="([\d.]+)"/)
          const accuracy = accMatch ? parseFloat(accMatch[1]) : 0
          const fluency = fluMatch ? parseFloat(fluMatch[1]) : 0
          const score = Math.round(((accuracy + fluency) / 2) * 20)
          done(Math.min(100, Math.max(0, score)))
        }
      } catch {
        clearTimeout(timeout); ws.close(); done(0)
      }
    })

    ws.on('error', () => { clearTimeout(timeout); done(0) })
    ws.on('close', () => { clearTimeout(timeout); done(0) })
  })
}
