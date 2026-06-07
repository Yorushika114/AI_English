import { Router, Request, Response } from 'express'
import { synthesize } from '../services/xfyunTtsService'

const router = Router()

router.post('/', async (req: Request, res: Response) => {
  const { text } = req.body as { text?: string }
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    res.status(400).json({ error: 'text is required' })
    return
  }
  try {
    const buf = await synthesize(text.trim())
    if (buf.length === 0) {
      res.status(502).json({ error: 'TTS returned empty audio' })
      return
    }
    res.json({ audio: buf.toString('base64') })
  } catch {
    res.status(500).json({ error: 'TTS synthesis failed' })
  }
})

export default router
