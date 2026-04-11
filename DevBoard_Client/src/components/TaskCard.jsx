import { useUpdateTask, useDeleteTask } from '../hooks/useTasks'
import { getDueDateStatus, formatDate } from '../utils/dateUtils'
import TaskAttachments from './TaskAttachments'
import { useEffect, useRef, useState } from 'react'
import EditTaskModal from './EditTaskModal'
import TaskDetailModal from './TaskDetailModal'
import { CATEGORY_COLORS } from '../utils/labelColors'

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
  const updateTask    = useUpdateTask(projectId)
  const deleteTask    = useDeleteTask(projectId)
  const dueDateStatus = getDueDateStatus(task.dueDate, task.status)
  const [justUpdated, setJustUpdated] = useState(false)
  const prevStatusRef = useRef(task.status)

  useEffect(() => {
    if (prevStatusRef.current !== task.status) {
      setJustUpdated(true)
      const timer = setTimeout(() => setJustUpdated(false), 1500)
      prevStatusRef.current = task.status
      return () => clearTimeout(timer)
    }
  }, [task.status])
  const handleStatusChange = async (e) => {
    await updateTask.mutateAsync({ id: task._id, data: { status: e.target.value } })
  }
  const [showEdit, setShowEdit] = useState(false)
  const handleDelete = async (e) => {
    e.stopPropagation()
    if (window.confirm(`Delete "${task.title}"?`)) {
      await deleteTask.mutateAsync(task._id)
    }
  }
  const [showDetail, setShowDetail] = useState(false)
  return (
    <div className={`border rounded-xl p-4 transition-all duration-300 ${
        justUpdated
          ? 'bg-indigo-500/10 border-indigo-500/30'
          : dueDateStatus?.type === 'overdue'
            ? 'bg-gray-900 border-red-500/30 hover:border-red-500/50'
            : 'bg-gray-900 border-gray-800 hover:border-gray-700'
      }`}>

      {/* Header */}
      <div className="flex justify-between items-start gap-2 mb-2">
        <h4
          onClick={() => setShowDetail(true)}
          className={`text-sm font-medium flex-1 cursor-pointer hover:text-indigo-400 transition ${
            task.status === 'done' ? 'line-through text-gray-500' : 'text-white'
          }`}
        >
          {task.title}
        </h4>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowEdit(true)}
            className="text-gray-600 hover:text-indigo-400 transition text-xs px-1"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteTask.isPending}
            className="text-gray-600 hover:text-red-400 transition text-lg leading-none"
          >
            x
          </button>
        </div>
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
      {/* Category badge */}
      {task.category && task.category !== 'other' && (
        <span className={`text-xs px-2 py-1 rounded-full capitalize ${
          CATEGORY_COLORS[task.category]?.bg || 'bg-gray-500/10'
        } ${
          CATEGORY_COLORS[task.category]?.text || 'text-gray-400'
        }`}>
          {task.category}
        </span>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.labels.map((label) => (
            <span
              key={label.name}
              className="text-xs px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: label.color + '22',
                border:          `1px solid ${label.color}55`,
                color:           label.color,
              }}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
      {/* Due date alert */}
      {dueDateStatus && (
        <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-lg mb-3 w-fit ${dueDateColors[dueDateStatus.type]}`}>
          {dueDateStatus.type === 'overdue' && <span>!</span>}
          {dueDateStatus.type === 'today'   && <span>!</span>}
          <span>{dueDateStatus.label}</span>
        </div>
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

      {/* Attachments — shows upload button + existing files */}
      <div className="border-t border-gray-800 mt-3 pt-3">
        <TaskAttachments task={task} projectId={projectId} />
      </div>
      {showEdit && (
        <EditTaskModal
          task={task}
          projectId={projectId}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showDetail && (
        <TaskDetailModal
          taskId={task._id}
          projectId={projectId}
          onClose={() => setShowDetail(false)}
        />
      )}
    </div>
  )
}

export default TaskCard