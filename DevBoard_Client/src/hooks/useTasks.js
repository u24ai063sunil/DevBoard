import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'

// Fetch all tasks for a project
export const useTasks = (projectId) => {
  return useQuery({
    queryKey: ['tasks', projectId],
    queryFn: async () => {
      const res = await api.get(`/projects/${projectId}/tasks`)
      return res.data
    },
    enabled: !!projectId, // only run if projectId exists
  })
}

// Fetch single project
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

// Create task
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

// Update task
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

// Delete task
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