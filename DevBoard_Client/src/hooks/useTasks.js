import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { showSuccess, showError } from '../utils/toast'

export const useTasks = (projectId, params = {}) => {
  return useQuery({
    queryKey: ['tasks', projectId, params],
    queryFn:  async () => {
      const res = await api.get(`/projects/${projectId}/tasks`, { params })
      return res.data
    },
    enabled: !!projectId,
  })
}

export const useProject = (projectId) => {
  return useQuery({
    queryKey: ['project', projectId],
    queryFn:  async () => {
      const res = await api.get(`/projects/${projectId}`)
      return res.data
    },
    enabled: !!projectId,
  })
}

export const useTaskDetail = (projectId, taskId) => {
  return useQuery({
    queryKey: ['task', projectId, taskId],
    queryFn:  async () => {
      const res = await api.get(`/projects/${projectId}/tasks/${taskId}`)
      return res.data
    },
    enabled: !!projectId && !!taskId,
  })
}

export const useCreateTask = (projectId) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post(`/projects/${projectId}/tasks`, data)
      return res.data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      showSuccess(`Task "${data.data.title}" created!`)
    },
    onError: (err) => {
      showError(err.response?.data?.message || 'Failed to create task')
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

    // Optimistically update cache BEFORE server responds
    onMutate: async ({ id, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['tasks', projectId] })

      // Snapshot current data for rollback
      const previousTasks = queryClient.getQueryData(['tasks', projectId])

      // Optimistically update the cache
      queryClient.setQueryData(['tasks', projectId], (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((task) =>
            task._id === id
              ? { ...task, ...data }
              : task
          ),
        }
      })

      // Return snapshot for rollback
      return { previousTasks }
    },

    // If mutation fails — roll back to previous data
    onError: (err, variables, context) => {
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks', projectId], context.previousTasks)
      }
      showError(err.response?.data?.message || 'Failed to update task')
    },

    // Always refetch after success or failure
    onSettled: () => {
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
      showSuccess('Task deleted')
    },
    onError: (err) => {
      showError(err.response?.data?.message || 'Failed to delete task')
    },
  })
}