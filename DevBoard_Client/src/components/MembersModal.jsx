import { useState } from 'react'
import api from '../api/axios'
import UserAvatar from './UserAvatar'
import { showSuccess, showError } from '../utils/toast'

const roleColors = {
  admin:  'bg-purple-500/10 text-purple-400',
  editor: 'bg-blue-500/10 text-blue-400',
  viewer: 'bg-gray-500/10 text-gray-400',
}

const MembersModal = ({ project, onClose, onUpdate }) => {
  const [email,        setEmail]        = useState('')
  const [role,         setRole]         = useState('viewer')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError,  setSearchError]  = useState('')
  const [searching,    setSearching]    = useState(false)
  const [adding,       setAdding]       = useState(false)
  const [removingId,   setRemovingId]   = useState(null)
  const [successMsg,   setSuccessMsg]   = useState('')

  const handleSearch = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSearching(true)
    setSearchError('')
    setSearchResult(null)
    setSuccessMsg('')
    try {
      const res = await api.get(`/users/search?email=${email.trim()}`)
      setSearchResult(res.data.data)
    } catch (err) {
      setSearchError(err.response?.data?.message || 'User not found')
    } finally {
      setSearching(false)
    }
  }

  const handleAdd = async () => {
    if (!searchResult) return
    setAdding(true)
    setSuccessMsg('')
    try {
      await api.post(`/projects/${project._id}/members`, {
        userId: searchResult._id,
        role,
      })
      showSuccess(`${searchResult.name} added as ${role}!`)
      setSearchResult(null)
      setEmail('')
      onUpdate()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName} from this project?`)) return
    setRemovingId(userId)
    try {
      await api.delete(`/projects/${project._id}/members/${userId}`)
      showSuccess(`${userName} removed from project`)
      onUpdate()
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to remove member')
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-white font-semibold text-lg">Team Members</h2>
            <p className="text-gray-400 text-sm">{project.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">x</button>
        </div>

        {successMsg && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-4">
            {successMsg}
          </div>
        )}

        {/* Add member */}
        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <h3 className="text-white text-sm font-medium mb-3">Add Member</h3>
          <form onSubmit={handleSearch} className="flex gap-2 mb-3">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setSearchError(''); setSearchResult(null) }}
              placeholder="Search by email address"
              className="flex-1 bg-gray-700 border border-gray-600 text-white placeholder-gray-400 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
            <button
              type="submit"
              disabled={searching || !email.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              {searching ? '...' : 'Search'}
            </button>
          </form>

          {searchError && <p className="text-red-400 text-xs mb-3">{searchError}</p>}

          {searchResult && (
            <div className="bg-gray-700 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserAvatar user={searchResult} size="md" showOnline={true} />
                <div>
                  <p className="text-white text-sm font-medium">{searchResult.name}</p>
                  <p className="text-gray-400 text-xs">{searchResult.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="bg-gray-600 border border-gray-500 text-white rounded-lg px-2 py-1 text-xs focus:outline-none"
                >
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="bg-green-600 hover:bg-green-500 disabled:bg-green-800 text-white px-3 py-1 rounded-lg text-xs transition"
                >
                  {adding ? '...' : 'Add'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Current members */}
        <div>
          <h3 className="text-white text-sm font-medium mb-3">
            Current Members ({project.members.length + 1})
          </h3>

          <div className="space-y-2">

            {/* Owner */}
            <div className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
              <div className="flex items-center gap-3">
                <UserAvatar user={project.owner} size="md" showOnline={true} />
                <div>
                  <p className="text-white text-sm font-medium">{project.owner.name}</p>
                  <p className="text-gray-400 text-xs">{project.owner.email}</p>
                </div>
              </div>
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full">
                owner
              </span>
            </div>

            {/* Members */}
            {project.members.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No members yet. Add someone above.
              </p>
            ) : (
              project.members.map((member) => (
                <div
                  key={member.user._id}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <UserAvatar user={member.user} size="md" showOnline={true} />
                    <div>
                      <p className="text-white text-sm font-medium">{member.user.name}</p>
                      <p className="text-gray-400 text-xs">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${roleColors[member.role]}`}>
                      {member.role}
                    </span>
                    <button
                      onClick={() => handleRemove(member.user._id, member.user.name)}
                      disabled={removingId === member.user._id}
                      className="text-gray-500 hover:text-red-400 transition text-lg leading-none"
                    >
                      x
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MembersModal