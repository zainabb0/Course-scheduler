// frontend/src/api/departments.api.js
import client from './client'

export const departmentsApi = {
  list:   ()           => client.get('/departments'),
  get:    (id)         => client.get(`/departments/${id}`),
  create: (data)       => client.post('/departments', data),
  update: (id, data)   => client.put(`/departments/${id}`, data),
  remove: (id)         => client.delete(`/departments/${id}`),

  listYears:   (deptId)         => client.get(`/departments/${deptId}/study-years`),
  addYear:     (deptId, data)   => client.post(`/departments/${deptId}/study-years`, data),
  updateYear:  (deptId, yrId, data) => client.put(`/departments/${deptId}/study-years/${yrId}`, data),
  removeYear:  (deptId, yrId)   => client.delete(`/departments/${deptId}/study-years/${yrId}`),
}