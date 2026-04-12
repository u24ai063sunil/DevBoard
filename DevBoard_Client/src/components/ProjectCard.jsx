import { useNavigate } from 'react-router-dom'
import { useDeleteProject } from '../hooks/useProjects'
import { showSuccess, showError } from '../utils/toast'

const statusColors = {
  active:    'bg-green-500/10 text-green-400 border-green-500/20',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  archived:  'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'on-hold': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

const priorityColors = {
  low:    'bg-gray-500/10 text-gray-400',
  medium: 'bg-yellow-500/10 text-yellow-400',
  high:   'bg-red-500/10 text-red-400',
}

const ProjectCard = ({ project }) => {
  const navigate = useNavigate()
  const deleteProject = useDeleteProject()

  const handleDelete = async (e) => {
    e.stopPropagation()
    // Replace window.confirm with toast confirmation
    const confirmed = window.confirm(`Delete "${project.name}"? This will delete all tasks too.`)
    if (!confirmed) return

    try {
      await deleteProject.mutateAsync(project._id)
      // Toast handled by useDeleteProject onSuccess
    } catch (err) {
      showError('Failed to delete project')
    }
  }

  return (
    <div
      onClick={() => navigate(`/projects/${project._id}`)}
      className="bg-gray-900 border border-gray-800 hover:border-indigo-500/50 rounded-xl p-5 cursor-pointer transition group"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-white font-semibold text-base group-hover:text-indigo-400 transition line-clamp-1">
          {project.name}
        </h3>
        <button
          onClick={handleDelete}
          disabled={deleteProject.isPending}
          className="text-gray-600 hover:text-red-400 transition text-lg leading-none ml-2 shrink-0"
        >
          ×
        </button>
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
          {project.description}
        </p>
      )}

      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[project.status] || statusColors.active}`}>
          {project.status}
        </span>
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[project.priority] || priorityColors.medium}`}>
          {project.priority} priority
        </span>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-800">
        <span className="text-gray-500 text-xs">
          {new Date(project.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric'
          })}
        </span>
        <span className="text-gray-500 text-xs">
          by {project.owner?.name || 'You'}
        </span>
      </div>
    </div>
  )
}

export default ProjectCard