import { WebSocketServer, WebSocket, RawData } from 'ws'
import http from 'http'
import { v4 as uuidv4 } from 'uuid'
import { XfyunSttSession } from '../services/xfyunSttService'
import { SCENES } from '../data/scenes'
import { storageService } from '../services/storageService'
import { getAIReplyStream, getFeedback } from '../services/aiService'
import { evaluatePronunciation } from '../services/xfyunIseService'
import { synthesize } from '../services/xfyunTtsService'
import { Message } from '../types'

// WebSocket message protocol
// Client → Server: { type: 'start', sessionId: string } | { type: 'stop' } | <binary PCM>
// Server → Client: { type: 'partial'|'transcript'|'ai_chunk'|'ai_done'|'feedback'|'tts_audio'|'error', ...}

export function attachAudioGateway(server: http.Server): void {
  const wss = new WebSocketServer({ server, path: '/ws/audio' })

  wss.on('connection', (client: WebSocket) => {
    let stt: XfyunSttSession | null = null
    let sessionId: string | null = null
    const pcmChunks: Buffer[] = []

    const send = (data: object) => {
      if (client.readyState === WebSocket.OPEN) client.send(JSON.stringify(data))
    }

    client.on('message', (raw: RawData, isBinary: boolean) => {
      if (isBinary) {
        const chunk = raw as Buffer
        stt?.sendChunk(chunk)
        pcmChunks.push(chunk)
        return
      }

      const msg = JSON.parse((raw as Buffer).toString())

      if (msg.type === 'start') {
        sessionId = msg.sessionId as string
        pcmChunks.length = 0
        stt = new XfyunSttSession({
          onPartial: (text) => send({ type: 'partial', text }),
          onDone: (text) => {
            send({ type: 'transcript', text })
            handleTranscript(text).catch((err) =>
              send({ type: 'error', message: String(err.message) })
            )
          },
          onError: (err) => send({ type: 'error', message: err.message }),
        })
        stt.start()
      }

      if (msg.type === 'stop') {
        stt?.end()
      }
    })

    async function handleTranscript(text: string): Promise<void> {
      if (!sessionId) return
      const session = storageService.getSession(sessionId)
      if (!session) return
      const scene = SCENES.find((s) => s.id === session.sceneId)!

      const audioBuffer = Buffer.concat(pcmChunks)

      const userMsg: Message = {
        id: uuidv4(),
        role: 'user',
        text,
        createdAt: new Date().toISOString(),
      }
      const historyWithUser = [...session.messages, userMsg]

      // Stream AI reply immediately — don't wait for feedback
      let aiText = ''
      const aiDone = getAIReplyStream(scene, historyWithUser, (chunk) => {
        send({ type: 'ai_chunk', text: chunk })
      }).then((full) => {
        aiText = full
        send({ type: 'ai_done' })
        // TTS runs after ai_done, doesn't block feedback or storage
        synthesize(full)
          .then((audioBuf) => {
            if (audioBuf.length > 0) send({ type: 'tts_audio', data: audioBuf.toString('base64') })
          })
          .catch(() => {})
      })

      // Grammar corrections + ISE pronunciation score run in parallel
      const feedbackDone = Promise.all([
        getFeedback(text, session.sceneName),
        evaluatePronunciation(audioBuffer, text),
      ])
        .then(([feedback, { score }]) => {
          feedback.pronunciationScore = score
          userMsg.feedback = feedback
          send({ type: 'feedback', feedback })
        })
        .catch(() => {})

      await Promise.all([aiDone, feedbackDone])

      const aiMsg: Message = {
        id: uuidv4(),
        role: 'ai',
        text: aiText,
        createdAt: new Date().toISOString(),
      }

      const updatedMessages = [...historyWithUser, aiMsg]
      const scores = updatedMessages
        .filter((m) => m.role === 'user' && m.feedback)
        .map((m) => m.feedback!.pronunciationScore)
      const avgScore = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0

      storageService.updateSession(sessionId!, { messages: updatedMessages, avgScore })
    }

    client.on('close', () => { stt = null })
  })
}
