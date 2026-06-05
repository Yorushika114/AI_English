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

const mockSession = {
  id: 'test-id',
  sceneId: 'restaurant',
  sceneName: '餐厅点餐',
  messages: [],
  avgScore: 0,
  startedAt: '2026-06-05T00:00:00.000Z'
}

test('createSession stores and returns session', () => {
  const { storageService } = require('../services/storageService')
  const session = storageService.createSession(mockSession)
  expect(session.id).toBe('test-id')
  expect(session.sceneName).toBe('餐厅点餐')
})

test('getSessions returns stored sessions', () => {
  const { storageService } = require('../services/storageService')
  storageService.createSession(mockSession)
  const sessions = storageService.getSessions()
  expect(sessions).toHaveLength(1)
  expect(sessions[0].id).toBe('test-id')
})

test('getSession returns correct session', () => {
  const { storageService } = require('../services/storageService')
  storageService.createSession(mockSession)
  const found = storageService.getSession('test-id')
  expect(found?.sceneName).toBe('餐厅点餐')
})

test('getSession returns undefined for missing id', () => {
  const { storageService } = require('../services/storageService')
  expect(storageService.getSession('missing')).toBeUndefined()
})

test('updateSession modifies session', () => {
  const { storageService } = require('../services/storageService')
  storageService.createSession(mockSession)
  const updated = storageService.updateSession('test-id', { avgScore: 90 })
  expect(updated?.avgScore).toBe(90)
  expect(storageService.getSession('test-id')?.avgScore).toBe(90)
})

test('updateSession returns undefined for missing id', () => {
  const { storageService } = require('../services/storageService')
  expect(storageService.updateSession('missing', { avgScore: 90 })).toBeUndefined()
})
