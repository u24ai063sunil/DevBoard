import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTaskDetail, useUpdateTask } from '../hooks/useTasks'
import UserAvatar from './UserAvatar'
import api from '../api/axios'
import useAuthStore from '../store/authStore'
import { formatDate } from '../utils/dateUtils'
import { showSuccess, showError } from '../utils/toast'

const activityIcons = {
  'changed status':   '↔',
  'changed priority': '⚑',
  'changed assignee': '→',
}

const statusColors = {
  'todo':        'bg-gray-500/10 text-gray-400',
  'in-progress': 'bg-blue-500/10 text-blue-400',
  'in-review':   'bg-yellow-500/10 text-yellow-400',
  'done':        'bg-green-500/10 text-green-400',
}

const TaskDetailModal = ({ taskId, projectId, onClose }) => {
  const { user }       = useAuthStore()
  const queryClient    = useQueryClient()
  const updateTask     = useUpdateTask(projectId)

  const { data, isLoading } = useTaskDetail(projectId, taskId)
  const task = data?.data

  const [comment,       setComment]       = useState('')
  const [submitting,    setSubmitting]    = useState(false)
  const [activeTab,     setActiveTab]     = useState('comments')

  const handleAddComment = async (e) => {
    e.preventDefault()
    if (!comment.trim()) return
    setSubmitting(true)

    try {
      await api.post(`/projects/${projectId}/tasks/${taskId}/comments`, {
        text: comment.trim(),
      })
      setComment('')
      queryClient.invalidateQueries({ queryKey: ['task', projectId, taskId] })
      queryClient.invalidateQueries({ queryKey: ['tasks', projectId] })
      showSuccess('Comment added!')
    } catch (err) {
      console.error('Comment error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await api.delete(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`)
      queryClient.invalidateQueries({ queryKey: ['task', projectId, taskId] })
      showSuccess('Comment deleted')
    } catch (err) {
      console.error('Delete comment error:', err)
    }
  }

  const handleStatusChange = async (e) => {
    await updateTask.mutateAsync({ id: taskId, data: { status: e.target.value } })
    queryClient.invalidateQueries({ queryKey: ['task', projectId, taskId] })
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : !task ? (
          <div className="p-8 text-center text-red-400">Task not found</div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-800">
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <h2 className="text-white font-semibold text-lg mb-2">{task.title}</h2>
                  {task.description && (
                    <p className="text-gray-400 text-sm">{task.description}</p>
                  )}
                </div>
                <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none shrink-0">
                  x
                </button>
              </div>

              {/* Meta row */}
              <div className="flex flex-wrap gap-3 mt-4">
                <select
                  value={task.status}
                  onChange={handleStatusChange}
                  className={`text-xs px-3 py-1.5 rounded-lg border-0 focus:outline-none cursor-pointer ${statusColors[task.status]}`}
                >
                  {['todo','in-progress','in-review','done'].map((s) => (
                    <option key={s} value={s} className="bg-gray-900 text-white">
                      {s.replace('-', ' ')}
                    </option>
                  ))}
                </select>

                <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg capitalize">
                  {task.priority}
                </span>

                {task.assignee && (
                  <div className="flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
                    <UserAvatar user={task.assignee} size="sm" showOnline={true} />
                    <span className="text-xs text-gray-300">{task.assignee.name}</span>
                  </div>
                )}

                {task.dueDate && (
                  <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1.5 rounded-lg">
                    Due {formatDate(task.dueDate)}
                  </span>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-800">
              {['comments', 'activity'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize transition ${
                    activeTab === tab
                      ? 'text-indigo-400 border-b-2 border-indigo-400'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab}
                  {tab === 'comments' && task.comments?.length > 0 && (
                    <span className="ml-2 text-xs bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded-full">
                      {task.comments.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">

              {/* Comments tab */}
              {activeTab === 'comments' && (
                <div className="space-y-4">

                  {/* Add comment */}
                  <form onSubmit={handleAddComment} className="flex gap-3">
                    <UserAvatar user={user} size="sm" showOnline={false} />
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Add a comment..."
                        className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                      />
                      <button
                        type="submit"
                        disabled={submitting || !comment.trim()}
                        className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        {submitting ? '...' : 'Post'}
                      </button>
                    </div>
                  </form>

                  {/* Comments list */}
                  {task.comments?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No comments yet</p>
                      <p className="text-gray-600 text-xs mt-1">Be the first to comment</p>
                    </div>
                  ) : (
                    task.comments?.map((c) => (
                      <div key={c._id} className="flex gap-3">
                        <UserAvatar user={c.user} size="sm" showOnline={false} />
                        <div className="flex-1">
                          <div className="bg-gray-800 rounded-xl px-4 py-3">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-white text-sm font-medium">
                                {c.user?.name || 'Unknown'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 text-xs">
                                  {new Date(c.createdAt).toLocaleDateString('en-IN', {
                                    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                  })}
                                </span>
                                {(c.user?._id === user?.id || c.user?._id === user?._id) && (
                                  <button
                                    onClick={() => handleDeleteComment(c._id)}
                                    className="text-gray-600 hover:text-red-400 text-xs transition"
                                  >
                                    delete
                                  </button>
                                )}
                              </div>
                            </div>
                            <p className="text-gray-300 text-sm">{c.text}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Activity tab */}
              {activeTab === 'activity' && (
                <div className="space-y-3">
                  {task.activity?.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 text-sm">No activity yet</p>
                      <p className="text-gray-600 text-xs mt-1">Changes will appear here</p>
                    </div>
                  ) : (
                    task.activity?.map((a, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <UserAvatar user={a.user} size="sm" showOnline={false} />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-white text-sm font-medium">
                              {a.user?.name || 'Someone'}
                            </span>
                            <span className="text-gray-400 text-sm">{a.action}</span>
                            {a.oldValue && a.newValue && (
                              <>
                                <span className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded line-through">
                                  {a.oldValue}
                                </span>
                                <span className="text-gray-500 text-xs">→</span>
                                <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                                  {a.newValue}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-gray-600 text-xs mt-0.5">
                            {new Date(a.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default TaskDetailModal