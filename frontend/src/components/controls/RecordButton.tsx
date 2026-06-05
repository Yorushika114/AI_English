import { motion } from 'framer-motion'
import { Mic, MicOff } from 'lucide-react'

type Props = {
  isRecording: boolean
  onToggle: () => void
  disabled?: boolean
}

export default function RecordButton({ isRecording, onToggle, disabled }: Props) {
  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      onClick={onToggle}
      disabled={disabled}
      aria-label={isRecording ? '停止录音' : '开始录音'}
      className={`relative w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        isRecording
          ? 'bg-error text-white'
          : 'bg-primary text-white'
      }`}
    >
      {isRecording && (
        <motion.span
          animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 rounded-full bg-error"
        />
      )}
      <span className="relative z-10">
        {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
      </span>
    </motion.button>
  )
}
