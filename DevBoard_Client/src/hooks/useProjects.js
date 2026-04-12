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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      showSuccess(`Project "${data.data.name}" created!`)
    },
    onError: (err) => {
      showError(err.response?.data?.message || 'Failed to create project')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      showSuccess('Project deleted')
    },
    onError: (err) => {
      showError(err.response?.data?.message || 'Failed to delete project')
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