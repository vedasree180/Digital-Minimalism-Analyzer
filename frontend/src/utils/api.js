import axios from 'axios'

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Usage Logs
export const createLog = (data) => API.post('/usage', data)
export const getLogs = (userId, days = 7) => API.get(`/usage/${userId}?days=${days}`)
export const deleteLog = (id) => API.delete(`/usage/${id}`)

// Analysis
export const getAnalysis = (userId) => API.get(`/analysis/${userId}`)
export const getRecommendations = (userId) => API.get(`/analysis/${userId}/recommendations`)
export const getRiskScore = (data) => API.post('/analysis/risk', data)
export const getWeeklyTrend = (userId) => API.get(`/analysis/${userId}/trend`)

// Users
export const getOrCreateUser = (name) => API.post('/users', { name })

export default API
