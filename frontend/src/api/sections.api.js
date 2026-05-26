// frontend/src/api/sections.api.js
import client from './client'

export const sectionsApi = {
  listSections:    (params) => client.get('/course-sections/sections', { params }),
  createSection:   (data)   => client.post('/course-sections/sections', data),
  updateSection:   (id, data) => client.put(`/course-sections/sections/${id}`, data),
  removeSection:   (id)     => client.delete(`/course-sections/sections/${id}`),

  listAssignments:  (params) => client.get('/course-sections/assignments', { params }),
  createAssignment: (data)   => client.post('/course-sections/assignments', data),
  updateAssignment: (id, data) => client.put(`/course-sections/assignments/${id}`, data),
  removeAssignment: (id)     => client.delete(`/course-sections/assignments/${id}`),
}