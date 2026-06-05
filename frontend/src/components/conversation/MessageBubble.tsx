import { Bot, User } from 'lucide-react'

type Props = { role: 'ai' | 'user'; text: string }

export default function MessageBubble({ role, text }: Props) {
  const isAI = role === 'ai'
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
        isAI ? 'bg-primary/10' : 'bg-secondary/10'
      }`}>
        {isAI
          ? <Bot size={16} className="text-primary" />
          : <User size={16} className="text-secondary" />
        }
      </div>
      <div>
        <span className="text-xs font-medium text-subtle mb-1 block">
          {isAI ? 'AI 教练' : '你'}
        </span>
        <p className="text-text leading-relaxed">{text}</p>
      </div>
    </div>
  )
}
