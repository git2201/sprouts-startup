import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import OnboardingFlow from './components/OnboardingFlow'
import Header from './components/Header'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import StripeTest from './components/StripeTest'
import { onAuthStateChange, getCurrentUser, signOut, signUp } from './library/auth.js'
import { getUserProfile, updateUserProfile } from './library/profiles.js'
import { createUserFromOnboarding } from './utils/matching.js'
import { testProfilesTable } from './library/supabase.js'

function App() {
  const [authState, setAuthState] = useState('welcome') // 'welcome', 'login', 'signup', 'onboarding', 'dashboard'
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [onboardingData, setOnboardingData] = useState(null) // NEW: store onboarding answers
  const [editing, setEditing] = useState(false);
  const [editFields, setEditFields] = useState({
    availability: userProfile?.availability || '',
    communication: userProfile?.communication || '',
    roles: userProfile?.roles || [],
    industries: userProfile?.industries || [],
  });

  // Move useLocation to the top, before any returns
  const location = useLocation();

  // Helper: Save user and profile to localStorage
  const persistUserSession = (user, profile) => {
    if (user && profile) {
      localStorage.setItem('sprout_logged_in_user', JSON.stringify({ user, profile }))
    } else {
      localStorage.removeItem('sprout_logged_in_user')
    }
  }

  // Helper: Restore user and profile from localStorage
  const restoreUserSession = () => {
    const data = localStorage.getItem('sprout_logged_in_user')
    if (data) {
      try {
        const { user, profile } = JSON.parse(data)
        return { user, profile }
      } catch {
        return { user: null, profile: null }
      }
    }
    return { user: null, profile: null }
  }

  useEffect(() => {
    // Test profiles table on app load
    testProfilesTable()

    // Listen to auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const { profile, error } = await getUserProfile(session.user.id)
        if (!error && profile) {
          setUserProfile(profile)
          setAuthState('dashboard')
          persistUserSession(session.user, profile)
        } else {
          setAuthState('onboarding')
          persistUserSession(session.user, null)
        }
        setLoading(false)
      } else {
        setUser(null)
        setUserProfile(null)
        setAuthState('welcome')
        persistUserSession(null, null)
        setLoading(false)
      }
    })

    // Check current user on app load
    const checkUser = async () => {
      // Try to restore from localStorage first
      const { user: storedUser, profile: storedProfile } = restoreUserSession()
      if (storedUser && storedProfile) {
        setUser(storedUser)
        setUserProfile(storedProfile)
        setAuthState('dashboard')
        setLoading(false)
        return
      }
      const { user } = await getCurrentUser()
      if (user) {
        setUser(user)
        const { profile } = await getUserProfile(user.id)
        if (profile) {
          setUserProfile(profile)
          setAuthState('dashboard')
          persistUserSession(user, profile)
        } else {
          setAuthState('onboarding')
          persistUserSession(user, null)
        }
        setLoading(false)
      } else {
        setLoading(false)
      }
    }

    checkUser()

    console.log('After checkUser, user:', user, 'userProfile:', userProfile, 'authState:', authState);

    return () => subscription?.unsubscribe()
  }, [])

  const handleLogin = async (userData) => {
    console.log('Login successful:', userData) // Debug log
    setUser(userData)
    
    // Check if user has a profile in the database
    try {
      const { profile, error } = await getUserProfile(userData.id)
      if (!error && profile) {
        console.log('User has profile:', profile)
        setUserProfile(profile)
        setUser(prev => ({ ...prev, hasProfile: true }))
    setAuthState('dashboard')
    persistUserSession(userData, profile)
    } else {
        console.log('User has no profile, going to onboarding')
        setAuthState('onboarding')
        persistUserSession(userData, null)
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
      setAuthState('onboarding')
      persistUserSession(userData, null)
    }
  }

  const handleOnboardingComplete = (data) => {
    setOnboardingData(data)
    setAuthState('signup')
  }

  const handleSignup = async (signupData) => {
    // signupData: { name, email, phone, password }
    // onboardingData: from previous step
    setLoading(true)
    try {
      // Create user in Supabase Auth
      const { user, error } = await signUp(signupData.email, signupData.password, {
        name: signupData.name,
        phone: signupData.phone
      })
      if (error) {
        setLoading(false)
        alert(error.message || error)
        return
      }
      if (user) {
        // Combine onboarding and signup data
        const profileData = {
          id: user.id,
          name: signupData.name,
          email: signupData.email,
          phone: signupData.phone,
          ...onboardingData,
          updated_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
        // Save to Supabase profiles table
        const { error: profileError } = await updateUserProfile(user.id, profileData)
        if (profileError) {
          console.error('Profile save error:', profileError);
          alert('Error saving profile: ' + (profileError.message || JSON.stringify(profileError)))
        }
        setUser(user)
        setUserProfile(profileData)
    setAuthState('dashboard')
    persistUserSession(user, profileData)
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    console.log('Sign out button clicked');
    const { error } = await signOut();
    if (error) {
      alert('Sign out failed: ' + error);
      console.error('Sign out error:', error);
    } else {
    setUser(null);
    setUserProfile(null);
    setAuthState('welcome');
    persistUserSession(null, null)
      // window.location.reload(); // Force reload to clear all state
  }
  };

  const switchToOnboarding = () => setAuthState('onboarding')
  const switchToSignup = () => setAuthState('onboarding')
  const switchToLogin = () => setAuthState('login')

  // Debug: Show current state
  console.log('Current authState:', authState)
  console.log('Current user:', user)
  console.log('Current userProfile:', userProfile)

  useEffect(() => {
    if (user && !userProfile && !loading) {
      setAuthState('onboarding');
    }
  }, [user, userProfile, loading]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    const { error } = await updateUserProfile(user.id, {
      availability: editFields.availability,
      communication: editFields.communication,
      roles: editFields.roles,
      industries: editFields.industries,
    });
    if (!error) {
      setUserProfile(prev => ({
        ...prev,
        ...editFields,
      }));
      setEditing(false);
    } else {
      alert('Error updating profile: ' + (error.message || JSON.stringify(error)));
    }
  };

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
  } else if (authState === 'onboarding' && location.pathname !== '/onboarding' && !userProfile) {
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
      <Header onLogout={handleLogout} />
      {redirect}
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-green-50 font-sans">
            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center text-center px-4 pt-24 pb-32 bg-gradient-to-br from-green-500 to-green-300 overflow-hidden">
              {/* Abstract 3D/Isometric Shape */}
              <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-tr from-green-200 via-green-100 to-transparent rounded-full blur-3xl opacity-60 z-0"></div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-100 via-white to-transparent rounded-full blur-2xl opacity-40 z-0"></div>
              <h1 className="relative z-10 text-4xl md:text-6xl font-extrabold text-white mb-6 leading-tight">
                Build with someone who actually <span className="text-white/90">gets it.</span>
              </h1>
              <p className="relative z-10 text-lg md:text-2xl text-white/90 mb-8 max-w-2xl mx-auto">
                Sprout matches you with a cofounder who shares your vision and complements your skills. No more random DMs — just real, meaningful connections.
              </p>
              <button
                className="relative z-10 px-8 py-4 rounded-xl bg-white text-green-700 font-bold text-lg shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-300 border border-green-600 hover:bg-green-50"
                onClick={switchToOnboarding}
              >
                Find Your Cofounder
              </button>
              {/* Subtle 3D accent */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-80 h-16 bg-gradient-to-r from-green-200 to-green-100 rounded-full blur-2xl opacity-40 z-0"></div>
            </section>

            {/* How it Works Section */}
            <section className="max-w-5xl mx-auto py-20 px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">How it works</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {/* Step 1 */}
                <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-200">
                  <div className="mb-4">
                    <svg width="56" height="56" fill="none" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="#D1FAE5"/><path d="M18 36V20a2 2 0 012-2h16a2 2 0 012 2v16" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><rect x="22" y="24" width="12" height="8" rx="2" fill="#34D399"/></svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">1. Fill your profile</h3>
                  <p className="text-gray-600">Tell us about your skills, vision, and what you’re looking for in a cofounder.</p>
                </div>
                {/* Step 2 */}
                <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-200">
                  <div className="mb-4">
                    <svg width="56" height="56" fill="none" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="#BBF7D0"/><path d="M18 28h20M28 18v20" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">2. We match you</h3>
                  <p className="text-gray-600">Our algorithm finds the best fit based on your goals and working style.</p>
                </div>
                {/* Step 3 */}
                <div className="flex flex-col items-center text-center p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow duration-200">
                  <div className="mb-4">
                    <svg width="56" height="56" fill="none" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="#6EE7B7"/><path d="M20 32l8-8 8 8" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">3. You connect</h3>
                  <p className="text-gray-600">Start a conversation and build something great together.</p>
                </div>
              </div>
            </section>

            {/* Why Sprout Section */}
            <section className="max-w-6xl mx-auto py-20 px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">Why Sprout?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center hover:shadow-xl transition-shadow duration-200 border-t-4 border-green-400">
                  <svg width="40" height="40" fill="none" viewBox="0 0 40 40" className="mb-4"><circle cx="20" cy="20" r="20" fill="#D1FAE5"/><path d="M13 27l7-7 7 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <h3 className="text-lg font-semibold mb-2">Aligned vision</h3>
                  <p className="text-gray-600 text-center">We match you with founders who share your goals and values.</p>
                </div>
                <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center hover:shadow-xl transition-shadow duration-200 border-t-4 border-green-400">
                  <svg width="40" height="40" fill="none" viewBox="0 0 40 40" className="mb-4"><circle cx="20" cy="20" r="20" fill="#BBF7D0"/><path d="M20 13v14M13 20h14" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <h3 className="text-lg font-semibold mb-2">Complementary skills</h3>
                  <p className="text-gray-600 text-center">Find partners who bring new strengths to your team.</p>
                </div>
                <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col items-center hover:shadow-xl transition-shadow duration-200 border-t-4 border-green-400">
                  <svg width="40" height="40" fill="none" viewBox="0 0 40 40" className="mb-4"><circle cx="20" cy="20" r="20" fill="#6EE7B7"/><path d="M15 25l5-5 5 5" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <h3 className="text-lg font-semibold mb-2">No random DMs</h3>
                  <p className="text-gray-600 text-center">Connect only with serious, vetted founders — no spam.</p>
                </div>
              </div>
            </section>

            {/* Stats / Social Proof Section */}
            <section className="max-w-4xl mx-auto py-20 px-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">What founders are saying</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Placeholder testimonial cards */}
                <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col justify-between hover:shadow-xl transition-shadow duration-200">
                  <p className="text-gray-700 text-lg mb-4">“Sprout helped me find a cofounder who truly shares my vision. We launched our MVP in 3 months!”</p>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">A</div>
                    <div>
                      <div className="font-semibold text-gray-900">Alex P.</div>
                      <div className="text-gray-500 text-sm">Founder, Seedly</div>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl shadow-md p-8 flex flex-col justify-between hover:shadow-xl transition-shadow duration-200">
                  <p className="text-gray-700 text-lg mb-4">“The matching process was seamless and the quality of connections is top-notch.”</p>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center font-bold text-green-700">S</div>
                    <div>
                      <div className="font-semibold text-gray-900">Samantha R.</div>
                      <div className="text-gray-500 text-sm">Co-founder, Launchly</div>
                    </div>
                  </div>
                </div>
                {/* Add more testimonials or stats as needed */}
              </div>
            </section>
            {/* Footer with login button */}
            <footer className="w-full flex flex-col items-center justify-center py-12 mt-12">
              <button
                className="px-8 py-4 rounded-xl bg-white border border-green-600 text-green-700 font-bold text-lg shadow transition-all duration-200 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300"
                onClick={switchToLogin}
              >
                I already have an account
              </button>
            </footer>
          </div>
        } />
        <Route path="/login" element={<Login onLogin={handleLogin} onSwitchToSignup={switchToSignup} />} />
        <Route path="/signup" element={<Signup onSignup={handleSignup} onSwitchToLogin={switchToLogin} onboardingData={onboardingData} />} />
        <Route path="/onboarding" element={<OnboardingFlow onComplete={handleOnboardingComplete} />} />
        <Route path="/stripe-test" element={<StripeTest />} />
        <Route path="/dashboard" element={
          user && userProfile ? (
            <Dashboard
              user={user}
              userProfile={userProfile}
              onLogout={handleLogout}
              editing={editing}
              editFields={editFields}
              setEditing={setEditing}
              setEditFields={setEditFields}
            >
              {!editing ? (
                <>
                  <button onClick={() => setEditing(true)} className="btn-primary">Edit Profile</button>
                </>
              ) : (
                <form onSubmit={handleEditSubmit}>
                  <label>
                    Availability:
                    <input
                      type="text"
                      value={editFields.availability}
                      onChange={e => setEditFields({ ...editFields, availability: e.target.value })}
                    />
                  </label>
                  <label>
                    Communication:
                    <input
                      type="text"
                      value={editFields.communication}
                      onChange={e => setEditFields({ ...editFields, communication: e.target.value })}
                    />
                  </label>
                  <label>
                    Roles:
                    <input
                      type="text"
                      value={editFields.roles.join(', ')}
                      onChange={e => setEditFields({ ...editFields, roles: e.target.value.split(',').map(r => r.trim()) })}
                    />
                  </label>
                  <label>
                    Industries:
                    <input
                      type="text"
                      value={editFields.industries.join(', ')}
                      onChange={e => setEditFields({ ...editFields, industries: e.target.value.split(',').map(i => i.trim()) })}
                    />
                  </label>
                  <button type="submit" className="btn-primary">Save</button>
                  <button type="button" onClick={() => setEditing(false)} className="btn-secondary">Cancel</button>
                </form>
              )}
            </Dashboard>
          ) : (
            <Navigate to="/login" replace />
          )
        } />
      </Routes>
    </div>
  )
}

export default App