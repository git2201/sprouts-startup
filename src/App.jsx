import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import OnboardingFlow from './components/OnboardingFlow'
import Header from './components/Header'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import { onAuthStateChange, getCurrentUser, signOut } from './library/auth.js'
import { getUserProfile, updateUserProfile } from './library/profiles.js'
import { createUserFromOnboarding } from './utils/matching.js'

function App() {
  const [authState, setAuthState] = useState('welcome') // 'welcome', 'login', 'signup', 'onboarding', 'dashboard'
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // Move useLocation to the top, before any returns
  const location = useLocation();

  useEffect(() => {
    // Listen to auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const { profile, error } = await getUserProfile(session.user.id)
        if (!error && profile) {
          setUserProfile(profile)
          setAuthState('dashboard')
        } else {
          setAuthState('onboarding')
        }
        setLoading(false)
      } else {
        setUser(null)
        setUserProfile(null)
        setAuthState('welcome')
        setLoading(false)
      }
    })

    // Check current user on app load
    const checkUser = async () => {
      const { user } = await getCurrentUser()
      if (user) {
        setUser(user)
        const { profile } = await getUserProfile(user.id)
        if (profile) {
          setUserProfile(profile)
          setAuthState('dashboard')
        } else {
          setAuthState('onboarding')
        }
        setLoading(false)
      } else {
        setLoading(false)
      }
    }
    
    checkUser()

    return () => subscription?.unsubscribe()
  }, [])

  const handleLogin = (userData) => {
    console.log('Login successful:', userData) // Debug log
    setUser(userData)
    if (userData.hasProfile) {
      setAuthState('dashboard')
    } else {
      setAuthState('onboarding')
    }
  }

  const handleSignup = (userData) => {
    console.log('Signup successful:', userData) // Debug log
    setUser(userData)
    setAuthState('onboarding')
  }

  const handleOnboardingComplete = async (onboardingData) => {
    console.log('🌱 Onboarding completed with data:', onboardingData)
    
    try {
      // Helper function to map communication style
      const mapCommunication = (comm) => {
        if (comm === 'Async-first') return 'async'
        if (comm === 'Weekly syncs/check-ins') return 'weekly_sync'
        if (comm === 'Daily check-ins and active messaging') return 'daily_checkin'
        if (comm === 'Depends on the team') return 'depends'
        return 'depends'
      }
      
      // Helper function to map availability
      const mapAvailability = (avail) => {
        if (avail === 'Nights/weekends only') return 'nights_weekends'
        if (avail === '10–20 hrs/week') return '10_20'
        if (avail === '20–40 hrs/week') return '20_40'
        if (avail === 'Full-time') return 'full_time'
        if (avail === 'Depends on the match') return 'depends'
        return 'depends'
      }
      
      // Helper function to map conflict style
      const mapConflictStyle = (conflict) => {
        if (conflict === 'I prefer to address it directly and resolve it quickly.') return 'direct'
        if (conflict === 'I bring it up gently, usually after thinking it through.') return 'indirect'
        if (conflict === 'I try to avoid confrontation and hope it resolves.') return 'avoidant'
        if (conflict === 'I usually internalize it unless it becomes urgent.') return 'internalize'
        return 'indirect'
      }
      
      // Helper function to map flexibility
      const mapFlexibility = (flex) => {
        if (flex === 'Very rigid') return 'rigid'
        if (flex === 'Slightly flexible') return 'slightly_flexible'
        if (flex === 'Very flexible') return 'very_flexible'
        return 'slightly_flexible'
      }
      
      // Helper function to map chronotype
      const mapChronotype = (chrono) => {
        if (chrono === 'Early morning (5am–10am)') return 'morning'
        if (chrono === 'Midday (11am–4pm)') return 'midday'
        if (chrono === 'Evening/Night (5pm–2am)') return 'night'
        if (chrono === 'Flexible throughout the day') return 'flexible'
        return 'flexible'
      }
      
      // Convert onboarding data to the format needed for the database
      const profileData = {
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous',
        email: user?.email,
        
        // Personality traits (Big Five)
        openness: onboardingData.openness || 3,
        conscientiousness: onboardingData.conscientiousness || 3,
        extraversion: onboardingData.extraversion || 3,
        agreeableness: onboardingData.agreeableness || 3,
        neuroticism: onboardingData.neuroticism || 3,
        
        // Work style and availability
        availability: mapAvailability(onboardingData.availability),
        availability_flexibility: mapFlexibility(onboardingData.availability_flexibility),
        chronotype: mapChronotype(onboardingData.chronotype),
        communication: mapCommunication(onboardingData.communication),
        
        // Conflict and team style
        conflict_style: mapConflictStyle(onboardingData.conflict_style),
        team_style: onboardingData.team_style || '',
        cofounder_frustration: onboardingData.cofounder_frustration || '',
        
        // Motivation and values
        motivations: onboardingData.motivations || [],
        top_motivation: onboardingData.top_motivation || '',
        
        // Roles and skills
        roles: onboardingData.roles || [],
        preferred_role: onboardingData.preferred_role || '',
        
        // Legacy fields for backward compatibility
        role: onboardingData.roles?.[0] || 'Not specified',
        personality: getPersonalityLabel(onboardingData),
        work_style: getWorkStyleLabel(onboardingData),
        motivation: onboardingData.top_motivation || 'Not specified',
        cofounder_preference: getCofounderPreference(onboardingData),
        startup_stage: 'Building MVP', // Default for now
        
        // Metadata
        avatar: '👤',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Save to database
      const { profile, error } = await updateUserProfile(user.id, profileData)
      console.log('Profile upsert result:', profile, error)
      
      if (error) {
        console.error('Error saving profile:', error)
        // Still set the profile locally so user can proceed
        setUserProfile(profileData)
        setUser(prev => ({ ...prev, hasProfile: true }))
        setAuthState('dashboard')
      } else {
        console.log('🌱 Profile saved successfully:', profile)
        setUserProfile(profile)
        setUser(prev => ({ ...prev, hasProfile: true }))
        setAuthState('dashboard')
      }
      
    } catch (error) {
      console.error('Error in onboarding completion:', error)
      // Fallback: set basic profile data
      const fallbackProfile = {
        name: user?.user_metadata?.name || user?.email?.split('@')[0] || 'Anonymous',
        email: user?.email,
        role: 'Not specified',
        personality: 'Not specified',
        work_style: 'Not specified',
        motivation: 'Not specified',
        cofounder_preference: 'Not specified',
        startup_stage: 'Not specified',
        avatar: '👤'
      }
      setUserProfile(fallbackProfile)
      setUser(prev => ({ ...prev, hasProfile: true }))
      setAuthState('dashboard')
    }
    // Ensure loading is set to false after onboarding
    setLoading(false)
  }

  // Helper functions to convert detailed data to simple labels
  const getPersonalityLabel = (data) => {
    if (data.extraversion >= 4) return 'Extrovert'
    if (data.extraversion <= 2) return 'Introvert'
    if (data.openness >= 4) return 'Creative'
    if (data.conscientiousness >= 4) return 'Analytical'
    return 'Balanced'
  }

  const getWorkStyleLabel = (data) => {
    if (data.communication === 'Async-first') return 'Async'
    if (data.communication === 'Daily check-ins and active messaging') return 'Real-time'
    if (data.availability_flexibility === 'Very flexible') return 'Flexible'
    return 'Structured'
  }

  const getCofounderPreference = (data) => {
    if (data.roles?.includes('Technical')) return 'Tech Cofounder'
    if (data.roles?.includes('Sales') || data.roles?.includes('Marketer')) return 'Business Cofounder'
    if (data.roles?.includes('Designer/UX')) return 'Design Cofounder'
    return 'Flexible'
  }

  const handleLogout = async () => {
    await signOut()
    setUser(null)
    setUserProfile(null)
    setAuthState('welcome')
  }

  const switchToSignup = () => setAuthState('signup')
  const switchToLogin = () => setAuthState('login')

  // Debug: Show current state
  console.log('Current authState:', authState)
  console.log('Current user:', user)
  console.log('Current userProfile:', userProfile)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-poppins">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="text-4xl mb-4">🌱</div>
            <h2 className="text-2xl font-bold text-gray-900">Loading your matches...</h2>
            <p className="text-gray-600 mt-2">Finding the perfect cofounders for you</p>
          </div>
        </div>
      </div>
    )
  }

  // Handle redirects based on auth state
  let redirect = null;
  if (authState === 'dashboard' && location.pathname !== '/dashboard') {
    redirect = <Navigate to="/dashboard" replace />;
  } else if (authState === 'onboarding' && location.pathname !== '/onboarding') {
    redirect = <Navigate to="/onboarding" replace />;
  } else if (authState === 'login' && location.pathname !== '/login') {
    redirect = <Navigate to="/login" replace />;
  } else if (authState === 'signup' && location.pathname !== '/signup') {
    redirect = <Navigate to="/signup" replace />;
  } else if (authState === 'welcome' && location.pathname !== '/') {
    redirect = <Navigate to="/" replace />;
  }

  return (
    <div className="app">
      <Header />
      {redirect}
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
              <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                <div className="text-5xl mb-6">🌱</div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Sprout</h1>
                <p className="text-gray-600 mb-8">Find your perfect cofounder</p>
                <div className="space-y-4">
                  <button 
                    className="btn-primary w-full"
                    onClick={switchToSignup}
                  >
                    Get Started
                  </button>
                  <button 
                    className="btn-secondary w-full"
                    onClick={switchToLogin}
                  >
                    I already have an account
                  </button>
                </div>
              </div>
            </div>
          </div>
        } />
        <Route path="/login" element={<Login onLogin={handleLogin} onSwitchToSignup={switchToSignup} />} />
        <Route path="/signup" element={<Signup onSignup={handleSignup} onSwitchToLogin={switchToLogin} />} />
        <Route path="/onboarding" element={<OnboardingFlow onComplete={handleOnboardingComplete} />} />
        <Route path="/dashboard" element={<Dashboard user={user} userProfile={userProfile} onLogout={handleLogout} />} />
      </Routes>
    </div>
  )
}

export default App