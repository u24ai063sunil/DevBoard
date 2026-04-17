import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../api/axios'
import { showSuccess, showError } from '../utils/toast'

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn:  async () => {
      const res = await api.get('/projects')
      return res.data
    },
  })
}

export const useCreateProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data) => {
      const res = await api.post('/projects', data)
      return res.data
    },

    onMutate: async (newProject) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })

      const previousProjects = queryClient.getQueryData(['projects'])

      // Add temp project to cache immediately
      queryClient.setQueryData(['projects'], (old) => {
        if (!old) return old
        const tempProject = {
          _id:         'temp-' + Date.now(),
          ...newProject,
          owner:       { name: 'You' },
          members:     [],
          createdAt:   new Date().toISOString(),
          status:      newProject.status || 'active',
          priority:    newProject.priority || 'medium',
        }
        return {
          ...old,
          data:  [tempProject, ...old.data],
          total: old.total + 1,
          count: old.count + 1,
        }
      })

      return { previousProjects }
    },

    onError: (err, variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
      }
      showError(err.response?.data?.message || 'Failed to create project')
    },

    onSuccess: (data) => {
      showSuccess(`Project "${data.data.name}" created!`)
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useDeleteProject = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId) => {
      const res = await api.delete(`/projects/${projectId}`)
      return res.data
    },

    onMutate: async (projectId) => {
      await queryClient.cancelQueries({ queryKey: ['projects'] })

      const previousProjects = queryClient.getQueryData(['projects'])

      // Remove from cache immediately
      queryClient.setQueryData(['projects'], (old) => {
        if (!old) return old
        return {
          ...old,
          data:  old.data.filter((p) => p._id !== projectId),
          total: old.total - 1,
          count: old.count - 1,
        }
      })

      return { previousProjects }
    },

    onError: (err, variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects)
      }
      showError(err.response?.data?.message || 'Failed to delete project')
    },

    onSuccess: () => {
      showSuccess('Project deleted')
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
    },
  })
}

export const useUpdateProject = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await api.patch(`/projects/${id}`, data)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      showSuccess('Project updated!')
    },
    onError: (err) => {
      showError(err.response?.data?.message || 'Failed to update project')
    },
  })
}