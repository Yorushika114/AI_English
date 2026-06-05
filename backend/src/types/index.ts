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

// --- Phoneme analysis types ---

export type PhonemeScore = {
  symbol: string      // e.g. "HH", "AH", "L"
  score: number       // 0-100
  dpResult: number    // 0 = correct, >0 = error type
  stress: number      // 0 or 1
}

export type WordPhonemeData = {
  word: string
  accuracyScore: number
  phonemes: PhonemeScore[]
}

export type ProsodyData = {
  intonation: {
    pattern: 'rising' | 'falling' | 'level'
    f0Mean: number
    f0Trend: number   // Hz/frame, positive = rising
  }
  wordStress: Array<{
    word: string
    expectedStress: number[]   // syllable indices with stress
    phones: string[]           // ARPAbet phones from CMU Dict
  }>
}

export type StoredPhonemicsData = {
  isePhonemes: WordPhonemeData[]
  prosody: ProsodyData | null
}

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
  linkedSpeech: string[]
  ieltsComment: string
  overallBand: number   // 4-9
}

// --- Core message/session types ---

export type Message = {
  id: string
  role: 'ai' | 'user'
  text: string
  feedback?: Feedback
  phonemicsData?: StoredPhonemicsData   // stored by audioGateway, never sent to frontend
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
