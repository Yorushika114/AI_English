import { useEffect, useRef, Fragment } from 'react'
import MessageCard from './MessageCard'
import type { Message } from '../../types'

type Props = { messages: Message[]; isLoading: boolean; streamingAiText?: string; resumedMessageCount?: number }

export default function ConversationFeed({ messages, isLoading, streamingAiText, resumedMessageCount = 0 }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, streamingAiText])

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center text-subtle p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">🎤</div>
          <p className="font-semibold text-lg text-text">选择场景开始练习</p>
          <p className="text-sm mt-2">点击左上角菜单选择练习场景</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
      {messages.map((msg, i) => (
        <Fragment key={msg.id}>
          {resumedMessageCount > 0 && i === resumedMessageCount && (
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-subtle shrink-0">继续对话</span>
              <div className="flex-1 h-px bg-border" />
            </div>
          )}
          <MessageCard message={msg} />
        </Fragment>
      ))}
      {streamingAiText && (
        <MessageCard
          key="__streaming__"
          message={{ id: '__streaming__', role: 'ai', text: streamingAiText, createdAt: '' }}
        />
      )}
      {isLoading && !streamingAiText && (
        <div className="bg-white rounded-card p-5 border border-border animate-pulse">
          <div className="flex gap-3 items-center">
            <div className="w-7 h-7 rounded-btn bg-bg shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
