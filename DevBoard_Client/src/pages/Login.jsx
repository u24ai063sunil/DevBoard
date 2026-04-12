import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../api/axios'
import { showSuccess, showError } from '../utils/toast'

const Login = () => {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const login          = useAuthStore((state) => state.login)
  const googleError = searchParams.get('error')
  const verified = searchParams.get('verified') === 'true'

  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // Unverified email state
  const [unverified,   setUnverified]   = useState(false)
  const [resending,    setResending]    = useState(false)
  const [resendMsg,    setResendMsg]    = useState('')

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
    setUnverified(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setUnverified(false)

    try {
      await login(formData.email, formData.password)
      showSuccess('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      if (msg.includes('verify')) {
        setUnverified(true)
      } else {
        setError(msg)
        showError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setResending(true)
    setResendMsg('')
    try {
      await api.post('/auth/resend-verification', { email: formData.email })
      setResendMsg('Verification email sent! Check your inbox.')
    } catch (err) {
      setResendMsg(err.response?.data?.message || 'Failed to resend')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors duration-200"
      style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">DevBoard</h1>
          <p className="text-gray-400 mt-2">Sign in to your account</p>
        </div>

        {/* Card */}
         <div className="rounded-2xl p-8 border transition-colors duration-200"
        style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>

          {/* Email verified success */}
          {verified && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg px-4 py-3 mb-6">
              Email verified successfully! You can now log in.
            </div>
          )}
          {googleError && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {googleError === 'google_failed'
                ? 'Google sign in failed. Please try again.'
                : 'Something went wrong. Please try again.'
              }
            </div>
          )}
          {/* Unverified email warning */}
          {unverified && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm rounded-lg px-4 py-3 mb-6">
              <p className="font-medium mb-1">Please verify your email first</p>
              <p className="text-xs mb-2 text-yellow-500">Check your inbox for the verification link.</p>
              {resendMsg ? (
                <p className="text-xs text-green-400">{resendMsg}</p>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending || !formData.email}
                  className="text-xs underline hover:no-underline disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend verification email'}
                </button>
              )}
            </div>
          )} 

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email address</label>
              <input
                type="email" name="email" value={formData.email}
                onChange={handleChange} placeholder="raj@example.com" required
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-300">Password</label>
                <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
                  Forgot password?
                </Link>
              </div>
              <input
                type="password" name="password" value={formData.password}
                onChange={handleChange} placeholder="••••••••" required
                className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-medium rounded-lg px-4 py-3 text-sm transition"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-800"/>
            <span className="text-gray-500 text-xs">or continue with</span>
            <div className="flex-1 h-px bg-gray-800"/>
          </div>

          {/* Google button */}
          <a  href="http://localhost:5000/api/auth/google"
            className="w-full flex items-center justify-center gap-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm font-medium transition"
          >
            {/* Google icon */}
            <svg width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              <path fill="none" d="M0 0h48v48H0z"/>
            </svg>
            Continue with Google
          </a>
          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login