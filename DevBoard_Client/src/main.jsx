import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.jsx'

const queryClient = new QueryClient()

const savedTheme = JSON.parse(localStorage.getItem('theme-storage') || '{}')
const theme = savedTheme?.state?.theme || 'dark'
document.documentElement.classList.add(theme)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1f2937',
            color:      '#f9fafb',
            border:     '1px solid #374151',
            borderRadius: '12px',
            fontSize:   '14px',
            padding:    '12px 16px',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#1f2937' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#1f2937' },
            duration: 4000,
          },
          loading: {
            iconTheme: { primary: '#6366f1', secondary: '#1f2937' },
          },
        }}
      />
    </QueryClientProvider>
  </StrictMode>
)