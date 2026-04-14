import { useState } from 'react'
import Navbar from '../components/Navbar'
import ProjectCard from '../components/ProjectCard'
import CreateProjectModal from '../components/CreateProjectModal'
import { useProjects } from '../hooks/useProjects'
import { exportProjectsToCSV } from '../utils/exportUtils'
import { showSuccess, showError } from '../utils/toast'
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts'

const Dashboard = () => {
  const [showModal, setShowModal]   = useState(false)
  const [filter,    setFilter]      = useState('all')
  const { data, isLoading, isError } = useProjects()

  const projects = data?.data || []
    const handleExportProjects = () => {
    const success = exportProjectsToCSV(projects)
    if (success) {
      showSuccess(`Exported ${projects.length} projects to CSV!`)
    } else {
      showError('No projects to export')
    }
  }
  // Filter projects by status
  const filtered = filter === 'all'
    ? projects
    : projects.filter((p) => p.status === filter)
    useKeyboardShortcuts({
    onNewProject: () => setShowModal(true),
    onExport:     handleExportProjects,
  })
  return (
    <div className="min-h-screen transition-colors duration-200"
     style={{ backgroundColor: 'var(--bg-primary)' }}>
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Page header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Projects</h1>
            <p className="text-gray-400 text-sm mt-1">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportProjects}
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium px-4 py-2 rounded-lg transition flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
            >
              + New Project
            </button>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {['all', 'active', 'on-hold', 'completed', 'archived'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                filter === tab
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-5 animate-pulse">
                <div className="h-4 bg-gray-800 rounded w-3/4 mb-3"/>
                <div className="h-3 bg-gray-800 rounded w-full mb-2"/>
                <div className="h-3 bg-gray-800 rounded w-2/3"/>
              </div>
            ))}
          </div>
        )}

        {/* Error state */}
        {isError && (
          <div className="text-center py-16">
            <p className="text-red-400">Failed to load projects. Make sure your backend is running.</p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-white font-medium mb-2">
              {filter === 'all' ? 'No projects yet' : `No ${filter} projects`}
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              {filter === 'all' ? 'Create your first project to get started' : 'Try a different filter'}
            </p>
            {filter === 'all' && (
              <button
                onClick={() => setShowModal(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-4 py-2 rounded-lg transition"
              >
                Create project
              </button>
            )}
          </div>
        )}

        {/* Projects grid */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((project) => (
              <ProjectCard key={project._id} project={project} />
            ))}
          </div>
        )}

      </main>

      {/* Create project modal */}
      {showModal && <CreateProjectModal onClose={() => setShowModal(false)} />}
    </div>
  )
}

export default Dashboard