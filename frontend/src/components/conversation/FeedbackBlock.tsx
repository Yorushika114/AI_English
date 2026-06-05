import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Microscope, Loader2 } from 'lucide-react'
import type { Feedback, PhonemeAnalysisResult } from '../../types'
import { api } from '../../api/client'
import { usePracticeStore } from '../../store/practiceStore'
import PhonemeAnalysis from './PhonemeAnalysis'

const scoreColor = (score: number) =>
  score >= 80 ? 'text-success' : score >= 60 ? 'text-yellow-500' : 'text-error'

const typeBadgeClass: Record<string, string> = {
  grammar: 'bg-bg text-text border border-border',
  expression: 'bg-bg text-text border border-border',
  pronunciation: 'bg-bg text-text border border-border',
}

type Props = {
  feedback: Feedback
  messageId: string
  text: string
  hasPhonemicsData?: boolean
}

export default function FeedbackBlock({ feedback, messageId, text, hasPhonemicsData }: Props) {
  const { currentSession } = usePracticeStore()
  const [analysis, setAnalysis] = useState<PhonemeAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAnalyze = async () => {
    if (!currentSession) return
    setLoading(true)
    setError(null)
    try {
      const result = await api.phonemeAnalysis(currentSession.id, messageId)
      setAnalysis(result)
    } catch {
      setError('分析失败，请重试')
    } finally {
      setLoading(false)
    }
  }

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
        {hasPhonemicsData && !analysis && (
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="ml-auto flex items-center gap-1 text-xs text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Microscope size={13} />
            )}
            {loading ? '分析中…' : '详细发音分析'}
          </button>
        )}
      </div>

      {error && (
        <p className="text-xs text-error mb-2">{error}</p>
      )}

      {feedback.corrections.map((c, i) => (
        <div key={i} className="flex flex-col gap-1 mb-2 last:mb-0">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="text-error mt-0.5 shrink-0" />
            <div className="flex-1 flex flex-wrap items-center gap-1">
              <span className="line-through text-error text-sm">{c.original}</span>
              <span className="text-subtle text-sm">→</span>
              <span className="text-success text-sm font-medium">{c.suggestion}</span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full ${
                  typeBadgeClass[c.type] ?? 'bg-gray-100 text-gray-600'
                }`}
              >
                {c.type}
              </span>
            </div>
          </div>
          <p className="text-xs text-subtle ml-5">{c.explanation}</p>
        </div>
      ))}

      {analysis && <PhonemeAnalysis text={text} analysis={analysis} />}
    </motion.div>
  )
}
