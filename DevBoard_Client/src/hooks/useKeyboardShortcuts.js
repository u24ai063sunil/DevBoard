import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const useKeyboardShortcuts = ({
  onNewProject,
  onNewTask,
  onSearch,
  onExport,
} = {}) => {
  const navigate          = useNavigate()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    const handleKeyDown = (e) => {
      // Don't trigger shortcuts when typing in inputs
      const tag = e.target.tagName.toLowerCase()
      if (['input', 'textarea', 'select'].includes(tag)) return
      if (e.target.contentEditable === 'true') return

      // Don't trigger with modifier keys except specific combos
      if (e.ctrlKey || e.metaKey || e.altKey) return

      switch (e.key) {
        // Navigation
        case 'g':
          e.preventDefault()
          navigate('/dashboard')
          break

        case 'a':
          e.preventDefault()
          navigate('/analytics')
          break

        case 'p':
          e.preventDefault()
          navigate('/profile')
          break

        // Actions
        case 'n':
          e.preventDefault()
          onNewProject?.()
          break

        case 't':
          e.preventDefault()
          onNewTask?.()
          break

        case 'f':
          e.preventDefault()
          onSearch?.()
          break

        case 'e':
          e.preventDefault()
          onExport?.()
          break

        // Help
        case '?':
          e.preventDefault()
          showShortcutsHelp()
          break

        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isAuthenticated, navigate, onNewProject, onNewTask, onSearch, onExport])
}

// Show shortcuts modal via custom event
const showShortcutsHelp = () => {
  window.dispatchEvent(new CustomEvent('show-shortcuts'))
}

export default useKeyboardShortcuts