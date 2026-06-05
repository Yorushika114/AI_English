import fs from 'fs'
import path from 'path'
import { Session } from '../types'

const DB_PATH = path.join(__dirname, '../../data/db.json')

type DB = { sessions: Session[] }

function read(): DB {
  if (!fs.existsSync(DB_PATH)) return { sessions: [] }
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
  } catch {
    return { sessions: [] }
  }
}

function write(db: DB): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2))
}

export const storageService = {
  getSessions(): Session[] {
    return read().sessions
  },
  getSession(id: string): Session | undefined {
    return read().sessions.find(s => s.id === id)
  },
  createSession(session: Session): Session {
    const db = read()
    db.sessions.push(session)
    write(db)
    return session
  },
  updateSession(id: string, updates: Partial<Session>): Session | undefined {
    const db = read()
    const idx = db.sessions.findIndex(s => s.id === id)
    if (idx === -1) return undefined
    db.sessions[idx] = { ...db.sessions[idx], ...updates }
    write(db)
    return db.sessions[idx]
  }
}
