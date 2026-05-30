import { lazy, Suspense, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { SplitPane } from '@/components/layout/SplitPane'
import { ChatPanel } from '@/components/chat/ChatPanel'
import { DiagramPanel } from '@/components/diagram/DiagramPanel'
import { ProjectsSidebar } from '@/components/projects/ProjectsSidebar'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { LoginPage, RegisterPage } from '@/components/auth/AuthPage'
import DocsPage from '@/pages/DocsPage'

// 3D background — lazy loaded, zero impact on initial bundle
const BackgroundScene = lazy(() =>
  import('@/components/three/BackgroundScene').then((m) => ({ default: m.BackgroundScene })),
)

// ── Main workspace (requires auth) ───────────────────────────────
function Workspace() {
  // Default to collapsed on mobile (< 768px)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(
    () => window.innerWidth < 768
  )

  const toggleSidebar = () => setSidebarCollapsed((c) => !c)

  return (
    <div className="flex flex-col h-full">
      <Suspense fallback={null}>
        <BackgroundScene />
      </Suspense>

      <Header onMenuClick={toggleSidebar} />

      <div className="flex flex-1 overflow-hidden">
        {/* Projects sidebar */}
        <ProjectsSidebar
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
        />

        {/* Chat + Diagram split pane */}
        <SplitPane
          left={<ChatPanel />}
          right={<DiagramPanel />}
        />
      </div>
    </div>
  )
}

// ── App router ───────────────────────────────────────────────────
export default function App() {
  return (
    <Routes>
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/docs"     element={<DocsPage />} />

      {/* All other routes require authentication */}
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Workspace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
