// frontend/src/hooks/useAuth.js
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import useAuthStore from '../store/authStore'
import useUIStore   from '../store/uiStore'

export default function useAuth() {
  const navigate   = useNavigate()
  const { setAuth, logout, user, token } = useAuthStore()
  const { addToast } = useUIStore()

  const loginMutation = useMutation({
    mutationFn: ({ email, password }) => authApi.login(email, password),
    onSuccess: ({ data }) => {
      setAuth(
        {
          id:        data.user_id,
          full_name: data.full_name,
          email:     data.email,
          role:      data.role,
        },
        data.access_token,
      )
      if (data.role === 'admin')           navigate('/admin')
      else if (data.role === 'instructor') navigate('/instructor')
      else                                 navigate('/student')
    },
    onError: (err) => {
      addToast({
        type: 'error',
        message: err.response?.data?.detail || 'Login failed',
      })
    },
  })

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return {
    user,
    token,
    isAuthenticated: !!token,
    isAdmin:      user?.role === 'admin',
    isInstructor: user?.role === 'instructor',
    isStudent:    user?.role === 'student',
    login:        loginMutation.mutate,
    isLoggingIn:  loginMutation.isPending,
    logout:       handleLogout,
  }
}