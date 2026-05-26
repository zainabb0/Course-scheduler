// frontend/src/api/auth.api.js
import client from './client'

export const authApi = {
  login: (email, password) =>
    client.post('/auth/login', { email, password }),

  getMe: () =>
    client.get('/auth/me'),
}