import { useNavigate, Link } from 'react-router-dom'
import useAuthStore from '../store/authStore'

const Navbar = () => {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">

        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-white font-bold text-lg">DevBoard</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">

          {/* Profile link */}
          <Link
            to="/profile"
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-500 flex items-center justify-center flex-shrink-0">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="text-gray-300 text-sm hidden sm:block">
              {user?.name}
            </span>
          </Link>

          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar