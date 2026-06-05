import { Bot, User } from 'lucide-react'

type Props = { role: 'ai' | 'user'; text: string }

export default function MessageBubble({ role, text }: Props) {
  const isAI = role === 'ai'
  return (
    <div className="flex items-start gap-3">
      <div className={`w-7 h-7 rounded-btn flex items-center justify-center shrink-0 ${
        isAI ? 'bg-primary text-white' : 'bg-border text-subtle'
      }`}>
        {isAI ? <Bot size={14} /> : <User size={14} />}
      </div>
      <div>
        <span className="text-xs font-medium text-subtle mb-1 block">
          {isAI ? 'AI 教练' : '你'}
        </span>
        <p className="text-text leading-relaxed text-sm">{text}</p>
      </div>
    </div>
  )
}
