import api from './axios'

export const getOverview        = async () => (await api.get('/analytics/overview')).data.data
export const getTasksByStatus   = async () => (await api.get('/analytics/tasks-by-status')).data.data
export const getTasksByPriority = async () => (await api.get('/analytics/tasks-by-priority')).data.data
export const getTasksOverTime   = async () => (await api.get('/analytics/tasks-over-time')).data.data
export const getProjectProgress = async () => (await api.get('/analytics/project-progress')).data.data