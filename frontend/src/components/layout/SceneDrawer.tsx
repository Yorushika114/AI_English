import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePracticeStore } from '../../store/practiceStore'

const EMOJI: Record<string, string> = {
  'free-talk': '💬',
  'job-interview': '💼',
  'restaurant': '🍽️',
  'business-meeting': '📊',
  'travel': '✈️',
  'shopping': '🛍️'
}

type Props = { open: boolean; onClose: () => void }

export default function SceneDrawer({ open, onClose }: Props) {
  const { scenes, currentScene, setScene, isLoading } = usePracticeStore()
  const navigate = useNavigate()

  const handleSelect = async (sceneId: string) => {
    const scene = scenes.find(s => s.id === sceneId)
    if (!scene) return
    onClose()
    await setScene(scene)
    navigate('/')
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-20"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed left-0 top-0 bottom-0 w-72 bg-white z-30 shadow-xl flex flex-col"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h2 className="font-semibold text-text">选择场景</h2>
              <button onClick={onClose} className="p-1.5 rounded-btn hover:bg-bg text-subtle transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
              {scenes.length === 0 && (
                <p className="text-sm text-subtle text-center mt-8">加载中…</p>
              )}
              {scenes.map(scene => (
                <button
                  key={scene.id}
                  onClick={() => handleSelect(scene.id)}
                  disabled={isLoading}
                  className={`w-full text-left p-3 rounded-card border transition-all disabled:opacity-50 ${
                    currentScene?.id === scene.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-white hover:bg-bg'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{EMOJI[scene.id] ?? '🎤'}</span>
                    <div>
                      <div className={`font-medium text-sm ${currentScene?.id === scene.id ? 'text-primary' : 'text-text'}`}>
                        {scene.name}
                      </div>
                      <div className="text-xs text-subtle mt-0.5">{scene.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
