import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, useAuthHydrated } from '@/store/authStore'

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const hydrated        = useAuthHydrated()

  // Don't redirect until we've rehydrated from localStorage —
  // otherwise a page refresh for a logged-in user flashes /login.
  if (!hydrated) return null

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
