import Papa from 'papaparse'

// Generic CSV download function
const downloadCSV = (data, filename) => {
  const csv  = Papa.unparse(data)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href     = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

// Export tasks to CSV
export const exportTasksToCSV = (tasks, projectName) => {
  if (!tasks || tasks.length === 0) return false

  const rows = tasks.map((task) => ({
    'Title':            task.title,
    'Description':      task.description || '',
    'Status':           task.status,
    'Priority':         task.priority,
    'Category':         task.category || '',
    'Assignee':         task.assignee?.name || 'Unassigned',
    'Estimated Hours':  task.estimatedHours || '',
    'Due Date':         task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '',
    'Completed At':     task.completedAt ? new Date(task.completedAt).toLocaleDateString() : '',
    'Labels':           task.labels?.map((l) => l.name).join(', ') || '',
    'Checklist Total':  task.checklist?.length || 0,
    'Checklist Done':   task.checklist?.filter((i) => i.completed).length || 0,
    'Created At':       new Date(task.createdAt).toLocaleDateString(),
  }))

  const date     = new Date().toISOString().split('T')[0]
  const filename = `${projectName.replace(/\s+/g, '_')}_tasks_${date}.csv`
  downloadCSV(rows, filename)
  return true
}

// Export projects to CSV
export const exportProjectsToCSV = (projects) => {
  if (!projects || projects.length === 0) return false

  const rows = projects.map((project) => ({
    'Name':        project.name,
    'Description': project.description || '',
    'Status':      project.status,
    'Priority':    project.priority,
    'Owner':       project.owner?.name || '',
    'Members':     project.members?.length || 0,
    'Tags':        project.tags?.join(', ') || '',
    'Due Date':    project.dueDate ? new Date(project.dueDate).toLocaleDateString() : '',
    'Created At':  new Date(project.createdAt).toLocaleDateString(),
  }))

  const date     = new Date().toISOString().split('T')[0]
  const filename = `devboard_projects_${date}.csv`
  downloadCSV(rows, filename)
  return true
}

// Export analytics summary to CSV
export const exportAnalyticsToCSV = (stats, tasksByStatus, tasksByPriority) => {
  const overviewRows = [
    { 'Metric': 'Total Projects',    'Value': stats.totalProjects    },
    { 'Metric': 'Active Projects',   'Value': stats.activeProjects   },
    { 'Metric': 'Completed Projects','Value': stats.completedProjects },
    { 'Metric': 'Total Tasks',       'Value': stats.totalTasks       },
    { 'Metric': 'Completed Tasks',   'Value': stats.doneTasks        },
    { 'Metric': 'In Progress Tasks', 'Value': stats.inProgressTasks  },
    { 'Metric': 'Overdue Tasks',     'Value': stats.overdueTasks     },
    { 'Metric': 'Completion Rate',   'Value': `${stats.completionRate}%` },
  ]

  const date     = new Date().toISOString().split('T')[0]
  downloadCSV(overviewRows, `devboard_analytics_${date}.csv`)
  return true
}

export const exportUsersToCSV = (users) => {
  if (!users || users.length === 0) return false

  const rows = users.map((user) => ({
    'Name':        user.name,
    'Email':       user.email,
    'Role':        user.role,
    'Verified':    user.isVerified ? 'Yes' : 'No',
    'Google Auth': user.googleId ? 'Yes' : 'No',
    'Banned':      user.isBanned ? 'Yes' : 'No',
    'Joined':      new Date(user.createdAt).toLocaleDateString(),
  }))

  const date     = new Date().toISOString().split('T')[0]
  const filename = `devboard_users_${date}.csv`
  downloadCSV(rows, filename)
  return true
}