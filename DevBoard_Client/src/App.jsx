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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

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
        <Route path="/"  element={<Navigate to="/dashboard" replace />} />
        <Route path="*"  element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App