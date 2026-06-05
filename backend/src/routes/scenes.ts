import { Router } from 'express'
import { SCENES } from '../data/scenes'

const router = Router()

router.get('/', (_req, res) => {
  res.json(SCENES)
})

export default router
