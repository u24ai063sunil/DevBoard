import useAuthStore from '../store/authStore'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Welcome, {user?.name}!</h1>
        <button
          onClick={handleLogout}
          className="bg-gray-800 hover:bg-gray-700 text-sm px-4 py-2 rounded-lg transition"
        >
          Logout
        </button>
      </div>
      <p className="text-gray-400">Dashboard coming soon...</p>
    </div>
  )
}

export default Dashboard