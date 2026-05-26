// frontend/src/api/courses.api.js
import client from './client'

export const coursesApi = {
  list:   (params) => client.get('/courses', { params }),
  get:    (id)     => client.get(`/courses/${id}`),
  create: (data)   => client.post('/courses', data),
  update: (id, data) => client.put(`/courses/${id}`, data),
  remove: (id)     => client.delete(`/courses/${id}`),
}