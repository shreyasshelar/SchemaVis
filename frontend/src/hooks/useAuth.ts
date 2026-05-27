import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi, type LoginPayload, type RegisterPayload } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginPayload) => authApi.login(payload),
    onSuccess: (data) => {
      setAuth(data.token, {
        id:          data.userId,
        email:       data.email,
        displayName: data.displayName,
      })
      navigate('/')
    },
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: RegisterPayload) => authApi.register(payload),
    onSuccess: (data) => {
      setAuth(data.token, {
        id:          data.userId,
        email:       data.email,
        displayName: data.displayName,
      })
      navigate('/')
    },
  })
}

export function useLogout() {
  const { clearAuth } = useAuthStore()
  const { resetSession } = useAppStore()
  const navigate = useNavigate()

  return () => {
    clearAuth()
    resetSession()
    navigate('/login')
  }
}
