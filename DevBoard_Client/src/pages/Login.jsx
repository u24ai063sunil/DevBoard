// import { useState } from 'react'
// import { Link, useNavigate } from 'react-router-dom'
// import useAuthStore from '../store/authStore'

// const Login = () => {
//   const navigate  = useNavigate()
//   const login     = useAuthStore((state) => state.login)

//   const [formData, setFormData] = useState({ email: '', password: '' })
//   const [error,    setError]    = useState('')
//   const [loading,  setLoading]  = useState(false)

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value })
//     setError('') // clear error on type
//   }

//   const handleSubmit = async (e) => {
//     e.preventDefault()
//     setLoading(true)
//     setError('')

//     try {
//       await login(formData.email, formData.password)
//       navigate('/dashboard')
//     } catch (err) {
//       setError(err.response?.data?.message || 'Login failed. Try again.')
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center px-4 transition-colors duration-200"
//      style={{ backgroundColor: 'var(--bg-primary)' }}>
//       <div className="w-full max-w-md">

//         {/* Logo / Title */}
//         <div className="text-center mb-8">
//           <h1 className="text-3xl font-bold text-white">DevBoard</h1>
//           <p className="text-gray-400 mt-2">Sign in to your account</p>
//         </div>

//         {/* Card */}
//         <div className="rounded-2xl p-8 border transition-colors duration-200"
//      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)' }}>

//           {/* Error message */}
//           {error && (
//             <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3 mb-6">
//               {error}
//             </div>
//           )}

//           <form onSubmit={handleSubmit} className="space-y-5">

//             {/* Email */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Email address
//               </label>
//               <input
//                 type="email"
//                 name="email"
//                 value={formData.email}
//                 onChange={handleChange}
//                 placeholder="raj@example.com"
//                 required
//                 className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
//               />
//             </div>

//             {/* Password */}
//             <div>
//               <label className="block text-sm font-medium text-gray-300 mb-2">
//                 Password
//               </label>
//               <Link to="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
//                 Forgot password?
//               </Link>
//               <input
//                 type="password"
//                 name="password"
//                 value={formData.password}
//                 onChange={handleChange}
//                 placeholder="••••••••"
//                 required
//                 className="w-full bg-gray-800 border border-gray-700 text-white placeholder-gray-500 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
//               />
//             </div>

//             {/* Submit button */}
//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white font-medium rounded-lg px-4 py-3 text-sm transition"
//             >
//               {loading ? 'Signing in...' : 'Sign in'}
//             </button>

//           </form>

//           {/* Register link */}
//           <p className="text-center text-sm text-gray-400 mt-6">
//             Don't have an account?{' '}
//             <Link to="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
//               Create one
//             </Link>
//           </p>

//         </div>
//       </div>
//     </div>
//   )
// }

// export default Login
import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import useAuthStore from '../store/authStore'
import api from '../api/axios'

const Login = () => {
  const navigate       = useNavigate()
  const [searchParams] = useSearchParams()
  const login          = useAuthStore((state) => state.login)

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
      navigate('/dashboard')
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      if (msg.includes('verify')) {
        setUnverified(true)
      } else {
        setError(msg)
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