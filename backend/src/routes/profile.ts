import { Router } from 'express'
import { storageService } from '../services/storageService'
import { Correction } from '../types'

const router = Router()

router.get('/stats', (_req, res) => {
  const sessions = storageService.getSessions()

  const totalSessions = sessions.length
  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0)

  const scoredSessions = sessions.filter(s => s.avgScore > 0)
  const avgScore = scoredSessions.length
    ? Math.round(scoredSessions.reduce((sum, s) => sum + s.avgScore, 0) / scoredSessions.length)
    : 0

  const scoreHistory = sessions
    .filter(s => s.avgScore > 0)
    .map(s => ({ date: s.startedAt.slice(0, 10), score: s.avgScore }))

  const sceneMap: Record<string, number> = {}
  sessions.forEach(s => {
    sceneMap[s.sceneName] = (sceneMap[s.sceneName] || 0) + 1
  })
  const sceneDistribution = Object.entries(sceneMap)
    .map(([sceneName, count]) => ({ sceneName, count }))

  const errorCount: Record<string, number> = {}
  sessions.forEach(s => {
    s.messages.forEach(m => {
      if (m.feedback?.corrections) {
        m.feedback.corrections.forEach((c: Correction) => {
          errorCount[c.type] = (errorCount[c.type] || 0) + 1
        })
      }
    })
  })
  const topErrors = Object.entries(errorCount)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  res.json({ totalSessions, totalMessages, avgScore, scoreHistory, sceneDistribution, topErrors })
})

export default router
