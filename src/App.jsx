import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
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
import { hasDeprecatedRolesOrMissingFields } from './utils/profileValidation'
import { mapOnboardingDataToProfile } from './utils/onboardingMapper'

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
  const navigate = useNavigate();

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
    if (user && userProfile && authState !== 'dashboard' && authState !== 'onboarding') {
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
      
      // Map the onboarding form data to database fields
      const mappedData = mapOnboardingDataToProfile(formData);
      console.log('App.jsx: mapped data:', mappedData);
      
      const { error } = await updateUserProfile(user.id, mappedData);
      console.log('App.jsx: updateUserProfile finished, error:', error);
      
      // Always fetch the latest profile from Supabase after update
      const { profile: updatedProfile, error: fetchError } = await getUserProfile(user.id);
      console.log('App.jsx: getUserProfile after update, updatedProfile:', updatedProfile, 'fetchError:', fetchError);
      
      if (!error && updatedProfile) {
        setUserProfile(updatedProfile);
        console.log('App.jsx: setUserProfile called with', updatedProfile);
        setAuthState('dashboard');
        persistUserSession(user, updatedProfile);
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
        // Map onboarding data to database format
        const mappedOnboardingData = mapOnboardingDataToProfile(onboardingData);
        
        // Combine onboarding and signup data
        const profileData = {
          id: user.id,
          name: signupData.name,
          email: signupData.email,
          phone: signupData.phone,
          ...mappedOnboardingData,
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

  const onEditProfile = () => {
    setAuthState('onboarding');
    navigate('/onboarding');
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

  console.log('App.jsx: isProfileUpdate', !!user, 'user:', user, 'userProfile:', userProfile);

  return (
    <div className="app">
      <Header onLogout={handleLogout} />
      {redirect}
      <Routes>
        <Route path="/" element={
          <div className="min-h-screen bg-white font-sans">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-green-50 via-white to-green-50 py-20">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <h1 className="text-5xl lg:text-6xl font-light text-gray-900 leading-tight">
                      Connect with your
                      <span className="block font-semibold text-green-600">ideal co-founder</span>
                    </h1>
                    <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                      Join thousands of entrepreneurs building meaningful partnerships. 
                      Sprout's intelligent matching connects you with co-founders who share your vision and complement your expertise.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={switchToOnboarding}
                        className="bg-green-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors shadow-lg"
                      >
                        Get started for free
                      </button>
                      <button 
                        onClick={switchToLogin}
                        className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors"
                      >
                        Sign in
                      </button>
                    </div>
                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>2,500+ active founders</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>850+ successful matches</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Social Proof */}
            <section className="bg-gray-50 py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                    Trusted by founders from
                  </h2>
                  <div className="flex justify-center items-center space-x-12 opacity-60">
                    <div className="text-2xl font-bold text-gray-400">Y Combinator</div>
                    <div className="text-2xl font-bold text-gray-400">Techstars</div>
                    <div className="text-2xl font-bold text-gray-400">500 Startups</div>
                    <div className="text-2xl font-bold text-gray-400">Entrepreneur First</div>
                  </div>
                </div>
              </div>
            </section>

            {/* How it Works */}
            <section className="py-20 bg-white">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-light text-gray-900 mb-4">How Sprout works</h2>
                  <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Our proven process connects you with the right co-founder in three simple steps
                  </p>
                </div>
                
                <div className="grid md:grid-cols-3 gap-12">
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Create your profile</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Share your background, skills, and what you're looking for in a co-founder. Our detailed questionnaire ensures quality matches.
                    </p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Get matched</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Our algorithm analyzes compatibility across skills, vision, working style, and goals to find your ideal co-founder matches.
                    </p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Start building</h3>
                    <p className="text-gray-600 leading-relaxed">
                      Connect through our platform, schedule calls, and begin building your startup together with confidence.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Testimonials */}
            <section className="py-20 bg-gray-50">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-16">
                  <h2 className="text-4xl font-light text-gray-900 mb-4">Success stories</h2>
                  <p className="text-xl text-gray-600">Hear from founders who found their perfect match</p>
                </div>
                
                <div className="grid lg:grid-cols-2 gap-12">
                  <div className="bg-white rounded-xl p-8 shadow-sm">
                    <div className="mb-6">
                      <svg className="w-8 h-8 text-green-600 mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                      </svg>
                      <p className="text-lg text-gray-700 leading-relaxed mb-6">
                        "Finding my co-founder through Sprout was a game-changer. The matching algorithm really understood what I was looking for, and now we're building an incredible company together."
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">M</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Maria Rodriguez</div>
                        <div className="text-gray-500">Co-founder, FinanceFlow</div>
                        <div className="text-sm text-gray-400">Raised $2M Series A</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-8 shadow-sm">
                    <div className="mb-6">
                      <svg className="w-8 h-8 text-green-600 mb-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z"/>
                      </svg>
                      <p className="text-lg text-gray-700 leading-relaxed mb-6">
                        "The quality of matches on Sprout is exceptional. Within two weeks, I connected with someone who perfectly complemented my technical skills with their business expertise."
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-semibold">D</span>
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">David Kim</div>
                        <div className="text-gray-500">Co-founder, GreenTech Solutions</div>
                        <div className="text-sm text-gray-400">Y Combinator W23</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-green-600">
              <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-light text-white mb-6">
                  Ready to find your co-founder?
                </h2>
                <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
                  Join thousands of entrepreneurs who've found their perfect business partner through Sprout.
                </p>
                <button
                  onClick={switchToOnboarding}
                  className="bg-white text-green-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-50 transition-colors shadow-lg"
                >
                  Get started today
                </button>
                <p className="text-sm text-green-200 mt-4">Free to join • No credit card required</p>
              </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-4 gap-8 mb-12">
                  <div>
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-8 h-8 bg-green-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold">S</span>
                      </div>
                      <span className="text-2xl font-bold">Sprout</span>
                    </div>
                    <p className="text-gray-400 leading-relaxed">
                      Connecting entrepreneurs with their ideal co-founders through intelligent matching.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Product</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li><a href="#" className="hover:text-white transition-colors">How it works</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Success stories</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Company</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li><a href="#" className="hover:text-white transition-colors">About us</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-4">Connect</h4>
                    <ul className="space-y-2 text-gray-400">
                      <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
                      <li><a href="#" className="hover:text-white transition-colors">Newsletter</a></li>
                    </ul>
                  </div>
                </div>
                
                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
                  <p className="text-gray-400 text-sm">© 2025 Sprout. All rights reserved.</p>
                  <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
                    <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                    <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
                  </div>
                </div>
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
              onEditProfile={onEditProfile}
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
