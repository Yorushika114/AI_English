import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Trash2, CheckSquare, Square, MessageSquarePlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useHistoryStore } from '../store/historyStore'
import { usePracticeStore } from '../store/practiceStore'
import type { Session } from '../types'

type SessionCardProps = {
  session: Session
  selectMode: boolean
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  onResume: () => void
}

function SessionCard({ session, selectMode, selected, onSelect, onDelete, onResume }: SessionCardProps) {
  const [expanded, setExpanded] = useState(false)
  const scoreColor =
    session.avgScore >= 80 ? 'text-success' :
    session.avgScore >= 60 ? 'text-yellow-500' : 'text-error'
  const date = new Date(session.startedAt).toLocaleDateString('zh-CN')
  const userMsgCount = session.messages.filter(m => m.role === 'user').length

  return (
    <div className={`bg-white rounded-card border overflow-hidden transition-all ${selected ? 'border-primary' : 'border-border'}`}>
      <div className="flex items-center gap-1 px-2">
        {selectMode && (
          <button onClick={onSelect} className="shrink-0 p-1.5 text-primary">
            {selected
              ? <CheckSquare size={18} />
              : <Square size={18} className="text-subtle" />}
          </button>
        )}
        <button
          className="flex-1 py-3 flex items-center gap-3 hover:bg-bg transition-colors text-left"
          onClick={() => selectMode ? onSelect() : setExpanded(v => !v)}
        >
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-text">{session.sceneName}</div>
            <div className="text-xs text-subtle mt-0.5">
              {date} · 对话 {userMsgCount} 轮
            </div>
          </div>
          <span className={`text-xl font-bold shrink-0 ${scoreColor}`}>
            {session.avgScore > 0 ? session.avgScore : '—'}
          </span>
          {!selectMode && (
            expanded
              ? <ChevronUp size={16} className="text-subtle shrink-0" />
              : <ChevronDown size={16} className="text-subtle shrink-0" />
          )}
        </button>
        {!selectMode && (
          <>
            <button
              onClick={onResume}
              className="shrink-0 p-2 text-subtle hover:text-primary transition-colors"
              aria-label="继续对话"
              title="继续对话"
            >
              <MessageSquarePlus size={16} />
            </button>
            <button
              onClick={onDelete}
              className="shrink-0 p-2 text-subtle hover:text-error transition-colors"
              aria-label="删除"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
      </div>
      <AnimatePresence>
        {!selectMode && expanded && (
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
                      ? 'bg-bg text-text'
                      : 'bg-white border border-border text-text'
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
              <button
                onClick={onResume}
                className="mt-2 w-full py-2 rounded-btn border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-colors flex items-center justify-center gap-1.5"
              >
                <MessageSquarePlus size={15} />
                继续这次对话
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function HistoryPage() {
  const { sessions, isLoading, loadSessions, deleteSession, deleteSessions } = useHistoryStore()
  const { resumeSession } = usePracticeStore()
  const navigate = useNavigate()
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [resumingId, setResumingId] = useState<string | null>(null)

  useEffect(() => { loadSessions() }, [loadSessions])

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected(
      selected.size === sessions.length
        ? new Set()
        : new Set(sessions.map(s => s.id))
    )
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelected(new Set())
  }

  const handleDelete = (id: string) => {
    if (!window.confirm('确认删除这条练习记录？')) return
    deleteSession(id)
  }

  const handleBulkDelete = async () => {
    if (selected.size === 0) return
    if (!window.confirm(`确认删除选中的 ${selected.size} 条练习记录？`)) return
    await deleteSessions(Array.from(selected))
    exitSelectMode()
  }

  const handleResume = async (session: Session) => {
    setResumingId(session.id)
    await resumeSession(session)
    navigate('/')
  }

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

  const allSelected = selected.size === sessions.length

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        {selectMode ? (
          <>
            <button
              onClick={toggleSelectAll}
              className="text-sm text-primary font-medium flex items-center gap-1.5"
            >
              {allSelected
                ? <CheckSquare size={16} />
                : <Square size={16} />}
              {allSelected ? '取消全选' : '全选'}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-subtle">已选 {selected.size} 条</span>
              {selected.size > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="text-sm px-3 py-1 bg-error text-white rounded-full font-medium"
                >
                  删除({selected.size})
                </button>
              )}
              <button
                onClick={exitSelectMode}
                className="text-sm px-3 py-1 border border-gray-200 rounded-full text-subtle"
              >
                取消
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-lg font-bold text-text">练习历史</h2>
            <button
              onClick={() => setSelectMode(true)}
              className="text-sm text-subtle hover:text-text transition-colors"
            >
              批量管理
            </button>
          </>
        )}
      </div>
      {sessions.map(s => (
        <SessionCard
          key={s.id}
          session={s}
          selectMode={selectMode}
          selected={selected.has(s.id)}
          onSelect={() => toggleSelect(s.id)}
          onDelete={() => handleDelete(s.id)}
          onResume={() => handleResume(s)}
        />
      ))}
      {resumingId && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-subtle text-sm">正在加载对话…</div>
        </div>
      )}
    </div>
  )
}
