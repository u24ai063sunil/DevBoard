import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import CreateTaskModal from '../components/CreateTaskModal'
import { useProject, useTasks } from '../hooks/useTasks'

const statusColumns = ['todo', 'in-progress', 'in-review', 'done']

const columnLabels = {
  'todo':        'Todo',
  'in-progress': 'In Progress',
  'in-review':   'In Review',
  'done':        'Done',
}

const columnColors = {
  'todo':        'border-gray-700',
  'in-progress': 'border-blue-500/30',
  'in-review':   'border-yellow-500/30',
  'done':        'border-green-500/30',
}

const ProjectDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')

  const { data: projectData, isLoading: projectLoading } = useProject(id)
  const { data: tasksData,   isLoading: tasksLoading   } = useTasks(id)

  const project = projectData?.data
  const tasks   = tasksData?.data || []

  // Filter tasks
  const filteredTasks = filter === 'all'
    ? tasks
    : tasks.filter((t) => t.status === filter)

  // Group tasks by status for kanban view
  const tasksByStatus = statusColumns.reduce((acc, status) => {
    acc[status] = tasks.filter((t) => t.status === status)
    return acc
  }, {})

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-800 rounded w-1/3"/>
            <div className="h-4 bg-gray-800 rounded w-1/2"/>
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-950">
        <Navbar />
        <div className="text-center py-16">
          <p className="text-red-400">Project not found</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-indigo-400 hover:text-indigo-300 text-sm"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-2 transition"
        >
          ← Back to projects
        </button>

        {/* Project header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{project.name}</h1>
            {project.description && (
              <p className="text-gray-400 text-sm">{project.description}</p>
            )}
            <div className="flex gap-2 mt-3">
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full">
                {project.status}
              </span>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                {tasks.length} task{tasks.length !== 1 ? 's' : ''}
              </span>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                {tasks.filter(t => t.status === 'done').length} done
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Add Task
          </button>
        </div>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Progress</span>
              <span>{Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{
                  width: `${(tasks.filter(t => t.status === 'done').length / tasks.length) * 100}%`
                }}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!tasksLoading && tasks.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-white font-medium mb-2">No tasks yet</h3>
            <p className="text-gray-400 text-sm mb-6">Add your first task to get started</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition"
            >
              Add task
            </button>
          </div>
        )}

        {/* Kanban board */}
        {tasks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusColumns.map((status) => (
              <div key={status} className={`bg-gray-900 border ${columnColors[status]} rounded-xl p-4`}>

                {/* Column header */}
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-300">
                    {columnLabels[status]}
                  </h3>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                    {tasksByStatus[status].length}
                  </span>
                </div>

                {/* Tasks in column */}
                <div className="space-y-3">
                  {tasksByStatus[status].length === 0 ? (
                    <p className="text-gray-600 text-xs text-center py-4">No tasks</p>
                  ) : (
                    tasksByStatus[status].map((task) => (
                      <TaskCard key={task._id} task={task} projectId={id} />
                    ))
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {showModal && (
        <CreateTaskModal
          projectId={id}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}

export default ProjectDetail