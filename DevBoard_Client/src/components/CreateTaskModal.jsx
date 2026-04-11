import { useState } from 'react'
import { useCreateTask } from '../hooks/useTasks'
import api from '../api/axios'
import LabelPicker from './LabelPicker'

const CreateTaskModal = ({ projectId, onClose }) => {
  const createTask = useCreateTask(projectId)
  const [labels,   setLabels]   = useState([])
  const [category, setCategory] = useState('other')
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    status: 'todo',
    estimatedHours: '',
    dueDate: '',
  })

  const [assigneeEmail,  setAssigneeEmail]  = useState('')
  const [assigneeResult, setAssigneeResult] = useState(null)
  const [searchingUser,  setSearchingUser]  = useState(false)
  const [searchError,    setSearchError]    = useState('')
  const [error,          setError]          = useState('')

  const today = new Date().toISOString().split('T')[0]

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSearchAssignee = async () => {
    if (!assigneeEmail.trim()) return
    setSearchingUser(true)
    setSearchError('')
    setAssigneeResult(null)

    try {
      const res = await api.get(`/users/search?email=${assigneeEmail.trim()}`)
      setAssigneeResult(res.data.data)
    } catch (err) {
      setSearchError(err.response?.data?.message || 'User not found')
    } finally {
      setSearchingUser(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return setError('Task title is required')

    if (formData.dueDate) {
      const due   = new Date(formData.dueDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (due < today) return setError('Due date cannot be in the past')
    }

    try {
      const payload = {
        ...formData,
        estimatedHours: formData.estimatedHours ? Number(formData.estimatedHours) : undefined,
        dueDate:        formData.dueDate || undefined,
        assignee:       assigneeResult?._id || undefined,
        labels,
        category,
      }
      await createTask.mutateAsync(payload)
      onClose()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task')
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white font-semibold text-lg">New Task</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-2xl leading-none">x</button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Task title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Build login page"
              autoFocus
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Task details..."
              rows={2}
              className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Priority + Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              >
                <option value="todo">Todo</option>
                <option value="in-progress">In Progress</option>
                <option value="in-review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          {/* Due date + Estimated hours */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Due date</label>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                min={today}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Est. hours</label>
              <input
                type="number"
                name="estimatedHours"
                value={formData.estimatedHours}
                onChange={handleChange}
                placeholder="e.g. 4"
                min="0"
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
          </div>
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
            >
              {['feature','bug','improvement','documentation','testing','design','other'].map((c) => (
                <option key={c} value={c} className="capitalize">{c}</option>
              ))}
            </select>
          </div>

          {/* Labels */}
          <LabelPicker selectedLabels={labels} onChange={setLabels} />
          {/* Assign to user */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assign to
            </label>

            {/* Show selected assignee */}
            {assigneeResult ? (
              <div className="flex items-center justify-between bg-gray-800 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-medium">
                      {assigneeResult.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-white text-sm">{assigneeResult.name}</p>
                    <p className="text-gray-400 text-xs">{assigneeResult.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { setAssigneeResult(null); setAssigneeEmail('') }}
                  className="text-gray-500 hover:text-red-400 text-sm transition"
                >
                  x
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={assigneeEmail}
                  onChange={(e) => { setAssigneeEmail(e.target.value); setSearchError('') }}
                  placeholder="Search by email"
                  className="flex-1 bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={handleSearchAssignee}
                  disabled={searchingUser || !assigneeEmail.trim()}
                  className="bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm transition"
                >
                  {searchingUser ? '...' : 'Find'}
                </button>
              </div>
            )}

            {searchError && (
              <p className="text-red-400 text-xs mt-1">{searchError}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg px-4 py-3 text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createTask.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white rounded-lg px-4 py-3 text-sm font-medium transition"
            >
              {createTask.isPending ? 'Creating...' : 'Create task'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}

export default CreateTaskModal