// frontend/src/api/classrooms.api.js
import client from './client'

export const classroomsApi = {
  list:   (params) => client.get('/classrooms', { params }),
  get:    (id)     => client.get(`/classrooms/${id}`),
  create: (data)   => client.post('/classrooms', data),
  update: (id, data) => client.put(`/classrooms/${id}`, data),
  remove: (id)     => client.delete(`/classrooms/${id}`),
}