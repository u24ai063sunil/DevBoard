import api from './axios'

export const getProfile = async () => {
  const res = await api.get('/auth/me')
  return res.data
}

export const updateAvatar = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)

  const res = await api.patch('/users/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return res.data
}