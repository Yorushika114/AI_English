import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle } from 'lucide-react'
import type { Feedback } from '../../types'

const scoreColor = (score: number) =>
  score >= 80 ? 'text-success' : score >= 60 ? 'text-yellow-500' : 'text-error'

const typeBadgeClass: Record<string, string> = {
  grammar: 'bg-blue-100 text-blue-700',
  expression: 'bg-purple-100 text-purple-700',
  pronunciation: 'bg-orange-100 text-orange-700'
}

type Props = { feedback: Feedback }

export default function FeedbackBlock({ feedback }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 pt-3 border-t border-gray-100 overflow-hidden"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-subtle font-medium">发音评分</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-lg font-bold ${scoreColor(feedback.pronunciationScore)}`}
        >
          {feedback.pronunciationScore}
        </motion.span>
        <span className="text-xs text-subtle">/ 100</span>
        {feedback.corrections.length === 0 && (
          <CheckCircle size={14} className="text-success ml-auto" />
        )}
      </div>
      {feedback.corrections.map((c, i) => (
        <div key={i} className="flex flex-col gap-1 mb-2 last:mb-0">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-error mt-0.5 shrink-0" />
            <div className="flex-1 flex flex-wrap items-center gap-1">
              <span className="line-through text-error text-sm">{c.original}</span>
              <span className="text-subtle text-sm">→</span>
              <span className="text-success text-sm font-medium">{c.suggestion}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${typeBadgeClass[c.type] ?? 'bg-gray-100 text-gray-600'}`}>
                {c.type}
              </span>
            </div>
          </div>
          <p className="text-xs text-subtle ml-5">{c.explanation}</p>
        </div>
      ))}
    </motion.div>
  )
}
