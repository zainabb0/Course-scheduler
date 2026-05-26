// frontend/src/store/authStore.js
import { create } from 'zustand'

const useAuthStore = create((set) => ({
  // ── State ──────────────────────────────────────────────────────
  user:  JSON.parse(localStorage.getItem('user')  || 'null'),
  token: localStorage.getItem('access_token') || null,

  // ── Actions ────────────────────────────────────────────────────
  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user))
    localStorage.setItem('access_token', token)
    set({ user, token })
  },

  logout: () => {
    localStorage.removeItem('user')
    localStorage.removeItem('access_token')
    set({ user: null, token: null })
  },

  // ── Selectors (computed) ───────────────────────────────────────
  isAuthenticated: () => !!localStorage.getItem('access_token'),
  isAdmin:         () => JSON.parse(localStorage.getItem('user') || '{}')?.role === 'admin',
  isInstructor:    () => JSON.parse(localStorage.getItem('user') || '{}')?.role === 'instructor',
  isStudent:       () => JSON.parse(localStorage.getItem('user') || '{}')?.role === 'student',
}))

export default useAuthStore