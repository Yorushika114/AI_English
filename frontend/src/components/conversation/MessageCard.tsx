import { motion } from 'framer-motion'
import MessageBubble from './MessageBubble'
import FeedbackBlock from './FeedbackBlock'
import type { Message } from '../../types'

type Props = { message: Message }

export default function MessageCard({ message }: Props) {
  const isAI = message.role === 'ai'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`bg-white rounded-card p-5 shadow-sm border-l-4 ${
        isAI ? 'border-primary' : 'border-secondary'
      }`}
    >
      <MessageBubble role={message.role} text={message.text} />
      {message.feedback && <FeedbackBlock feedback={message.feedback} />}
    </motion.div>
  )
}
