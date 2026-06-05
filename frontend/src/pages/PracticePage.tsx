import { useEffect } from 'react'
import ConversationFeed from '../components/conversation/ConversationFeed'
import ControlBar from '../components/controls/ControlBar'
import { usePracticeStore } from '../store/practiceStore'

export default function PracticePage() {
  const { messages, isLoading, streamingAiText, loadScenes } = usePracticeStore()

  useEffect(() => {
    loadScenes()
  }, [loadScenes])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ConversationFeed messages={messages} isLoading={isLoading} streamingAiText={streamingAiText} />
      <ControlBar />
    </div>
  )
}
