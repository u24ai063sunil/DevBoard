import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import ProjectDetail from './pages/ProjectDetail'
import ProtectedRoute from './components/ProtectedRoute'
import Profile from './pages/Profile'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword  from './pages/ResetPassword'
import Analytics from './pages/Analytics'
import AuthCallback from './pages/AuthCallback'
import AdminDashboard from './pages/AdminDashboard'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import api from './api/axios'
import Footer from './components/Footer'
import KeyboardShortcutsModal from './components/KeyboardShortcutsModal'

function App() {
  const { isAuthenticated, updateUser } = useAuthStore()

  // Sync fresh user data on app load — fixes stale avatar
  useEffect(() => {
    if (!isAuthenticated) return

    const syncUser = async () => {
      try {
        const res = await api.get('/auth/me')
        updateUser(res.data.user)
      } catch (err) {
        console.error('Failed to sync user:', err)
      }
    }

    syncUser()
  }, [isAuthenticated])

  return (
    <BrowserRouter>
     <div className="min-h-screen flex flex-col">
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        }/>

        <Route path="/projects/:id" element={
          <ProtectedRoute><ProjectDetail /></ProtectedRoute>
        }/>
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        }/>
        <Route path="/analytics" element={
          <ProtectedRoute><Analytics /></ProtectedRoute>
        }/>
        <Route path="/admin" element={
          <ProtectedRoute><AdminDashboard /></ProtectedRoute>
        }/>
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
      </Routes>
      <Footer />
      <KeyboardShortcutsModal />
      </div>
    </BrowserRouter>
  )
}

export default App