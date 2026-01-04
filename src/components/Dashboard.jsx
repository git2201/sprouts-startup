// Updated Dashboard.jsx - Key changes for profile picture support

import { useState, useEffect } from 'react'
import { signOut } from '../library/auth.js'
import { findMatchesForUser, getMatchStatistics } from '../library/matching.js'
import { updateUserProfile, getUserProfile } from '../library/profiles.js'
import { 
  requestConnection, 
  getConnectionStatus, 
  sendConnectionEmail,
  getUserProfileById,
  deleteConnection
} from '../library/connections.js'
import { replaceProfilePicture } from '../library/storage.js' // NEW IMPORT
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../library/supabase.js'
import ProfilePictureUpload from '../components/ProfilePictureUpload.jsx' // NEW IMPORT

const Dashboard = ({ user, userProfile, setUserProfile, onLogout }) => {
  console.log('Dashboard.jsx: userProfile', userProfile);
  const navigate = useNavigate();
  
  // BYPASS FLAG for profile validation
  const BYPASS_PROFILE_VALIDATION = true;
  
  if (!user || (!userProfile && !BYPASS_PROFILE_VALIDATION) || !onLogout) {
    return <Navigate to="/" replace />;
  }
  
  const [matches, setMatches] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [successMessage, setSuccessMessage] = useState('')
  const [connections, setConnections] = useState({})
  const [connectingUsers, setConnectingUsers] = useState(new Set())
  const [showPersonalityNotification, setShowPersonalityNotification] = useState(true)
  const [avatarUploading, setAvatarUploading] = useState(false) // NEW STATE
  const [showAvatarUpload, setShowAvatarUpload] = useState(false) // NEW STATE

  // NEW: Handle profile picture upload
  const handleAvatarUpload = async (file) => {
    setAvatarUploading(true)
    setError('')

    try {
      const { avatarUrl, error: uploadError } = await replaceProfilePicture(
        file, 
        user.id, 
        userProfile?.avatar_url
      )

      if (uploadError) {
        setError('Failed to upload profile picture: ' + uploadError.message)
        return
      }

      // Update local state
      const updatedProfile = { ...userProfile, avatar_url: avatarUrl }
      setUserProfile(updatedProfile)
      setSuccessMessage('Profile picture updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
      setShowAvatarUpload(false)

    } catch (err) {
      console.error('Avatar upload error:', err)
      setError('Failed to upload profile picture')
    } finally {
      setAvatarUploading(false)
    }
  }

  // Check if user has completed personality survey - MOVED TO TOP
  const hasCompletedPersonalitySurvey = () => {
    // Check if user has personality-related fields in their profile
    return userProfile?.personality_type || 
           userProfile?.work_style_preference || 
           userProfile?.communication_style || 
           userProfile?.leadership_style || 
           userProfile?.personality_completed === true;
  }

  const handlePersonalityQuizClick = () => {
    // TODO: Navigate to personality quiz page when it's created
    // For now, just hide the notification
    setShowPersonalityNotification(false);
    console.log('Navigating to personality quiz...');
  }

  // Get user's first name - with fallback for empty profiles
  const getUserFirstName = () => {
    if (userProfile?.name) {
      return userProfile.name.split(' ')[0]
    }
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.split(' ')[0]
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'there'
  }

  // Function to calculate compatibility score between two users
  const calculateCompatibilityScore = (currentUser, otherUser) => {
    let score = 0;
    let totalFactors = 0;

    // Role compatibility (looking for complementary roles)
    if (currentUser.roles && otherUser.roles) {
      const currentRoles = Array.isArray(currentUser.roles) ? currentUser.roles : [];
      const otherRoles = Array.isArray(otherUser.roles) ? otherUser.roles : [];
      
      // Check if they have complementary roles (different roles = better match)
      const hasComplementaryRoles = currentRoles.some(role => !otherRoles.includes(role)) && 
                                   otherRoles.some(role => !currentRoles.includes(role));
      if (hasComplementaryRoles) score += 30;
      totalFactors += 30;
    }

    // Industry alignment (same industry = better match)
    if (currentUser.industries && otherUser.industries) {
      const currentIndustries = Array.isArray(currentUser.industries) ? currentUser.industries : [];
      const otherIndustries = Array.isArray(otherUser.industries) ? otherUser.industries : [];
      
      const commonIndustries = currentIndustries.filter(industry => 
        otherIndustries.includes(industry)
      );
      if (commonIndustries.length > 0) score += 25;
      totalFactors += 25;
    }

    // Motivation alignment
    if (currentUser.motivations && otherUser.motivations) {
      const currentMotivations = Array.isArray(currentUser.motivations) ? currentUser.motivations : [];
      const otherMotivations = Array.isArray(otherUser.motivations) ? otherUser.motivations : [];
      
      const commonMotivations = currentMotivations.filter(motivation => 
        otherMotivations.includes(motivation)
      );
      if (commonMotivations.length > 0) score += 20;
      totalFactors += 20;
    }

    // Communication style compatibility
    if (currentUser.communication_style && otherUser.communication_style) {
      if (currentUser.communication_style === otherUser.communication_style) {
        score += 15;
      }
      totalFactors += 15;
    }

    // Availability compatibility
    if (currentUser.availability && otherUser.availability) {
      if (currentUser.availability === otherUser.availability) {
        score += 10;
      }
      totalFactors += 10;
    }

    // Return percentage score
    return totalFactors > 0 ? Math.round((score / totalFactors) * 100) : 0;
  };

  // Function to get avatar emoji based on roles or default
  const getAvatarForUser = (profile) => {
    const roles = Array.isArray(profile.roles) ? profile.roles : [];
    
    if (roles.includes('Technical Co-founder') || roles.includes('CTO') || roles.includes('Developer')) {
      return '👨‍💻';
    } else if (roles.includes('Business Co-founder') || roles.includes('CEO') || roles.includes('Sales')) {
      return '👨‍💼';
    } else if (roles.includes('Designer') || roles.includes('Creative')) {
      return '🎨';
    } else if (roles.includes('Marketing') || roles.includes('Growth')) {
      return '📈';
    } else if (roles.includes('Product Manager')) {
      return '📱';
    } else {
      return '👤';
    }
  };

  // Function to get seeking text based on what they're looking for
  const getSeekingText = (profile) => {
    const roles = Array.isArray(profile.roles) ? profile.roles : [];
    
    // If they're technical, they're probably seeking business
    if (roles.includes('Technical Co-founder') || roles.includes('CTO') || roles.includes('Developer')) {
      return 'Business Co-founder';
    }
    // If they're business, they're probably seeking technical
    else if (roles.includes('Business Co-founder') || roles.includes('CEO') || roles.includes('Sales')) {
      return 'Technical Co-founder';
    }
    // Default based on what they might be missing
    else {
      return 'Co-founder';
    }
  };

  // Load real user profiles and calculate matches
  useEffect(() => {
    const loadMatches = async () => {
      if (!user?.id) return;
      setLoading(true);
      setError(null);
      
      try {
        console.log('Loading matches for user:', user.id);
        
        // Fetch all profiles except the current user
        const { data: allProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', user.id) // Exclude current user
          .limit(20); // Limit to reasonable number

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          setError('Failed to load potential matches');
          return;
        }

        if (!allProfiles || allProfiles.length === 0) {
          console.log('No other profiles found');
          setMatches([]);
          return;
        }

        console.log('Found profiles:', allProfiles.length);

        // Calculate compatibility scores and sort by score
        const profilesWithScores = allProfiles.map(profile => ({
          ...profile,
          compatibilityScore: calculateCompatibilityScore(userProfile || {}, profile),
          avatar: profile.avatar_url || getAvatarForUser(profile), // UPDATED: Use avatar_url if available
          seeking: getSeekingText(profile)
        }));

        // Sort by compatibility score (highest first) and take top matches
        const sortedMatches = profilesWithScores
          .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
          .slice(0, 10); // Show top 10 matches

        console.log('Calculated matches with scores:', sortedMatches);
        setMatches(sortedMatches);

      } catch (err) {
        console.error('Error loading matches:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    loadMatches();
  }, [user?.id, userProfile]);

  // ... rest of your existing functions remain the same ...
  
  const handleLogout = async () => {
    console.log('Sign Out button clicked in Dashboard');
    await signOut()
    onLogout()
  }

  const handleEditProfile = () => {
    console.log('Navigating to profile edit...');
    navigate('/profile-edit');
  };

  const handleConnect = async (profileId) => {
    if (connectingUsers.has(profileId)) return;
    
    setConnectingUsers(prev => new Set([...prev, profileId]));
    
    try {
      // Here you would implement the connection logic
      // For now, just show a success message
      setSuccessMessage('Connection request sent!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error connecting:', error);
      setError('Failed to send connection request');
    } finally {
      setConnectingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(profileId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 font-poppins flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🌱</div>
          <h2 className="text-2xl font-bold text-gray-900">Loading your matches...</h2>
          <p className="text-gray-600 mt-2">Finding the perfect co-founders for you</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🌱</div>
              <h1 className="text-xl font-bold text-gray-900">Sprout</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                onClick={handleEditProfile}
              >
                Edit Profile
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {successMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-400">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Upload Modal */}
      {showAvatarUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Update Profile Picture</h3>
              <button
                onClick={() => setShowAvatarUpload(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <ProfilePictureUpload
              currentImageUrl={userProfile?.avatar_url}
              onImageUpload={handleAvatarUpload}
              loading={avatarUploading}
              size="large"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - User Profile Card */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="bg-gradient-to-r from-green-400 to-green-600 h-20 rounded-t-lg"></div>
              <div className="px-6 pb-6">
                <div className="relative -mt-10 mb-4">
                  <div 
                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-3xl border-4 border-white shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
                    onClick={() => setShowAvatarUpload(true)}
                  >
                    {userProfile?.avatar_url ? (
                      <img 
                        src={userProfile.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      userProfile?.avatar || getAvatarForUser(userProfile || {})
                    )}
                  </div>
                  {/* Camera icon overlay */}
                  <button
                    onClick={() => setShowAvatarUpload(true)}
                    className="absolute bottom-0 right-0 bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-green-700 transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {userProfile?.name || getUserFirstName()}
                </h3>
                <div className="border-t pt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Profile views</span>
                    <span className="text-green-600 font-medium">0</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Connections</span>
                    <span className="text-green-600 font-medium">0</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border mt-4 p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
              <div className="space-y-2">
                
                <button className="w-full text-left text-sm text-gray-600 hover:text-green-600 py-2 px-3 rounded hover:bg-gray-50 transition-colors">
                  View analytics
                </button>
                <button className="w-full text-left text-sm text-gray-600 hover:text-green-600 py-2 px-3 rounded hover:bg-gray-50 transition-colors">
                  Invite friends
                </button>
              </div>
            </div>
          </div>

          {/* Main Feed - Profiles */}
          <div className="col-span-12 lg:col-span-6">
            {/* Welcome Message */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, <span className="text-green-600">{getUserFirstName()}</span>!
              </h2>
              <p className="text-gray-600">
                Discover potential co-founders who match your vision and expertise.
              </p>
            </div>

            {/* Profiles Section */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold text-gray-900">Recommended Co-founders</h3>
                  <span className="text-sm text-gray-500">{matches.length} matches found</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">Based on your profile and preferences</p>
              </div>

              <div className="divide-y">
                {matches.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-4xl mb-4">🔍</div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No matches found yet</h4>
                    <p className="text-gray-600">
                      Complete your profile and come back later as more users join the platform.
                    </p>
                  </div>
                ) : (
                  matches.map((profile) => (
                    <div key={profile.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start space-x-4">
                        <div className="text-4xl">
                          {profile.avatar_url ? (
                            <img 
                              src={profile.avatar_url} 
                              alt={profile.name || 'User'} 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            profile.avatar
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="text-lg font-semibold text-gray-900">{profile.name || 'Anonymous User'}</h4>
                                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                                  {profile.compatibilityScore}% match
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {profile.title || 'Entrepreneur'} 
                                {profile.company && ` • ${profile.company}`}
                              </p>
                              {profile.location && (
                                <p className="text-sm text-gray-500 flex items-center mt-1">
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                  </svg>
                                  {typeof profile.location === 'string' ? profile.location : 
                                   `${profile.location?.city || ''}${profile.location?.city && profile.location?.state_region ? ', ' : ''}${profile.location?.state_region || ''}${profile.location?.state_region && profile.location?.country ? ', ' : ''}${profile.location?.country || ''}`}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                                Seeking: {profile.seeking}
                              </span>
                            </div>
                          </div>
                          <p className="text-gray-700 mt-3 text-sm leading-relaxed">
                            {profile.bio || profile.description || 'Building the next big thing. Looking for a co-founder to join the journey.'}
                          </p>
                          
                          {/* Skills/Roles */}
                          {profile.roles && profile.roles.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {profile.roles.slice(0, 3).map((role, index) => (
                                <span key={index} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded font-medium">
                                  {role}
                                </span>
                              ))}
                              {profile.roles.length > 3 && (
                                <span className="inline-block text-gray-500 text-xs px-2 py-1">
                                  +{profile.roles.length - 3} more
                                </span>
                              )}
                            </div>
                          )}

                          {/* Industries */}
                          {profile.industries && profile.industries.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {profile.industries.slice(0, 2).map((industry, index) => (
                                <span key={index} className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-medium">
                                  {industry}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between mt-4">
                            <button className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                              View profile
                            </button>
                            <button 
                              onClick={() => handleConnect(profile.id)}
                              disabled={connectingUsers.has(profile.id)}
                              className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {connectingUsers.has(profile.id) ? 'Connecting...' : 'Connect'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-12 lg:col-span-3">
            {/* Stats Card */}
            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <h4 className="font-semibold text-gray-900 mb-4">Your Matching Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total matches</span>
                  <span className="text-sm font-medium text-gray-900">{matches.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">High compatibility</span>
                  <span className="text-sm font-medium text-green-600">
                    {matches.filter(m => m.compatibilityScore >= 70).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Profile completeness</span>
                  <span className="text-sm font-medium text-blue-600">
                    {userProfile ? Math.min(100, Object.keys(userProfile).length * 10) : 0}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Boost Your Startup</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Get premium features and priority matching with Sprout Pro
                </p>
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Learn More
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg border p-6">
              <h4 className="font-semibold text-gray-900 mb-2">Trending Topics</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">#Placeholder</span>
                  <span className="text-xs text-gray-500">XYZ posts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">#Placeholder</span>
                  <span className="text-xs text-gray-500">XYZ posts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">#Placeholder</span>
                  <span className="text-xs text-gray-500">XYZ posts</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">#Placeholder</span>
                  <span className="text-xs text-gray-500">XYZ posts</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personality Quiz Notification */}
      {showPersonalityNotification && !hasCompletedPersonalitySurvey() && (
        <div className="fixed bottom-6 right-6 z-50">
          <div 
            className="bg-red-500 text-white p-4 rounded-lg shadow-lg cursor-pointer hover:bg-red-600 transition-colors max-w-sm"
            onClick={handlePersonalityQuizClick}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">Complete Personality Quiz</h4>
                <p className="text-sm opacity-90">Get better matching results by completing our personality assessment</p>
              </div>
              <button 
                className="flex-shrink-0 text-white hover:text-gray-200 ml-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPersonalityNotification(false);
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
