import { useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { getDueDateStatus, formatDate } from '../utils/dateUtils'

const statusOptions = ['todo', 'in-progress', 'in-review', 'done']

const priorityColors = {
  low:      'bg-gray-500/10 text-gray-400',
  medium:   'bg-yellow-500/10 text-yellow-400',
  high:     'bg-orange-500/10 text-orange-400',
  critical: 'bg-red-500/10 text-red-400',
}

const statusColors = {
  'todo':        'bg-gray-500/10 text-gray-400',
  'in-progress': 'bg-blue-500/10 text-blue-400',
  'in-review':   'bg-yellow-500/10 text-yellow-400',
  'done':        'bg-green-500/10 text-green-400',
}

const dueDateColors = {
  overdue: 'bg-red-500/10 text-red-400 border border-red-500/20',
  today:   'bg-orange-500/10 text-orange-400 border border-orange-500/20',
  soon:    'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
  normal:  'bg-gray-500/10 text-gray-400',
}

const TaskCard = ({ task, projectId }) => {
  const updateTask = useUpdateTask(projectId)
  const deleteTask = useDeleteTask(projectId)

  const dueDateStatus = getDueDateStatus(task.dueDate, task.status)

  const handleStatusChange = async (e) => {
    await updateTask.mutateAsync({ id: task._id, data: { status: e.target.value } })
  }

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${task.title}"?`)) {
      await deleteTask.mutateAsync(task._id)
    }
  }

  return (
    <div className={`bg-gray-900 border rounded-xl p-4 transition ${
      dueDateStatus?.type === 'overdue'
        ? 'border-red-500/30 hover:border-red-500/50'
        : 'border-gray-800 hover:border-gray-700'
    }`}>

      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4 className={`text-sm font-medium flex-1 ${
          task.status === 'done' ? 'line-through text-gray-500' : 'text-white'
        }`}>
          {task.title}
        </h4>
        <button
          onClick={handleDelete}
          disabled={deleteTask.isPending}
          className="text-gray-600 hover:text-red-400 transition text-lg leading-none flex-shrink-0"
        >
          ×
        </button>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-gray-400 text-xs mb-3 line-clamp-2">{task.description}</p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        {task.estimatedHours && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-400">
            {task.estimatedHours}h
          </span>
        )}
        {task.assignee && (
          <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/10 text-indigo-400">
            {task.assignee.name}
          </span>
        )}
      </div>

      {/* Due date alert */}
      {dueDateStatus && (
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg mb-3 w-fit ${dueDateColors[dueDateStatus.type]}`}>
          {dueDateStatus.type === 'overdue' && <span>!</span>}
          {dueDateStatus.type === 'today'   && <span>!</span>}
          <span>{dueDateStatus.label}</span>
        </div>
      )}

      {/* Due date (normal display) */}
      {task.dueDate && !dueDateStatus && task.status === 'done' && (
        <p className="text-gray-500 text-xs mb-3">
          Due {formatDate(task.dueDate)}
        </p>
      )}

      {/* Status dropdown */}
      <select
        value={task.status}
        onChange={handleStatusChange}
        disabled={updateTask.isPending}
        className={`w-full text-xs px-3 py-2 rounded-lg border-0 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${statusColors[task.status]}`}
      >
        {statusOptions.map((s) => (
          <option key={s} value={s} className="bg-gray-900 text-white">
            {s.charAt(0).toUpperCase() + s.slice(1).replace('-', ' ')}
          </option>
        ))}
      </select>

      {/* Completed date */}
      {task.completedAt && (
        <p className="text-gray-500 text-xs mt-2">
          Done {formatDate(task.completedAt)}
        </p>
      )}
    </div>
  )
}

export default TaskCard