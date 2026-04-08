import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import TaskCard from '../components/TaskCard'
import CreateTaskModal from '../components/CreateTaskModal'
import TaskFilters from '../components/TaskFilters'
import { useProject, useTasks } from '../hooks/useTasks'
import MembersModal from '../components/MembersModal'
import { useQueryClient } from '@tanstack/react-query'
import { getDueDateStatus } from '../utils/dateUtils'
import { useEffect } from 'react'
import { joinProjectRoom, leaveProjectRoom, getSocket } from '../socket/useSocket'
import UserAvatar from '../components/UserAvatar'
import usePresenceStore from '../store/presenceStore'

const statusColumns = ['todo', 'in-progress', 'in-review', 'done']
const columnLabels  = { 'todo': 'Todo', 'in-progress': 'In Progress', 'in-review': 'In Review', 'done': 'Done' }
const columnColors  = { 'todo': 'border-gray-700', 'in-progress': 'border-blue-500/30', 'in-review': 'border-yellow-500/30', 'done': 'border-green-500/30' }

const ProjectDetail = () => {
  const { id } = useParams()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (id) {
      joinProjectRoom(id)
      console.log('Joined project room:', id)
    }

    return () => {
      if (id) leaveProjectRoom(id)
    }
  }, [id])

  const [liveConnected, setLiveConnected] = useState(false)
  const [viewerCount, setViewerCount] = useState(1)

  useEffect(() => {
    if (!id) return

    joinProjectRoom(id)

    // Check if socket connected
    const socket = getSocket()
    if (socket?.connected) setLiveConnected(true)

    const handleConnect    = () => setLiveConnected(true)
    const handleDisconnect = () => setLiveConnected(false)

    socket?.on('connect',    handleConnect)
    socket?.on('disconnect', handleDisconnect)
    socket?.on('room:members', ({ projectId: pid, count }) => {
      if (pid === id) setViewerCount(count)
    })
    return () => {
      leaveProjectRoom(id)
      socket?.off('connect',    handleConnect)
      socket?.off('disconnect', handleDisconnect)
    }
  }, [id])
  const navigate = useNavigate()

  const [showModal, setShowModal] = useState(false)
  const [search,    setSearch]    = useState('')
  const [priority,  setPriority]  = useState('')
  const [status,    setStatus]    = useState('')

  const { data: projectData, isLoading: projectLoading } = useProject(id)
  const { data: tasksData,   isLoading: tasksLoading   } = useTasks(id)

  const project  = projectData?.data
  const allTasks = useMemo(() => tasksData?.data || [], [tasksData])
  // const queryClient  = useQueryClient()
  const [showMembers, setShowMembers] = useState(false)
  const handleMembersUpdate = () => {
    queryClient.invalidateQueries({ queryKey: ['project', id] })
  }
  // Client-side filtering (instant, no API call)
  const filteredTasks = useMemo(() => {
    return allTasks.filter((task) => {
      const matchSearch   = !search   || task.title.toLowerCase().includes(search.toLowerCase()) || task.description?.toLowerCase().includes(search.toLowerCase())
      const matchPriority = !priority || task.priority === priority
      const matchStatus   = !status   || task.status === status
      return matchSearch && matchPriority && matchStatus
    })
  }, [allTasks, search, priority, status])

  // Group filtered tasks by status for kanban
  const tasksByStatus = statusColumns.reduce((acc, s) => {
    acc[s] = filteredTasks.filter((t) => t.status === s)
    return acc
  }, {})
  const onlineUsers = usePresenceStore((s) => s.onlineUsers)

  const onlineMembers = project
    ? [
        project.owner,
        ...project.members.map((m) => m.user),
      ].filter((u) => u && onlineUsers.has(u._id || u))
    : []
  const doneCount  = allTasks.filter((t) => t.status === 'done').length
  const progress   = allTasks.length ? Math.round((doneCount / allTasks.length) * 100) : 0
  const isFiltered = search || priority || status
  const overdueCount = allTasks.filter(t =>
    getDueDateStatus(t.dueDate, t.status)?.type === 'overdue'
  ).length

  const dueTodayCount = allTasks.filter(t =>
    getDueDateStatus(t.dueDate, t.status)?.type === 'today'
  ).length
  if (projectLoading) {
    return (
      <div className="min-h-screen transition-colors duration-200"
     style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Navbar />
        <div className="max-w-6xl mx-auto px-6 py-8 animate-pulse space-y-4">
          <div className="h-8 bg-gray-800 rounded w-1/3"/>
          <div className="h-4 bg-gray-800 rounded w-1/2"/>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen transition-colors duration-200"
     style={{ backgroundColor: 'var(--bg-primary)' }}>
        <Navbar />
        <div className="text-center py-16">
          <p className="text-red-400 mb-4">Project not found</p>
          <button onClick={() => navigate('/dashboard')} className="text-indigo-400 hover:text-indigo-300 text-sm">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen transition-colors duration-200"
     style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Back */}
        <button
          onClick={() => navigate('/dashboard')}
          className="text-gray-400 hover:text-white text-sm mb-6 flex items-center gap-2 transition"
        >
          ← Back to projects
        </button>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">{project.name}</h1>
            {/* Live indicator */}
            <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full ${
              liveConnected
                ? 'bg-green-500/10 text-green-400'
                : 'bg-gray-500/10 text-gray-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                liveConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-500'
              }`}/>
              {liveConnected ? 'Live' : 'Offline'}
            </div>
            {viewerCount > 1 && (
              <span className="text-xs text-gray-500">
                {viewerCount} viewing
              </span>
            )}
            {project.description && (
              <p className="text-gray-400 text-sm">{project.description}</p>
            )}
            <div className="flex gap-2 mt-3">
              <span className="text-xs bg-indigo-500/10 text-indigo-400 px-2 py-1 rounded-full">{project.status}</span>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{allTasks.length} tasks</span>
              <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">{doneCount} done</span>
            </div>
          </div>
          <button
            onClick={() => setShowMembers(true)}
            className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            Team
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
          >
            + Add Task
          </button>
          
        </div>

        {/* Progress bar */}
        {allTasks.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
        {/* Online members */}
        {onlineMembers.length > 0 && (
          <div className="flex items-center gap-3 mb-6">
            <span className="text-gray-500 text-xs">Online now:</span>
            <div className="flex items-center gap-2">
              {onlineMembers.map((member) => (
                <div key={member._id} className="flex items-center gap-1.5">
                  <UserAvatar user={member} size="sm" showOnline={true} />
                  <span className="text-gray-400 text-xs">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* Overdue alert banner */}
        {(overdueCount > 0 || dueTodayCount > 0) && (
          <div className="flex gap-3 mb-6 flex-wrap">
            {overdueCount > 0 && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2 rounded-lg">
                <span className="font-bold">!</span>
                <span>{overdueCount} overdue task{overdueCount > 1 ? 's' : ''}</span>
                <button
                  onClick={() => setStatus('todo')}
                  className="underline hover:no-underline text-xs ml-1"
                >
                  view
                </button>
              </div>
            )}
            {dueTodayCount > 0 && (
              <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm px-4 py-2 rounded-lg">
                <span>{dueTodayCount} due today</span>
              </div>
            )}
          </div>
        )}
        {/* Search + Filters */}
        <TaskFilters
          search={search}     setSearch={setSearch}
          priority={priority} setPriority={setPriority}
          status={status}     setStatus={setStatus}
        />

        {/* Empty state */}
        {!tasksLoading && allTasks.length === 0 && (
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
            {/* {showMembers && project && (
              <MembersModal
                project={project}
                onClose={() => setShowMembers(false)}
                onUpdate={handleMembersUpdate}
              />
            )} */}
          </div>
        )}

        {/* No results from filter */}
        {!tasksLoading && allTasks.length > 0 && filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">No tasks match your filters</p>
            <button
              onClick={() => { setSearch(''); setPriority(''); setStatus('') }}
              className="text-indigo-400 hover:text-indigo-300 text-sm mt-2"
            >
              Clear filters
            </button>
          </div>
        )}

        {/* Kanban board */}
        {filteredTasks.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statusColumns.map((s) => (
              <div key={s} className={`bg-gray-900 border ${columnColors[s]} rounded-xl p-4`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-300">{columnLabels[s]}</h3>
                  <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                    {tasksByStatus[s].length}
                  </span>
                </div>
                <div className="space-y-3">
                  {tasksByStatus[s].length === 0
                    ? <p className="text-gray-600 text-xs text-center py-4">No tasks</p>
                    : tasksByStatus[s].map((task) => (
                        <TaskCard key={task._id} task={task} projectId={id} />
                      ))
                  }
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
        {showMembers && project && (
        <MembersModal
          project={project}
          onClose={() => setShowMembers(false)}
          onUpdate={handleMembersUpdate}
        />
      )}
      {showModal && <CreateTaskModal projectId={id} onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default ProjectDetail