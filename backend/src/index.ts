import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import scenesRouter from './routes/scenes'
import sessionsRouter from './routes/sessions'
import profileRouter from './routes/profile'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/scenes', scenesRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/profile', profileRouter)

if (require.main === module) {
  const PORT = process.env.PORT || 3001
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
  })
}

export default app
