import { motion } from 'framer-motion'
import MessageBubble from './MessageBubble'
import FeedbackBlock from './FeedbackBlock'
import type { Message } from '../../types'

type Props = { message: Message }

export default function MessageCard({ message }: Props) {
  const isAI = message.role === 'ai'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-card p-4 border border-border ${isAI ? 'bg-white' : 'bg-bg'}`}
    >
      <MessageBubble role={message.role} text={message.text} />
      {message.feedback && (
        <FeedbackBlock
          feedback={message.feedback}
          messageId={message.id}
          text={message.text}
          hasPhonemicsData={message.hasPhonemicsData}
        />
      )}
    </motion.div>
  )
}
