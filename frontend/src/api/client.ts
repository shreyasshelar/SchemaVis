import axios from 'axios'
import type { ApiError } from '@/types/api'

// In dev, Vite proxy forwards /api → http://localhost:8080
// In prod, replace with process.env.VITE_API_BASE or same-origin
const BASE = import.meta.env.VITE_API_BASE ?? ''

export const apiClient = axios.create({
  baseURL: BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 90_000, // Gemini can be slow on first request
})

// ── Response interceptor — normalise errors ──────────────────────
apiClient.interceptors.response.use(
  (r) => r,
  (err) => {
    const data = err.response?.data as ApiError | undefined
    const message =
      data?.message ??
      (err.response?.status === 429
        ? 'Too many requests — slow down a little.'
        : err.response?.status === 503
        ? 'AI service is temporarily unavailable. Try again in a moment.'
        : 'Something went wrong. Please try again.')

    // Attach a friendly message to the error so UI can display it directly
    err.friendlyMessage = message
    err.apiError = data
    return Promise.reject(err)
  },
)
