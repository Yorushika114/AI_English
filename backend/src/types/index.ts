export type Scene = {
  id: string
  name: string
  description: string
  prompt: string
}

export type CorrectionType = 'grammar' | 'expression' | 'pronunciation'

export type Correction = {
  original: string
  suggestion: string
  type: CorrectionType
  explanation: string
}

export type Feedback = {
  pronunciationScore: number
  corrections: Correction[]
}

export type Message = {
  id: string
  role: 'ai' | 'user'
  text: string
  feedback?: Feedback
  createdAt: string
}

export type Session = {
  id: string
  sceneId: string
  sceneName: string
  messages: Message[]
  avgScore: number
  startedAt: string
  endedAt?: string
}
