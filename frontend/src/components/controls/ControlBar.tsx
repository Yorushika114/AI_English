import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import RecordButton from './RecordButton'
import WaveformVisualizer from './WaveformVisualizer'
import { usePracticeStore } from '../../store/practiceStore'

export default function ControlBar() {
  const [text, setText] = useState('')
  const { sendMessage, isLoading, isRecording, setIsRecording, currentScene } = usePracticeStore()
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || isLoading || !currentScene) return
    setText('')
    await sendMessage(trimmed)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop()
      setIsRecording(false)
      return
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition
    if (!SR) {
      alert('您的浏览器不支持语音识别，请使用 Chrome 浏览器')
      return
    }

    const recognition = new SR()
    recognition.lang = 'en-US'
    recognition.interimResults = true
    recognition.continuous = false

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('')
      setText(transcript)
    }

    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)
    recognition.start()
    recognitionRef.current = recognition
    setIsRecording(true)
  }

  const disabled = !currentScene || isLoading

  return (
    <div className="bg-white border-t border-border p-4 shrink-0">
      {isRecording && (
        <div className="flex justify-center mb-2">
          <WaveformVisualizer isRecording={isRecording} />
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={disabled ? '请先在左上角菜单选择练习场景…' : '输入英文或点击麦克风说话…'}
          className="flex-1 h-11 px-4 rounded-pill border border-border text-text placeholder:text-subtle text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-bg disabled:cursor-not-allowed transition-colors"
        />
        <RecordButton isRecording={isRecording} onToggle={toggleRecording} disabled={disabled} />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!text.trim() || disabled}
          className="w-11 h-11 rounded-btn bg-primary text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:bg-primary/90"
          aria-label="发送"
        >
          <Send size={18} />
        </motion.button>
      </div>
    </div>
  )
}
