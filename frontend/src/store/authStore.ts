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
