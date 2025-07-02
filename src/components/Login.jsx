import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signIn } from '../library/auth.js'

const Login = ({ onLogin, onSwitchToSignup }) => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    const newErrors = {}
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      setIsLoading(false)
      return
    }

    try {
      const { user, error } = await signIn(formData.email, formData.password)
      
      if (error) {
        setErrors({ email: error })
      } else if (user) {
        onLogin({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email.split('@')[0],
          hasProfile: false
        })
        // The App.jsx will handle the redirect based on user profile
      }
    } catch (error) {
      setErrors({ email: 'An unexpected error occurred' })
    }
    
    setIsLoading(false)
  }

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setErrors({ email: 'Please enter your email to reset password' })
      return
    }
    
    // Here you would typically call Supabase password reset
    console.log('Sending password reset to:', formData.email)
    setShowForgotPassword(false)
    // Show success message
    alert('Password reset email sent! Check your inbox.')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="text-4xl mb-2">🌱</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600">Sign in to your Sprout account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter your email"
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`input-field ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
            </div>
            <button type="submit" className={`btn-primary w-full ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{' '}
              <button onClick={onSwitchToSignup} className="text-primary-600 hover:text-primary-700 font-medium" disabled={isLoading}>
                Sign up
              </button>
            </p>
          </div>
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowForgotPassword(!showForgotPassword)}
              className="text-[#22c177] font-semibold hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          {showForgotPassword && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="text-sm text-gray-600 mb-3">
                Enter your email and we'll send you a password reset link.
              </p>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="w-full bg-[#22c177] text-white font-semibold py-2 rounded-lg hover:bg-[#1ea366] transition-colors"
              >
                Send Reset Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Login