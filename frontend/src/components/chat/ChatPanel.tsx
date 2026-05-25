import { useAppStore } from '@/store/appStore'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { WelcomeScreen } from './WelcomeScreen'

// The left column: welcome → message list + input
export function ChatPanel() {
  const { phase } = useAppStore()

  if (phase === 'idle') {
    return (
      <div className="flex-1 overflow-hidden">
        <WelcomeScreen />
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
