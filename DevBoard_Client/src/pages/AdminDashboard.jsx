import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import UserAvatar from '../components/UserAvatar'
import useAuthStore from '../store/authStore'
import { showSuccess, showError } from '../utils/toast'
import { exportUsersToCSV, exportProjectsToCSV } from '../utils/exportUtils'

import {
  getAdminStats, getAdminUsers, getAdminProjects,
  banUser, unbanUser, changeUserRole, deleteUser,
} from '../api/admin'

const StatCard = ({ label, value, sub, color }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <p className="text-gray-400 text-sm mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color || 'text-white'}`}>{value}</p>
    {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
  </div>
)

const AdminDashboard = () => {
  const navigate      = useNavigate()
  const { user }      = useAuthStore()
  const queryClient   = useQueryClient()

  const [activeTab,   setActiveTab]   = useState('overview')
  const [userSearch,  setUserSearch]  = useState('')
  const [userPage,    setUserPage]    = useState(1)
  const [projPage,    setProjPage]    = useState(1)
  const [actionMsg,   setActionMsg]   = useState('')

  // Queries
  const { data: stats }    = useQuery({ queryKey: ['admin-stats'],                          queryFn: getAdminStats })
  const { data: usersData } = useQuery({ queryKey: ['admin-users', userPage, userSearch],   queryFn: () => getAdminUsers({ page: userPage, limit: 10, search: userSearch }), keepPreviousData: true })
  const { data: projData }  = useQuery({ queryKey: ['admin-projects', projPage],            queryFn: () => getAdminProjects({ page: projPage, limit: 10 }), keepPreviousData: true })

  // Update mutations:
  const banMutation = useMutation({
    mutationFn: banUser,
    onSuccess: (d) => {
      showSuccess(d.message)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err) => showError(err.response?.data?.message || 'Failed to ban user'),
  })

  const unbanMutation = useMutation({
    mutationFn: unbanUser,
    onSuccess: (d) => {
      showSuccess(d.message)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err) => showError(err.response?.data?.message || 'Failed to unban user'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, role }) => changeUserRole(id, role),
    onSuccess: (d) => {
      showSuccess(d.message)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (err) => showError(err.response?.data?.message || 'Failed to change role'),
  })

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: (d) => {
      showSuccess(d.message)
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] })
    },
    onError: (err) => showError(err.response?.data?.message || 'Failed to delete user'),
  })
  const handleBan = (u) => {
    if (!window.confirm(`Ban ${u.name}? They won't be able to login.`)) return
    banMutation.mutate(u._id)
  }

  const handleUnban = (u) => {
    unbanMutation.mutate(u._id)
  }

  const handleRoleChange = (u, role) => {
    if (!window.confirm(`Change ${u.name}'s role to ${role}?`)) return
    roleMutation.mutate({ id: u._id, role })
  }

  const handleDelete = (u) => {
    if (!window.confirm(`DELETE ${u.name}? This removes ALL their projects and tasks. Cannot be undone!`)) return
    deleteMutation.mutate(u._id)
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-1">System management</p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white text-sm transition"
          >
            ← Back
          </button>
        </div>

        {/* Action message */}
        {actionMsg && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-6 flex justify-between">
            <span>{actionMsg}</span>
            <button onClick={() => setActionMsg('')} className="text-green-600 hover:text-green-400">x</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          {['overview', 'users', 'projects'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 text-sm font-medium capitalize transition ${
                activeTab === tab
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            <div>
              <h2 className="text-white font-medium mb-4">Users</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard label="Total users"    value={stats.users.total}    />
                <StatCard label="Verified"        value={stats.users.verified}  color="text-green-400" />
                <StatCard label="Google users"    value={stats.users.google}    color="text-blue-400"  />
                <StatCard label="Banned"          value={stats.users.banned}    color={stats.users.banned > 0 ? 'text-red-400' : 'text-white'} />
                <StatCard label="Joined today"    value={stats.users.today}     color="text-indigo-400" />
              </div>
            </div>

            <div>
              <h2 className="text-white font-medium mb-4">Content</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Total projects"  value={stats.projects.total}         />
                <StatCard label="Projects today"  value={stats.projects.today}          color="text-indigo-400" />
                <StatCard label="Total tasks"     value={stats.tasks.total}             />
                <StatCard label="Completion rate" value={`${stats.tasks.completionRate}%`} color="text-green-400" />
              </div>
            </div>
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div>
            {/* Search */}
            <div className="flex justify-between items-center mb-4">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1) }}
                placeholder="Search by name or email..."
                className="w-full max-w-md bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
              <button
                onClick={() => {
                  const success = exportUsersToCSV(usersData?.data)
                  if (success) showSuccess('Users exported to CSV!')
                  else showError('No users to export')
                }}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm px-4 py-2 rounded-lg transition flex items-center gap-2 ml-3 flex-shrink-0"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Export
              </button>
            </div>

            {/* Users table */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800">
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">User</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 hidden md:table-cell">Joined</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Status</th>
                    <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Role</th>
                    <th className="text-right text-xs text-gray-400 font-medium px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersData?.data?.map((u) => (
                    <tr key={u._id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition">

                      {/* User */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <UserAvatar user={u} size="sm" showOnline={true} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-white text-sm font-medium">{u.name}</p>
                              {u.googleId && (
                                <span className="text-xs bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded">G</span>
                              )}
                              {u._id === user?.id && (
                                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">you</span>
                              )}
                            </div>
                            <p className="text-gray-400 text-xs">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Joined */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-gray-400 text-xs">
                          {new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          u.isBanned
                            ? 'bg-red-500/10 text-red-400'
                            : u.isVerified
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-yellow-500/10 text-yellow-400'
                        }`}>
                          {u.isBanned ? 'banned' : u.isVerified ? 'verified' : 'unverified'}
                        </span>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        {u._id === user?.id ? (
                          <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full">
                            {u.role}
                          </span>
                        ) : (
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u, e.target.value)}
                            className="bg-gray-800 border border-gray-700 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
                          >
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        {u._id !== user?.id && (
                          <div className="flex justify-end gap-2">
                            {u.isBanned ? (
                              <button
                                onClick={() => handleUnban(u)}
                                disabled={unbanMutation.isPending}
                                className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 px-2 py-1 rounded-lg transition"
                              >
                                Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBan(u)}
                                disabled={banMutation.isPending}
                                className="text-xs bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg transition"
                              >
                                Ban
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={deleteMutation.isPending}
                              className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-1 rounded-lg transition"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {usersData && usersData.totalPages > 1 && (
                <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                  <p className="text-gray-400 text-xs">
                    {usersData.total} users total
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUserPage(p => Math.max(1, p - 1))}
                      disabled={userPage === 1}
                      className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white px-3 py-1 rounded-lg transition"
                    >
                      Prev
                    </button>
                    <span className="text-gray-400 text-xs px-2 py-1">
                      {userPage} / {usersData.totalPages}
                    </span>
                    <button
                      onClick={() => setUserPage(p => Math.min(usersData.totalPages, p + 1))}
                      disabled={userPage === usersData.totalPages}
                      className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white px-3 py-1 rounded-lg transition"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Projects tab */}
        {activeTab === 'projects' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Project</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 hidden md:table-cell">Owner</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3">Status</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 hidden md:table-cell">Members</th>
                  <th className="text-left text-xs text-gray-400 font-medium px-4 py-3 hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {projData?.data?.map((p) => (
                  <tr key={p._id} className="border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition">
                    <td className="px-4 py-3">
                      <p className="text-white text-sm font-medium">{p.name}</p>
                      {p.description && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{p.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <UserAvatar user={p.owner} size="sm" showOnline={false} />
                        <div>
                          <p className="text-white text-xs">{p.owner?.name}</p>
                          <p className="text-gray-500 text-xs">{p.owner?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                        p.status === 'active'    ? 'bg-green-500/10 text-green-400'  :
                        p.status === 'completed' ? 'bg-blue-500/10 text-blue-400'   :
                        p.status === 'on-hold'   ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-400 text-xs">{p.members?.length + 1}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-400 text-xs">
                        {new Date(p.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {projData && projData.totalPages > 1 && (
              <div className="flex justify-between items-center px-4 py-3 border-t border-gray-800">
                <p className="text-gray-400 text-xs">{projData.total} projects total</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setProjPage(p => Math.max(1, p - 1))}
                    disabled={projPage === 1}
                    className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white px-3 py-1 rounded-lg transition"
                  >
                    Prev
                  </button>
                  <span className="text-gray-400 text-xs px-2 py-1">
                    {projPage} / {projData.totalPages}
                  </span>
                  <button
                    onClick={() => setProjPage(p => Math.min(projData.totalPages, p + 1))}
                    disabled={projPage === projData.totalPages}
                    className="text-xs bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white px-3 py-1 rounded-lg transition"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  )
}

export default AdminDashboard