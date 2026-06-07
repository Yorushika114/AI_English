import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Microscope, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import type { Feedback, PhonemeAnalysisResult, PronunciationIssue } from '../../types'
import { api } from '../../api/client'
import { usePracticeStore } from '../../store/practiceStore'
import PhonemeAnalysis from './PhonemeAnalysis'

// Tips for difficult phonemes (keyed by IPA substring)
const IPA_TIPS: Record<string, string> = {
  'θ':   '舌尖轻触上下齿之间，送气（如 think, thank）',
  'ð':   '舌尖轻触上下齿之间，振动声带（如 the, this）',
  'ʃ':   '嘴唇前嘟，气流从舌中间送出（如 she, ship）',
  'ʒ':   '类似 /ʃ/ 但振动声带（如 vision, measure）',
  'tʃ':  '先发 /t/ 再发 /ʃ/（如 cheese, watch）',
  'dʒ':  '先发 /d/ 再发 /ʒ/（如 just, bridge）',
  'ŋ':   '舌根抵上颚，气流从鼻腔出（如 sing, king）',
  'æ':   '嘴大张，嘴角向两侧拉伸（如 cat, bad）',
  'ɛ':   '嘴半开，比 /æ/ 嘴型小（如 bed, head）',
  'ɪ':   '短促，不拉长，舌头稍高（如 sit, bit）',
  'ɜːr': '嘴微张，舌头卷起不碰上颚（如 bird, her）',
  'r':   '舌头不碰任何位置，略后卷（如 red, right）',
  'l':   '舌尖抵上齿龈，气流绕舌两侧流出（如 love, fill）',
  'v':   '上齿轻咬下唇，振动声带（如 very, live）',
  'ʊ':   '短促，嘴唇稍圆（如 book, look）',
  'ə':   '最中性元音，通常在非重读音节（如 about, ago）',
  'aɪ':  '从 /a/ 滑向 /ɪ/（如 my, time）',
  'aʊ':  '从 /a/ 滑向 /ʊ/（如 how, now）',
  'oʊ':  '从 /o/ 滑向 /ʊ/（如 go, home）',
  'eɪ':  '从 /e/ 滑向 /ɪ/（如 say, day）',
}

const DP_LABEL: Record<number, string> = {
  0:  '音节准确',
  16: '多读了',
  32: '漏读了',
  64: '读错了',
}

function getTips(ipa: string): string[] {
  const tips: string[] = []
  // Check longer keys first to avoid partial matches
  const sorted = Object.keys(IPA_TIPS).sort((a, b) => b.length - a.length)
  for (const key of sorted) {
    if (ipa.includes(key)) {
      tips.push(`/${key}/ — ${IPA_TIPS[key]}`)
    }
  }
  return tips
}

function scoreColor(score: number) {
  return score >= 80 ? 'text-success' : score >= 60 ? 'text-yellow-500' : 'text-error'
}

function scoreBg(score: number) {
  return score >= 80 ? 'bg-green-50 border-green-100' : score >= 60 ? 'bg-yellow-50 border-yellow-100' : 'bg-red-50 border-red-100'
}

function PronunciationIssueBlock({ issue }: { issue: PronunciationIssue }) {
  const [open, setOpen] = useState(true)
  const tips = issue.syllables.flatMap(s => getTips(s.ipa))
  const uniqueTips = [...new Set(tips)]

  return (
    <div className={`rounded-lg border text-xs ${scoreBg(issue.score)} overflow-hidden`}>
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <span className="font-semibold text-text">{issue.word}</span>
        <span className={`font-bold ${scoreColor(issue.score)}`}>{issue.score}分</span>
        <span className="text-subtle ml-auto flex items-center gap-0.5">
          {issue.syllables.map((s, i) => (
            <span key={i} className="font-mono">
              <span className="text-subtle">/</span>
              <span className={scoreColor(s.score)}>{s.ipa}</span>
              <span className="text-subtle">/</span>
              {i < issue.syllables.length - 1 && <span className="mx-0.5 text-subtle">·</span>}
            </span>
          ))}
          <span className="ml-1.5">{open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}</span>
        </span>
      </button>

      {open && (
        <div className="px-3 pb-2.5 flex flex-col gap-1.5 border-t border-inherit">
          {issue.syllables.map((s, i) => (
            <div key={i} className="flex items-start gap-1.5 mt-1.5">
              <span className="font-mono text-xs mt-0.5">
                <span className="text-subtle">/</span>
                <span className={`font-semibold ${scoreColor(s.score)}`}>{s.ipa}</span>
                <span className="text-subtle">/</span>
              </span>
              <span className={`px-1.5 py-0.5 rounded-full text-xs shrink-0 ${
                s.dpResult === 0
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {DP_LABEL[s.dpResult] ?? '发音问题'}
              </span>
            </div>
          ))}

          {uniqueTips.length > 0 && (
            <div className="mt-1 pt-1.5 border-t border-inherit flex flex-col gap-1">
              <span className="text-subtle font-medium">发音指导</span>
              {uniqueTips.map((tip, i) => (
                <span key={i} className="text-text leading-relaxed">{tip}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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

  const issues = feedback.pronunciationIssues ?? []

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 pt-3 border-t border-gray-100 overflow-hidden"
    >
      {/* Score row */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <span className="text-xs text-subtle font-medium">综合评分</span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-lg font-bold ${scoreColor(feedback.pronunciationScore)}`}
        >
          {feedback.pronunciationScore}
        </motion.span>
        <span className="text-xs text-subtle">/ 100</span>
        {feedback.phonemeAccuracyScore !== undefined && (
          <>
            <span className="text-xs text-subtle font-medium ml-2">音素准确率</span>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className={`text-lg font-bold ${scoreColor(feedback.phonemeAccuracyScore)}`}
            >
              {feedback.phonemeAccuracyScore}
            </motion.span>
            <span className="text-xs text-subtle">/ 100</span>
          </>
        )}
        {issues.length === 0 && feedback.corrections.length === 0 && (
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
            {loading ? '分析中…' : '深度分析'}
          </button>
        )}
      </div>

      {error && <p className="text-xs text-error mb-2">{error}</p>}

      {/* Pronunciation issues */}
      {issues.length > 0 && (
        <div className="mb-3 flex flex-col gap-1.5">
          <span className="text-xs text-subtle font-medium">音节问题</span>
          {issues.map((issue, i) => (
            <PronunciationIssueBlock key={i} issue={issue} />
          ))}
        </div>
      )}

      {/* Grammar / expression corrections */}
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
