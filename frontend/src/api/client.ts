import axios from 'axios'
import type { ApiError } from '@/types/api'

// In dev, Vite proxy forwards /api → http://localhost:8080
// In prod, replace with VITE_API_BASE or same-origin
const BASE = import.meta.env.VITE_API_BASE ?? ''

export const apiClient = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90_000, // Gemini can be slow on first request
})

// ── Request interceptor — attach Bearer token ────────────────────
apiClient.interceptors.request.use((config) => {
  // Read directly from localStorage to avoid circular import (authStore → client → authStore)
  const raw = localStorage.getItem('schemavis-auth')
  if (raw) {
    try {
      const token: string | null = JSON.parse(raw)?.state?.token ?? null
      if (token) config.headers.Authorization = `Bearer ${token}`
    } catch {
      // malformed storage — ignore
    }
  }
  return config
})

// ── Response interceptor — normalise errors ──────────────────────
apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const data = err.response?.data as ApiError | undefined
    const message =
      data?.message ??
      (err.response?.status === 401
        ? 'Session expired — please log in again.'
        : err.response?.status === 429
        ? 'Too many requests — slow down a little.'
        : err.response?.status === 503
        ? 'AI service is temporarily unavailable. Try again in a moment.'
        : 'Something went wrong. Please try again.')

    err.friendlyMessage = message
    err.apiError = data
    return Promise.reject(err)
  },
)
