import { Router, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { SCENES } from '../data/scenes'
import { storageService } from '../services/storageService'
import { getAIReply, getFeedback, getPhonemeAnalysis } from '../services/aiService'
import { Session, Message } from '../types'

const stripPhonemics = (session: Session): Session => ({
  ...session,
  messages: session.messages.map(({ phonemicsData: _pd, ...m }) => m as Message),
})

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  const sessions = storageService.getSessions()
  res.json(sessions.map(stripPhonemics))
})

router.post('/', (req: Request, res: Response) => {
  const { sceneId } = req.body
  const scene = SCENES.find(s => s.id === sceneId)
  if (!scene) {
    res.status(400).json({ error: `Unknown sceneId: ${sceneId}` })
    return
  }

  const session: Session = {
    id: uuidv4(),
    sceneId: scene.id,
    sceneName: scene.name,
    messages: [],
    avgScore: 0,
    startedAt: new Date().toISOString()
  }
  storageService.createSession(session)
  res.json(session)
})

router.get('/:id', (req: Request, res: Response) => {
  const session = storageService.getSession(req.params.id as string)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  res.json(stripPhonemics(session))
})

router.post('/:id/end', (req: Request, res: Response) => {
  const session = storageService.getSession(req.params.id as string)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  const updated = storageService.updateSession(req.params.id as string, {
    endedAt: new Date().toISOString()
  })
  res.json(updated)
})

router.post('/:id/message', async (req: Request, res: Response) => {
  const { text } = req.body
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'text is required' })
    return
  }

  const session = storageService.getSession(req.params.id as string)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }

  const scene = SCENES.find(s => s.id === session.sceneId)!

  const userMsg: Message = {
    id: uuidv4(),
    role: 'user',
    text: text.trim(),
    createdAt: new Date().toISOString()
  }

  const historyWithUser = [...session.messages, userMsg]

  const [aiText, feedback] = await Promise.all([
    getAIReply(scene, historyWithUser),
    getFeedback(text.trim(), session.sceneName)
  ])

  userMsg.feedback = feedback

  const aiMsg: Message = {
    id: uuidv4(),
    role: 'ai',
    text: aiText,
    createdAt: new Date().toISOString()
  }

  const updatedMessages = [...historyWithUser, aiMsg]
  const scores = updatedMessages
    .filter(m => m.role === 'user' && m.feedback)
    .map(m => m.feedback!.pronunciationScore)
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0

  storageService.updateSession(req.params.id as string, { messages: updatedMessages, avgScore })

  res.json({ userMessage: userMsg, aiMessage: aiMsg })
})

router.post('/:id/messages/:msgId/phoneme-analysis', async (req: Request, res: Response) => {
  const session = storageService.getSession(req.params.id as string)
  if (!session) {
    res.status(404).json({ error: 'Session not found' })
    return
  }

  const message = session.messages.find((m) => m.id === req.params.msgId)
  if (!message) {
    res.status(404).json({ error: 'Message not found' })
    return
  }

  if (!message.phonemicsData || message.phonemicsData.isePhonemes.length === 0) {
    res.status(422).json({ error: 'No phonemics data for this message' })
    return
  }

  try {
    const analysis = await getPhonemeAnalysis(message.text, message.phonemicsData)
    res.json(analysis)
  } catch {
    res.status(500).json({ error: 'Phoneme analysis failed' })
  }
})

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = storageService.deleteSession(req.params.id as string)
  if (!deleted) {
    res.status(404).json({ error: 'Session not found' })
    return
  }
  res.status(204).send()
})

router.delete('/', (req: Request, res: Response) => {
  const { ids } = req.body as { ids?: string[] }
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'ids array is required' })
    return
  }
  storageService.deleteSessions(ids)
  res.status(204).send()
})

export default router
