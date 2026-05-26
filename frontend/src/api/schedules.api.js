// frontend/src/api/schedules.api.js
import client from './client'

export const schedulesApi = {
  list:    (params)      => client.get('/schedules', { params }),
  get:     (id)          => client.get(`/schedules/${id}`),
  remove:  (id)          => client.delete(`/schedules/${id}`),

  getEntries: (id, params) => client.get(`/schedules/${id}/entries`, { params }),
  editEntry:  (id, entryId, data) =>
    client.put(`/schedules/${id}/entries/${entryId}`, data),

  getLogs: (id) => client.get(`/schedules/${id}/logs`),
}