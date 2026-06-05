import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import scenesRouter from './routes/scenes'
import sessionsRouter from './routes/sessions'
import profileRouter from './routes/profile'
import { attachAudioGateway } from './ws/audioGateway'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/scenes', scenesRouter)
app.use('/api/sessions', sessionsRouter)
app.use('/api/profile', profileRouter)

const server = http.createServer(app)
attachAudioGateway(server)

if (require.main === module) {
  const PORT = process.env.PORT || 3001
  server.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`)
  })
}

export default app
