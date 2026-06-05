import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useHistoryStore } from '../store/historyStore'
import type { Session } from '../types'

function SessionCard({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor =
    session.avgScore >= 80 ? 'text-success' :
    session.avgScore >= 60 ? 'text-yellow-500' : 'text-error'
  const date = new Date(session.startedAt).toLocaleDateString('zh-CN')
  const userMsgCount = session.messages.filter(m => m.role === 'user').length

  return (
    <div className="bg-white rounded-card shadow-sm overflow-hidden">
      <button
        className="w-full p-4 flex items-center gap-3 hover:bg-bg transition-colors text-left"
        onClick={() => setExpanded(v => !v)}
      >
        <div className="flex-1">
          <div className="font-semibold text-text">{session.sceneName}</div>
          <div className="text-xs text-subtle mt-0.5">
            {date} · 对话 {userMsgCount} 轮
          </div>
        </div>
        <span className={`text-xl font-bold ${scoreColor}`}>
          {session.avgScore > 0 ? session.avgScore : '—'}
        </span>
        {expanded
          ? <ChevronUp size={16} className="text-subtle shrink-0" />
          : <ChevronDown size={16} className="text-subtle shrink-0" />
        }
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 flex flex-col gap-2 border-t border-gray-50 pt-3">
              {session.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`text-sm p-3 rounded-lg ${
                    msg.role === 'ai'
                      ? 'bg-primary/5 text-primary'
                      : 'bg-secondary/5 text-text'
                  }`}
                >
                  <span className="font-medium mr-2">
                    {msg.role === 'ai' ? 'AI:' : '你:'}
                  </span>
                  {msg.text}
                  {msg.feedback && (
                    <span className="ml-2 text-xs text-subtle">
                      ({msg.feedback.pronunciationScore} 分)
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HistoryPage() {
  const { sessions, isLoading, loadSessions } = useHistoryStore()

  useEffect(() => { loadSessions() }, [loadSessions])

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center text-subtle">加载中…</div>
  }

  if (sessions.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-subtle p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="font-semibold text-lg text-text">还没有练习记录</p>
          <p className="text-sm mt-2">完成一次对话后记录会显示在这里</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      <h2 className="text-lg font-bold text-text">练习历史</h2>
      {sessions.map(s => <SessionCard key={s.id} session={s} />)}
    </div>
  )
}
