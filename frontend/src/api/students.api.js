// frontend/src/api/students.api.js
import client from './client'

export const studentsApi = {
  list:   (params) => client.get('/students', { params }),
  get:    (id)     => client.get(`/students/${id}`),
  create: (data)   => client.post('/students', data),
  update: (id, data) => client.put(`/students/${id}`, data),
  remove: (id)     => client.delete(`/students/${id}`),

  listEnrollments:  (id)       => client.get(`/students/${id}/enrollments`),
  enroll:           (id, data) => client.post(`/students/${id}/enrollments`, data),
  removeEnrollment: (id, enrId) => client.delete(`/students/${id}/enrollments/${enrId}`),
}