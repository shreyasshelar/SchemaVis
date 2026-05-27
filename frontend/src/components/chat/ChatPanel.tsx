import { useAppStore } from '@/store/appStore'
import { useSessionDetail } from '@/hooks/useSession'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'
import { Spinner } from '@/components/ui/Spinner'

// The left column: welcome → message list + input
export function ChatPanel() {
  const { phase, sessionId } = useAppStore()
  // Always call before any early return — restores messages + diagram on project switch
  const { isLoading } = useSessionDetail(sessionId)

  if (phase === 'idle') {
    return (
      <div className="flex-1 overflow-hidden">
        <WelcomeScreen />
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner size={20} className="text-sec" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <MessageList />
      <ChatInput />
    </div>
  )
}
