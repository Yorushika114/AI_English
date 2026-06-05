import { render, screen } from '@testing-library/react'
import MessageCard from '../components/conversation/MessageCard'
import type { Message } from '../types'

const aiMessage: Message = { id: '1', role: 'ai', text: 'Hello! How can I help you?', createdAt: '' }
const userMessage: Message = {
  id: '2', role: 'user', text: 'I want a coffee.',
  createdAt: '',
  feedback: { pronunciationScore: 75, corrections: [] }
}

test('renders AI message text', () => {
  render(<MessageCard message={aiMessage} />)
  expect(screen.getByText('Hello! How can I help you?')).toBeInTheDocument()
})

test('renders user message text', () => {
  render(<MessageCard message={userMessage} />)
  expect(screen.getByText('I want a coffee.')).toBeInTheDocument()
})

test('shows feedback block for user message with feedback', () => {
  render(<MessageCard message={userMessage} />)
  expect(screen.getByText('75')).toBeInTheDocument()
})

test('does not show feedback for AI message', () => {
  render(<MessageCard message={aiMessage} />)
  expect(screen.queryByText('发音评分')).not.toBeInTheDocument()
})
