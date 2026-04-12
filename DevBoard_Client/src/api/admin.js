import api from './axios'

export const getAdminStats = async () => {
  const res = await api.get('/admin/stats')
  return res.data.data
}

export const getAdminUsers = async ({ page = 1, limit = 10, search = '' } = {}) => {
  const res = await api.get('/admin/users', {
    params: { page, limit, search },
  })
  return res.data
}

export const getAdminProjects = async ({ page = 1, limit = 10 } = {}) => {
  const res = await api.get('/admin/projects', {
    params: { page, limit },
  })
  return res.data
}

export const banUser        = async (id) => (await api.patch(`/admin/users/${id}/ban`)).data
export const unbanUser      = async (id) => (await api.patch(`/admin/users/${id}/unban`)).data
export const changeUserRole = async (id, role) => (await api.patch(`/admin/users/${id}/role`, { role })).data
export const deleteUser     = async (id) => (await api.delete(`/admin/users/${id}`)).data