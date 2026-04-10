import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

export const useTasks = (projectId, params = {}) => {
  return useQuery({
    queryKey: ['tasks', projectId, params],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/tasks`, { params })
      return res.data
    },
    enabled: !!projectId,
  })
}

export const useProject = (projectId) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}`)
      return res.data
    },
    enabled: !!projectId,
  })
}

export const useCreateTask = (projectId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/projects/${projectId}/tasks`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })
}

export const useUpdateTask = (projectId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.patch(`/projects/${projectId}/tasks/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })
}

export const useDeleteTask = (projectId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (taskId) => {
      const res = await api.delete(`/projects/${projectId}/tasks/${taskId}`)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
    },
  })
}
export const useTaskDetail = (projectId, taskId) => {
  return useQuery({
    queryKey: ['task', projectId, taskId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/tasks/${taskId}`)
      return res.data
    },
    enabled: !!projectId && !!taskId,
  })
}