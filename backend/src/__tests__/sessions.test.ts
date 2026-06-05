import request from 'supertest'
import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(__dirname, '../../data/db.json')

beforeEach(() => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
  jest.resetModules()
})

afterAll(() => {
  if (fs.existsSync(DB_PATH)) fs.unlinkSync(DB_PATH)
})

function getApp() {
  return require('../index').default
}

test('GET /api/health returns ok', async () => {
  const res = await request(getApp()).get('/api/health')
  expect(res.status).toBe(200)
  expect(res.body.ok).toBe(true)
})

test('GET /api/scenes returns 5 scenes', async () => {
  const res = await request(getApp()).get('/api/scenes')
  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(5)
})

test('POST /api/sessions creates session', async () => {
  const res = await request(getApp())
    .post('/api/sessions')
    .send({ sceneId: 'restaurant' })
  expect(res.status).toBe(200)
  expect(res.body.sceneId).toBe('restaurant')
  expect(res.body.id).toBeDefined()
  expect(res.body.messages).toEqual([])
})

test('POST /api/sessions returns 400 for invalid sceneId', async () => {
  const res = await request(getApp())
    .post('/api/sessions')
    .send({ sceneId: 'invalid-scene' })
  expect(res.status).toBe(400)
})

test('GET /api/sessions returns session list', async () => {
  const app = getApp()
  await request(app).post('/api/sessions').send({ sceneId: 'restaurant' })
  const res = await request(app).get('/api/sessions')
  expect(res.status).toBe(200)
  expect(res.body).toHaveLength(1)
})

test('GET /api/sessions/:id returns 404 for missing', async () => {
  const res = await request(getApp()).get('/api/sessions/nonexistent-id')
  expect(res.status).toBe(404)
})

test('POST /api/sessions/:id/message returns 400 without text', async () => {
  const app = getApp()
  const { body: session } = await request(app)
    .post('/api/sessions')
    .send({ sceneId: 'restaurant' })
  const res = await request(app)
    .post(`/api/sessions/${session.id}/message`)
    .send({})
  expect(res.status).toBe(400)
})
