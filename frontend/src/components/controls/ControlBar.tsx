import { useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send } from 'lucide-react'
import RecordButton from './RecordButton'
import WaveformVisualizer from './WaveformVisualizer'
import { usePracticeStore } from '../../store/practiceStore'
import { useVoiceRecorder, type WsMessage } from '../../hooks/useVoiceRecorder'

export default function ControlBar() {
  const [text, setText] = useState('')
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const {
    sendMessage,
    isLoading,
    isRecording,
    setIsRecording,
    currentScene,
    currentSession,
    partialTranscript,
    handlePartial,
    handleTranscript,
    handleAiChunk,
    handleAiDone,
    handleFeedback,
    handleTtsAudio,
    handleError,
  } = usePracticeStore()

  const onMessage = useCallback((msg: WsMessage) => {
    switch (msg.type) {
      case 'partial':    handlePartial(msg.text); break
      case 'transcript': handleTranscript(msg.text); break
      case 'ai_chunk':   handleAiChunk(msg.text); break
      case 'ai_done':    handleAiDone(); break
      case 'feedback':   handleFeedback(msg.feedback, msg.hasPhonemicsData, msg.messageId); break
      case 'tts_audio':  handleTtsAudio(msg.data); break
      case 'error':      console.error('Voice error:', msg.message); setIsRecording(false); handleError(); break
    }
  }, [handlePartial, handleTranscript, handleAiChunk, handleAiDone, handleFeedback, handleTtsAudio, setIsRecording, handleError])

  const { start, stop } = useVoiceRecorder({
    sessionId: currentSession?.id ?? '',
    onMessage,
  })

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

  useEffect(() => {
    if (!voiceError) return
    const t = setTimeout(() => setVoiceError(null), 4000)
    return () => clearTimeout(t)
  }, [voiceError])

  const toggleRecording = async () => {
    if (isRecording) {
      stop()
      setIsRecording(false)
      return
    }
    setVoiceError(null)
    if (!currentSession) {
      setVoiceError('会话未就绪，请稍等片刻再试')
      return
    }
    try {
      await start()
      setIsRecording(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : '语音功能启动失败'
      setVoiceError(msg)
      console.error('Voice start failed:', err)
    }
  }

  const disabled = !currentScene || isLoading
  const displayText = isRecording && partialTranscript ? partialTranscript : text

  return (
    <div className="bg-white border-t border-border p-4 shrink-0">
      {voiceError && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs text-center">
          {voiceError}
        </div>
      )}
      {isRecording && (
        <div className="flex justify-center mb-2">
          <WaveformVisualizer isRecording={isRecording} />
        </div>
      )}
      <div className="flex items-center gap-3">
        <input
          value={displayText}
          onChange={e => { if (!isRecording) setText(e.target.value) }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          readOnly={isRecording}
          placeholder={disabled ? '请先在左上角菜单选择练习场景…' : '输入英文或点击麦克风说话…'}
          className="flex-1 h-11 px-4 rounded-pill border border-border text-text placeholder:text-subtle text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:bg-bg disabled:cursor-not-allowed transition-colors"
        />
        <RecordButton isRecording={isRecording} onToggle={toggleRecording} disabled={disabled} />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleSend}
          disabled={!text.trim() || disabled || isRecording}
          className="w-11 h-11 rounded-btn bg-primary text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:bg-primary/90"
          aria-label="发送"
        >
          <Send size={18} />
        </motion.button>
      </div>
    </div>
  )
}
