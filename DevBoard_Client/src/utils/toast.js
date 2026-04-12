 import toast from 'react-hot-toast'

export const showSuccess = (msg) => toast.success(msg)
export const showError   = (msg) => toast.error(msg)
export const showLoading = (msg) => toast.loading(msg)
export const showInfo    = (msg) => toast(msg, {
  icon: 'ℹ️',
  style: {
    background: '#1e3a5f',
    color:      '#93c5fd',
    border:     '1px solid #1d4ed8',
    borderRadius: '12px',
  },
})
export const dismiss     = (id)  => toast.dismiss(id)
export { toast }