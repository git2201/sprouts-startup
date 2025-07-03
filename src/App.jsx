import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import './App.css'
import OnboardingFlow from './components/OnboardingFlow'
import Header from './components/Header'
import Login from './components/Login'
import Signup from './components/Signup'
import Dashboard from './components/Dashboard'
import { onAuthStateChange, getCurrentUser, signOut, signUp } from './library/auth.js'
import { getUserProfile, updateUserProfile } from './library/profiles.js'
import { createUserFromOnboarding } from './utils/matching.js'
import { testProfilesTable } from './library/supabase.js'

function App() {
  const [authState, setAuthState] = useState('welcome') // 'welcome', 'login', 'signup', 'onboarding', 'dashboard'
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
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
    } else {
        console.log('User has no profile, going to onboarding')
        setAuthState('onboarding')
      }
    } catch (error) {
      console.error('Error checking user profile:', error)
      setAuthState('onboarding')
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
      console.error('Sign out error:', error);
    } else {
      console.log('Signed out successfully');
    }
    setUser(null);
    setUserProfile(null);
    setAuthState('welcome');
  }

  const switchToOnboarding = () => setAuthState('onboarding')
  const switchToSignup = () => setAuthState('signup')
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
                    onClick={switchToOnboarding}
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
        <Route path="/signup" element={<Signup onSignup={handleSignup} onSwitchToLogin={switchToLogin} onboardingData={onboardingData} />} />
        <Route path="/onboarding" element={<OnboardingFlow onComplete={handleOnboardingComplete} />} />
        <Route path="/dashboard" element={
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
        } />
      </Routes>
    </div>
  )
}

export default App