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
import { hasDeprecatedRolesOrMissingFields } from './utils/profileValidation';

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
  const [showProfileUpdateBanner, setShowProfileUpdateBanner] = useState(false);

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

  // 1. Only call checkUser() on mount, not on every render
  useEffect(() => {
    let didRun = false;
    const runCheckUser = async () => {
      if (didRun) return;
      didRun = true;
      // Early exit if already authenticated and on correct state
      if ((user && userProfile && authState === 'dashboard') || (user && !userProfile && authState === 'onboarding')) {
        setLoading(false);
        return;
      }
      // Try to restore from localStorage first
      const { user: storedUser, profile: storedProfile } = restoreUserSession()
      if (storedUser && storedProfile) {
        setUser(storedUser)
        setUserProfile(storedProfile)
        setAuthState('dashboard')
        setLoading(false)
        return
      }
      const { user: currentUser } = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
        const { profile } = await getUserProfile(currentUser.id)
        if (profile) {
          setUserProfile(profile)
          setAuthState('dashboard')
          persistUserSession(currentUser, profile)
        } else {
          setUserProfile(null)
          setAuthState('onboarding')
          persistUserSession(currentUser, null)
        }
        setLoading(false)
      } else {
        setUser(null)
        setUserProfile(null)
        setAuthState('welcome')
        setLoading(false)
      }
    };
    runCheckUser();
    // No dependency array: only run once on mount
    // eslint-disable-next-line
  }, []);

  // 2. After successful login, always route to dashboard if state is correct
  useEffect(() => {
    if (user && userProfile && authState !== 'dashboard') {
      setAuthState('dashboard');
    }
  }, [user, userProfile, authState]);

  // 3. Clear stale session data on logout/session expiry (already handled in handleLogout and onAuthStateChange)
  // 4. Remove redundant checkUser() calls (now only runs on mount)
  // 5. Always respect authState if already correct (guarded in checkUser and new useEffect)

  const handleLogin = async (userData) => {
    console.log('Login successful:', userData) // Debug log
    setUser(userData)
    try {
      const { profile, error } = await getUserProfile(userData.id)
      if (!error && profile) {
        console.log('User has profile:', profile)
        setUserProfile(profile)
        setUser(prev => ({ ...prev, hasProfile: true }))
        setAuthState('dashboard') // <-- Ensure dashboard state after login
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

  const handleOnboardingComplete = async (formData) => {
    console.log('App.jsx: handleOnboardingComplete called with', formData, 'user:', user);
    if (user && user.id) {
      // Existing user: update profile
      setLoading(true);
      const { error } = await updateUserProfile(user.id, formData);
      console.log('App.jsx: updateUserProfile finished, error:', error);
      // Always fetch the latest profile from Supabase after update
      const { profile: updatedProfile, error: fetchError } = await getUserProfile(user.id);
      console.log('App.jsx: getUserProfile after update, updatedProfile:', updatedProfile, 'fetchError:', fetchError);
      if (!error && updatedProfile) {
        setUserProfile(updatedProfile);
        console.log('App.jsx: setUserProfile called with', updatedProfile);
        setAuthState('dashboard');
      } else {
        alert('Error updating profile: ' + (error?.message || fetchError || JSON.stringify(error)));
      }
      setLoading(false);
    } else {
      // New user onboarding (signup flow)
      setOnboardingData(formData);
      setAuthState('signup');
    }
  };

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

  useEffect(() => {
    // Add post-login profile validation
    if (userProfile && hasDeprecatedRolesOrMissingFields(userProfile)) {
      setShowProfileUpdateBanner(true);
      setAuthState('onboarding');
    }
  }, [userProfile]);

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

  console.log('App.jsx: isProfileUpdate', !!user, 'user:', user, 'userProfile:', userProfile);

  return (
    <div className="app">
      <Header onLogout={handleLogout} />
      {redirect}
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen flex flex-col bg-white font-sans">
            {/* Hero Section */}
            <section className="relative flex flex-col items-center justify-center text-center px-4 pt-24 pb-32 bg-white overflow-hidden">
              <h1 className="relative z-10 text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
                Build with someone who actually <span className="text-green-600">gets it.</span>
              </h1>
              <p className="relative z-10 text-lg md:text-2xl text-gray-700 mb-8 max-w-2xl mx-auto">
                Sprout matches you with a cofounder who shares your vision and complements your skills. No more random DMs — just real, meaningful connections.
              </p>
              <button
                className="relative z-10 px-8 py-4 rounded-xl bg-white text-green-600 font-bold text-lg shadow-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-200 border border-green-500 hover:bg-green-50"
                onClick={switchToOnboarding}
              >
                Find Your Cofounder
              </button>
            </section>

            {/* How it Works Section */}
            <section className="max-w-5xl mx-auto py-20 px-4 bg-white">
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
            <section className="max-w-6xl mx-auto py-20 px-4 bg-white">
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
            {/* Footer with login button and sitemap/social links */}
            <footer className="w-full flex flex-col items-center justify-center py-12 mt-12 bg-white border-t border-gray-100">
              <button
                className="px-8 py-4 rounded-xl bg-white border border-green-600 text-green-700 font-bold text-lg shadow transition-all duration-200 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-300 mb-8"
                onClick={switchToLogin}
              >
                I already have an account
              </button>
              <div className="w-full flex flex-col md:flex-row justify-between items-center max-w-5xl mx-auto px-4 mb-8 gap-8">
                <div className="flex flex-col items-center md:items-start">
                  <span className="text-green-600 font-bold text-lg mb-2">SITEMAP</span>
                  <a href="#about" className="text-green-700 hover:underline mb-1">About</a>
                  <a href="#contact" className="text-green-700 hover:underline mb-1">Contact</a>
                  <a href="#privacy" className="text-green-700 hover:underline">Privacy</a>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-green-600 font-bold text-lg mb-2">FOLLOW</span>
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline mb-1">Instagram</a>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline mb-1">LinkedIn</a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">Twitter</a>
                </div>
              </div>
              <div className="flex flex-col items-center mt-4">
                <span className="text-5xl font-extrabold text-green-600 mb-2 tracking-tight drop-shadow-lg" style={{letterSpacing: '-0.03em'}}>SPROUT</span>
                <span className="text-gray-400 text-sm">© 2025 Sprout. All rights reserved.</span>
              </div>
            </footer>
          </div>
        } />
        <Route path="/login" element={<Login onLogin={handleLogin} onSwitchToSignup={switchToSignup} />} />
        <Route path="/signup" element={<Signup onSignup={handleSignup} onSwitchToLogin={switchToLogin} onboardingData={onboardingData} />} />
        <Route path="/onboarding" element={<OnboardingFlow showProfileUpdateBanner={showProfileUpdateBanner} prefill={userProfile} onComplete={handleOnboardingComplete} isProfileUpdate={!!user} />} />
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
            <Navigate to="/" replace />
          )
        } />
      </Routes>
    </div>
  )
}

export default App