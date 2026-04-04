// Get due date status for a task
export const getDueDateStatus = (dueDate, status) => {
  if (!dueDate || status === 'done') return null

  const now     = new Date()
  const due     = new Date(dueDate)
  const today   = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dueDay  = new Date(due.getFullYear(), due.getMonth(), due.getDate())
  const diffMs  = dueDay - today
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0)  return { label: `${Math.abs(diffDays)}d overdue`, type: 'overdue' }
  if (diffDays === 0) return { label: 'Due today',                      type: 'today'   }
  if (diffDays === 1) return { label: 'Due tomorrow',                   type: 'soon'    }
  if (diffDays <= 3)  return { label: `${diffDays}d left`,              type: 'soon'    }
  return { label: `${diffDays}d left`, type: 'normal' }
}

// Format date nicely
export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}