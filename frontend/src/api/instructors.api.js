// frontend/src/api/instructors.api.js
import client from './client'

export const instructorsApi = {
  list:   (params)     => client.get('/instructors', { params }),
  get:    (id)         => client.get(`/instructors/${id}`),
  create: (data)       => client.post('/instructors', data),
  update: (id, data)   => client.put(`/instructors/${id}`, data),
  remove: (id)         => client.delete(`/instructors/${id}`),

  getPreferences:    (id)       => client.get(`/instructors/${id}/preferences`),
  updatePreferences: (id, data) => client.put(`/instructors/${id}/preferences`, data),

  getAvailability:   (id)       => client.get(`/instructors/${id}/availability`),
  updateAvailability:(id, data) => client.put(`/instructors/${id}/availability`, data),
}