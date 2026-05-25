import { lazy, Suspense } from 'react'
import { Header } from '@/components/layout/Header'
import { SplitPane } from '@/components/layout/SplitPane'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { DiagramPanel } from '@/components/diagram/DiagramPanel'

// 3D background loaded lazily — zero impact on initial bundle
const BackgroundScene = lazy(() =>
  import('@/components/three/BackgroundScene').then((m) => ({ default: m.BackgroundScene })),
)

export default function App() {
  return (
    <div className="flex flex-col h-full">
      {/* Ambient 3D background */}
      <Suspense fallback={null}>
        <BackgroundScene />
      </Suspense>

      {/* Top navigation */}
      <Header />

      {/* Main content — draggable split pane */}
      <SplitPane
        left={<ChatPanel />}
        right={<DiagramPanel />}
      />
    </div>
  )
}
