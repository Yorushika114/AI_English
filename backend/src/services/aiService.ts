import Anthropic from '@anthropic-ai/sdk'
import { Message, Feedback, Scene } from '../types'

const client = new Anthropic()

export async function getAIReply(scene: Scene, history: Message[]): Promise<string> {
  const messages = history.map(m => ({
    role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
    content: m.text
  }))

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 200,
    system: scene.prompt,
    messages
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from AI')
  return block.text
}

export async function getFeedback(userText: string, sceneName: string): Promise<Feedback> {
  const prompt = `You are an English language teacher evaluating a student's sentence in a "${sceneName}" scenario.

Analyze: "${userText}"

Respond ONLY with valid JSON, no markdown code fences, no extra text:
{
  "pronunciationScore": <integer 0-100, based on grammar and expression quality>,
  "corrections": [
    {
      "original": "<exact problematic phrase from the sentence>",
      "suggestion": "<corrected version>",
      "type": "<grammar|expression|pronunciation>",
      "explanation": "<brief explanation in Chinese, max 20 characters>"
    }
  ]
}

If the sentence is grammatically correct and natural, return an empty corrections array and a high score (85-100). Be encouraging.`

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{ role: 'user', content: prompt }]
  })

  const block = response.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from AI')

  const text = block.text.trim()
  return JSON.parse(text) as Feedback
}
