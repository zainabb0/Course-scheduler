// frontend/src/api/ai.api.js
import client from './client'

export const aiApi = {
  generate:   (data) => client.post('/ai/generate', data),
  getStatus:  (id)   => client.get(`/ai/status/${id}`),
  getTimeSlots: ()   => client.get('/ai/time-slots'),
}