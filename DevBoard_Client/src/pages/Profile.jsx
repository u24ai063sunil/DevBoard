import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import useAuthStore from '../store/authStore'
import { updateAvatar } from '../api/profile'
import api from '../api/axios'

const Profile = () => {
  const navigate               = useNavigate()
  const { user, updateUser }   = useAuthStore()

  const fileInputRef           = useRef(null)

  const [avatarLoading, setAvatarLoading] = useState(false)
  const [avatarError,   setAvatarError]   = useState('')
  const [avatarSuccess, setAvatarSuccess] = useState('')

  const [pwData, setPwData]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError,   setPwError]   = useState('')
  const [pwSuccess, setPwSuccess] = useState('')

  // ── Avatar upload ───────────────────────────────────────────────
  const handleAvatarClick = () => {
    fileInputRef.current.click()
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      return setAvatarError('Only JPG and PNG images are allowed')
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      return setAvatarError('Image must be under 2MB')
    }

    setAvatarLoading(true)
    setAvatarError('')
    setAvatarSuccess('')

    try {
      const res = await updateAvatar(file)
      updateUser({ avatar: res.avatar }) // update store instantly
      setAvatarSuccess('Avatar updated successfully!')
    } catch (err) {
      setAvatarError(err.response?.data?.message || 'Failed to upload avatar')
    } finally {
      setAvatarLoading(false)
    }
  }

  // ── Password change ─────────────────────────────────────────────
  const handlePwChange = (e) => {
    setPwData({ ...pwData, [e.target.name]: e.target.value })
    setPwError('')
    setPwSuccess('')
  }

  const handlePwSubmit = async (e) => {
    e.preventDefault()
    setPwError('')
    setPwSuccess('')

    if (pwData.newPassword !== pwData.confirmPassword) {
      return setPwError('New passwords do not match')
    }
    if (pwData.newPassword.length < 8) {
      return setPwError('Password must be at least 8 characters')
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(pwData.newPassword)) {
      return setPwError('Password must contain uppercase, lowercase and a number')
    }

    setPwLoading(true)
    try {
      await api.patch('/auth/change-password', {
        currentPassword: pwData.currentPassword,
        newPassword: pwData.newPassword,
      })
      setPwSuccess('Password changed successfully!')
      setPwData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      setPwError(err.response?.data?.message || 'Failed to change password')
    } finally {
      setPwLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-2xl mx-auto px-6 py-8">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-2 transition"
        >
          ← Back to dashboard
        </button>

        <h1 className="text-2xl font-bold text-white mb-8">My Profile</h1>

        {/* ── Avatar section ─────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-6">Profile Picture</h2>

          <div className="flex items-center gap-6">

            {/* Avatar preview */}
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-indigo-600 flex items-center justify-center flex-shrink-0">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Loading overlay */}
              {avatarLoading && (
                <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                </div>
              )}
            </div>

            {/* Upload button + info */}
            <div className="flex-1">
              <p className="text-gray-300 font-medium mb-1">{user?.name}</p>
              <p className="text-gray-500 text-sm mb-4">{user?.email}</p>

              <button
                onClick={handleAvatarClick}
                disabled={avatarLoading}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white text-sm px-4 py-2 rounded-lg transition"
              >
                {avatarLoading ? 'Uploading...' : 'Change photo'}
              </button>

              <p className="text-gray-500 text-xs mt-2">
                JPG or PNG, max 2MB
              </p>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Messages */}
          {avatarError && (
            <div className="mt-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {avatarError}
            </div>
          )}
          {avatarSuccess && (
            <div className="mt-4 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3">
              {avatarSuccess}
            </div>
          )}
        </div>

        {/* ── Account info ───────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-semibold mb-6">Account Info</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Full name</label>
              <p className="text-white bg-gray-800 rounded-lg px-4 py-3 text-sm">
                {user?.name}
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Email address</label>
              <p className="text-white bg-gray-800 rounded-lg px-4 py-3 text-sm">
                {user?.email}
              </p>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Role</label>
              <p className="text-white bg-gray-800 rounded-lg px-4 py-3 text-sm capitalize">
                {user?.role}
              </p>
            </div>
          </div>
        </div>

        {/* ── Change password ────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
          <h2 className="text-white font-semibold mb-6">Change Password</h2>

          {pwError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
              {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">
              {pwSuccess}
            </div>
          )}

          <form onSubmit={handlePwSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Current password
              </label>
              <input
                type="password"
                name="currentPassword"
                value={pwData.currentPassword}
                onChange={handlePwChange}
                placeholder="••••••••"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                New password
              </label>
              <input
                type="password"
                name="newPassword"
                value={pwData.newPassword}
                onChange={handlePwChange}
                placeholder="Min 8 chars, uppercase, number"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Confirm new password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={pwData.confirmPassword}
                onChange={handlePwChange}
                placeholder="••••••••"
                required
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit"
              disabled={pwLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium rounded-lg px-4 py-3 text-sm transition"
            >
              {pwLoading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        </div>

      </main>
    </div>
  )
}

export default Profile