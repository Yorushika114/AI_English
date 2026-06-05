import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { PhonemeAnalysisResult } from '../../types'

type Props = {
  text: string
  analysis: PhonemeAnalysisResult
}

const severityStyle: Record<string, string> = {
  good: 'text-text',
  warning: 'text-yellow-600 underline decoration-yellow-400 decoration-wavy cursor-pointer',
  error: 'text-error underline decoration-red-400 decoration-wavy cursor-pointer',
}

const bandColor = (band: number) =>
  band >= 7 ? 'text-success' : band >= 5 ? 'text-yellow-600' : 'text-error'

export default function PhonemeAnalysis({ text, analysis }: Props) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)

  const wordMap = new Map(
    analysis.wordAnalysis.map((w) => [w.word.toLowerCase().replace(/[^a-z]/g, ''), w])
  )
  const tokens = text.split(/\s+/)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-3 pt-3 border-t border-gray-100 space-y-3 overflow-hidden"
    >
      {/* Word-level highlighting */}
      <div className="flex flex-wrap gap-1 leading-relaxed">
        {tokens.map((token, i) => {
          const clean = token.toLowerCase().replace(/[^a-z]/g, '')
          const item = wordMap.get(clean)
          const key = `${clean}-${i}`
          const isExpanded = expandedKey === key
          const clickable = item && item.severity !== 'good'

          return (
            <span key={key} className="relative">
              <button
                onClick={() => clickable && setExpandedKey(isExpanded ? null : key)}
                className={`text-sm font-medium px-0.5 rounded ${item ? severityStyle[item.severity] : 'text-text'}`}
                disabled={!clickable}
              >
                {token}
              </button>
              <AnimatePresence>
                {isExpanded && item && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-20 left-0 top-7 bg-white border border-border rounded-xl shadow-lg p-3 w-52 text-xs"
                  >
                    <div className="font-mono text-blue-600 text-sm mb-1">{item.ipa}</div>
                    {item.issue && (
                      <div className="text-error mb-1 leading-snug">{item.issue}</div>
                    )}
                    {item.suggestion && (
                      <div className="text-text leading-snug">{item.suggestion}</div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </span>
          )
        })}
      </div>
      <p className="text-xs text-subtle">点击红色/黄色单词查看音标详情</p>

      {/* Intonation */}
      <div className="bg-gray-50 rounded-lg p-2 text-xs space-y-0.5">
        <p className="font-medium text-subtle">语调分析</p>
        <p className="text-text">{analysis.intonation.suggestion}</p>
        {analysis.intonation.expected && (
          <p className="text-subtle">
            检测到：{analysis.intonation.pattern}　期望：{analysis.intonation.expected}
          </p>
        )}
      </div>

      {/* Connected speech */}
      {analysis.linkedSpeech.length > 0 && (
        <div className="text-xs space-y-1">
          <p className="font-medium text-subtle">连读参考</p>
          <ul className="space-y-0.5">
            {analysis.linkedSpeech.map((item, i) => (
              <li key={i} className="font-mono text-blue-700 bg-blue-50 rounded px-2 py-0.5">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* IELTS comment */}
      <div className="bg-indigo-50 rounded-lg p-2 text-xs border border-indigo-100">
        <span className="font-semibold text-indigo-700">
          雅思评语 Band{' '}
          <span className={`text-base font-bold ${bandColor(analysis.overallBand)}`}>
            {analysis.overallBand}
          </span>
          ：
        </span>
        <span className="text-indigo-600 ml-1 leading-relaxed">{analysis.ieltsComment}</span>
      </div>
    </motion.div>
  )
}
