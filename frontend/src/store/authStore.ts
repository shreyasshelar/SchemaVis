import { useState, useEffect } from 'react'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AuthUser {
  id:          string
  email:       string
  displayName: string
}

interface AuthState {
  token:           string | null
  user:            AuthUser | null
  isAuthenticated: boolean

  setAuth:  (token: string, user: AuthUser) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token:           null,
      user:            null,
      isAuthenticated: false,

      setAuth: (token, user) =>
        set({ token, user, isAuthenticated: true }),

      clearAuth: () =>
        set({ token: null, user: null, isAuthenticated: false }),
    }),
    {
      name:    'schemavis-auth',
      storage: createJSONStorage(() => localStorage),
    },
  ),
)

// ── Hydration helpers ───────────────────────────────────────────
// Zustand persist hydrates asynchronously from localStorage.
// Until hydration completes, `isAuthenticated` is the default `false`
// even if the user is logged in.  These helpers let components wait
// for the real auth state before rendering auth-dependent UI.

/**
 * Returns `true` once the auth store has finished hydrating from localStorage.
 * Components that branch on `isAuthenticated` should gate on this to avoid
 * a flash of "Sign in" for users who are already logged in.
 */
export function useAuthHydrated(): boolean {
  const [hydrated, setHydrated] = useState(
    useAuthStore.persist.hasHydrated(),
  )

  useEffect(() => {
    // If already hydrated (synchronous storage), skip subscription.
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true)
      return
    }
    const unsub = useAuthStore.persist.onFinishHydration(() =>
      setHydrated(true),
    )
    return unsub
  }, [])

  return hydrated
}
