import { Menu, Mic } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { usePracticeStore } from '../../store/practiceStore'

type Props = { onMenuClick: () => void }

const NAV = [
  { path: '/', label: '练习' },
  { path: '/history', label: '历史' },
  { path: '/profile', label: '我的' }
]

export default function TopBar({ onMenuClick }: Props) {
  const { currentScene } = usePracticeStore()
  const { pathname } = useLocation()

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-4 gap-3 z-10 shrink-0">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-btn hover:bg-bg transition-colors"
        aria-label="打开场景菜单"
      >
        <Menu size={20} className="text-subtle" />
      </button>
      <div className="flex items-center gap-2 flex-1">
        <div className="w-7 h-7 rounded-btn bg-primary flex items-center justify-center shrink-0">
          <Mic size={13} className="text-white" />
        </div>
        <span className="font-semibold text-text tracking-tight">英语口语陪练</span>
        {currentScene && pathname === '/' && (
          <span className="ml-1 text-xs text-subtle bg-bg border border-border px-2 py-0.5 rounded truncate max-w-28">
            {currentScene.name}
          </span>
        )}
      </div>
      <nav className="flex items-center gap-0.5">
        {NAV.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`px-3 py-1.5 rounded-btn text-sm font-medium transition-colors ${
              pathname === item.path
                ? 'bg-primary/10 text-primary'
                : 'text-subtle hover:text-text hover:bg-bg'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
