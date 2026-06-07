import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Volume2, Loader2 } from 'lucide-react'
import MessageBubble from './MessageBubble'
import FeedbackBlock from './FeedbackBlock'
import type { Message } from '../../types'

type Props = { message: Message }

export default function MessageCard({ message }: Props) {
  const isAI = message.role === 'ai'
  const [replaying, setReplaying] = useState(false)

  const handleReplay = useCallback(() => {
    if (!message.audioUrl || replaying) return
    setReplaying(true)
    const audio = new Audio(message.audioUrl)
    audio.play().catch(() => {})
    audio.onended = () => setReplaying(false)
    audio.onerror = () => setReplaying(false)
  }, [message.audioUrl, replaying])

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`rounded-card p-4 border border-border ${isAI ? 'bg-white' : 'bg-bg'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <MessageBubble role={message.role} text={message.text} />
        </div>
        {message.audioUrl && (
          <button
            onClick={handleReplay}
            disabled={replaying}
            title="复读"
            className="mt-1 shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-subtle hover:text-primary hover:bg-primary/10 transition-colors disabled:opacity-40"
          >
            {replaying
              ? <Loader2 size={14} className="animate-spin" />
              : <Volume2 size={14} />
            }
          </button>
        )}
      </div>
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
