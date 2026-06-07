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
  phonemeAccuracyScore?: number
  corrections: Correction[]
}

// --- Phoneme analysis types (frontend only needs the result) ---

export type PhonemeAnalysisWordItem = {
  word: string
  severity: 'good' | 'warning' | 'error'
  ipa: string
  issue?: string
  suggestion?: string
}

export type PhonemeAnalysisResult = {
  wordAnalysis: PhonemeAnalysisWordItem[]
  intonation: {
    pattern: string
    expected?: string
    suggestion: string
  }
  linkedSpeech: { example: string; context: string; rule: string }[]
  ieltsComment: string
  overallBand: number
}

// --- Core types ---

export type Message = {
  id: string
  role: 'ai' | 'user'
  text: string
  feedback?: Feedback
  hasPhonemicsData?: boolean   // set by handleFeedback when backend has stored phonemics data
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
