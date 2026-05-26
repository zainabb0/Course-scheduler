// frontend/src/pages/LoginPage.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Cpu, Eye, EyeOff, Loader2 } from 'lucide-react'
import { authApi } from '../api/auth.api'
import useAuthStore from '../store/authStore'

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function LoginPage() {
  const navigate   = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPw, setShowPw] = useState(false)
  const [error, setError]   = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }) => {
    setError('')
    try {
      const { data } = await authApi.login(email, password)
      setAuth(
        { id: data.user_id, full_name: data.full_name, email: data.email, role: data.role },
        data.access_token,
      )
      // Redirect based on role
      if (data.role === 'admin')      navigate('/admin')
      else if (data.role === 'instructor') navigate('/instructor')
      else navigate('/student')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-700 to-blue-600
                    flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10
                          backdrop-blur-sm rounded-2xl mb-4">
            <Cpu size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">AI Course Scheduler</h1>
          <p className="text-blue-200 mt-1 text-sm">Department-Level Schedule Generation</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg
                            text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div>
              <label className="label">Email address</label>
              <input
                {...register('email')}
                type="email"
                placeholder="admin@cs.edu"
                className="input"
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="input pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full justify-center py-2.5 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 size={16} className="animate-spin" /> Signing in...</>
              ) : 'Sign in'}
            </button>
          </form>

          {/* Demo accounts hint */}
          <div className="mt-6 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-400 font-medium mb-2">Demo accounts</p>
            <div className="space-y-1 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>admin@cs.edu</span>
                <span className="text-gray-400">Admin</span>
              </div>
              <div className="flex justify-between">
                <span>sara@cs.edu</span>
                <span className="text-gray-400">Instructor</span>
              </div>
              <div className="flex justify-between">
                <span>ali@student.cs.edu</span>
                <span className="text-gray-400">Student</span>
              </div>
              <p className="text-gray-400 mt-1">Password: Password@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}