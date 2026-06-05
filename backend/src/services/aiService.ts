import OpenAI from 'openai'
import { Message, Feedback, Scene } from '../types'

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
