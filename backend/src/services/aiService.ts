import OpenAI from 'openai'
import { Message, Feedback, Scene, StoredPhonemicsData, PhonemeAnalysisResult } from '../types'

const client = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com'
})

export async function getAIReply(scene: Scene, history: Message[]): Promise<string> {
  const messages = history.map(m => ({
    role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
    content: m.text
  }))

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 200,
    messages: [
      { role: 'system', content: scene.prompt },
      ...messages
    ]
  })

  return response.choices[0].message.content ?? ''
}

export async function getAIReplyStream(
  scene: Scene,
  history: Message[],
  onChunk: (text: string) => void
): Promise<string> {
  const messages = history.map(m => ({
    role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
    content: m.text
  }))

  const stream = await client.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 200,
    stream: true,
    messages: [
      { role: 'system', content: scene.prompt },
      ...messages
    ]
  })

  let full = ''
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? ''
    if (text) {
      full += text
      onChunk(text)
    }
  }
  return full
}

export async function getFeedback(userText: string, sceneName: string): Promise<Feedback> {
  const prompt = `You are an English language teacher evaluating a student's sentence in a "${sceneName}" scenario.

Analyze: "${userText}"

Respond ONLY with valid JSON, no markdown code fences, no extra text:
{
  "corrections": [
    {
      "original": "<exact problematic phrase from the sentence>",
      "suggestion": "<corrected version>",
      "type": "<grammar|expression|pronunciation>",
      "explanation": "<brief explanation in Chinese, max 20 characters>"
    }
  ]
}

If the sentence is grammatically correct and natural, return an empty corrections array. Be encouraging.`

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = (response.choices[0].message.content ?? '').trim()
  const parsed = JSON.parse(text) as { corrections: Feedback['corrections'] }
  return { pronunciationScore: 0, corrections: parsed.corrections ?? [] }
}

export async function getSessionSummary(
  messages: Message[],
  sceneName: string
): Promise<string> {
  const conversation = messages
    .map(m => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.text}`)
    .join('\n')

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 400,
    messages: [{
      role: 'user',
      content: `你是一名英语口语教练。以下是学生在"${sceneName}"场景下的对话记录：\n\n${conversation}\n\n请用中文给出简洁的课后总结，包含：1.本次表现亮点 2.主要问题 3.下次练习建议。每项不超过2句话。`
    }]
  })

  return (response.choices[0].message.content ?? '').trim()
}

export async function getPhonemeAnalysis(
  text: string,
  phonemicsData: StoredPhonemicsData
): Promise<PhonemeAnalysisResult> {
  const problemWords = phonemicsData.isePhonemes
    .filter((w) => w.accuracyScore < 80)
    .map((w) => ({
      word: w.word,
      score: Math.round(w.accuracyScore),
      badPhonemes: w.phonemes
        .filter((p) => p.score < 70 || p.dpResult !== 0)
        .map((p) => `${p.symbol}(${Math.round(p.score)})`),
    }))

  const prosodySummary = phonemicsData.prosody
    ? `Intonation: ${phonemicsData.prosody.intonation.pattern} (trend: ${phonemicsData.prosody.intonation.f0Trend.toFixed(1)} Hz/frame)
Expected word stress: ${phonemicsData.prosody.wordStress
        .map((w) => `${w.word}:[${w.phones.join(',')}]`)
        .join(', ')}`
    : 'Prosody data unavailable'

  const prompt = `You are an IELTS pronunciation coach (targeting Band 7+). Analyze this English learner's speech.

Sentence spoken: "${text}"

ISE Phoneme Issues (words scoring below 80/100):
${problemWords.length > 0 ? JSON.stringify(problemWords, null, 2) : 'None detected — overall pronunciation is good'}

${prosodySummary}

Respond ONLY with valid JSON (no markdown code fences, no extra text):
{
  "wordAnalysis": [
    {
      "word": "<exact word from sentence>",
      "severity": "good|warning|error",
      "ipa": "<IPA transcription e.g. /ɪmˈpɔːrtənt/>",
      "issue": "<specific problem or null>",
      "suggestion": "<how to fix or null>"
    }
  ],
  "intonation": {
    "pattern": "<rising|falling|level|complex>",
    "expected": "<what this sentence type needs>",
    "suggestion": "<advice in Chinese, 1-2 sentences>"
  },
  "linkedSpeech": ["<word1> + <word2> → /<linked IPA>/"],
  "ieltsComment": "<2-3 sentences in Chinese from IELTS examiner perspective>",
  "overallBand": <integer 4-9>
}

Rules:
- wordAnalysis must include EVERY word from the sentence
- Use "good" for words with no issues
- linkedSpeech: list 1-3 realistic linking opportunities in this sentence (even if student didn't make errors — teach the standard)
- overallBand: estimate based on phoneme scores and prosody`

  const response = await client.chat.completions.create({
    model: 'deepseek-chat',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }],
  })

  const raw = (response.choices[0].message.content ?? '').trim()
  return JSON.parse(raw) as PhonemeAnalysisResult
}
