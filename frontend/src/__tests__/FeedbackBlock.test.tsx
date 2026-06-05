import { render, screen } from '@testing-library/react'
import FeedbackBlock from '../components/conversation/FeedbackBlock'
import type { Feedback } from '../types'

const goodFeedback: Feedback = { pronunciationScore: 92, corrections: [] }
const badFeedback: Feedback = {
  pronunciationScore: 62,
  corrections: [{
    original: 'I want order',
    suggestion: "I'd like to order",
    type: 'grammar',
    explanation: '缺少不定式'
  }]
}

test('renders pronunciation score', () => {
  render(<FeedbackBlock feedback={goodFeedback} messageId="test-msg-1" text="I want order" />)
  expect(screen.getByText('92')).toBeInTheDocument()
})

test('shows no corrections message for perfect sentence', () => {
  const { container } = render(<FeedbackBlock feedback={goodFeedback} messageId="test-msg-1" text="I want order" />)
  expect(container.querySelector('svg')).toBeInTheDocument()
})

test('renders correction original and suggestion', () => {
  render(<FeedbackBlock feedback={badFeedback} messageId="test-msg-1" text="I want order" />)
  expect(screen.getByText('I want order')).toBeInTheDocument()
  expect(screen.getByText("I'd like to order")).toBeInTheDocument()
})

test('renders correction explanation', () => {
  render(<FeedbackBlock feedback={badFeedback} messageId="test-msg-1" text="I want order" />)
  expect(screen.getByText('缺少不定式')).toBeInTheDocument()
})
