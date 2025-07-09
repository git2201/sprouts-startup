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
import ConnectionStatus from './ConnectionStatus.jsx'
import { Navigate } from 'react-router-dom';

const Dashboard = ({ user, userProfile, setUserProfile, onLogout }) => {
  if (!user || !userProfile || !onLogout) {
    return <Navigate to="/login" replace />;
  }
  console.log('Dashboard rendered', { onLogout });
  const [activeTab, setActiveTab] = useState('overview')
  const [matches, setMatches] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [editFields, setEditFields] = useState({
    interests: userProfile?.interests || '',
  })
  const [editingInterests, setEditingInterests] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [selectedProfile, setSelectedProfile] = useState(null)
  const [showProfileModal, setShowProfileModal] = useState(false)
  
  // New state for connection flow
  const [connections, setConnections] = useState({})
  const [connectingUsers, setConnectingUsers] = useState(new Set())
  // Remove PaymentModal, StripeBuyButton, handlePayment, handlePaymentSuccess, handlePaymentError, paymentError, showPaymentModal, selectedConnection, and payment-related imports
  // Remove Suggested Matches tab and all related UI and logic
  // Only keep Overview tab and logic for profile display and connection fetching
  // New state for pause functionality
  const [pauseUntil, setPauseUntil] = useState(null)
  const [showPauseDialog, setShowPauseDialog] = useState({ open: false, match: null })

  // Get user's first name
  const getUserFirstName = () => {
    if (user?.user_metadata?.name) {
      return user.user_metadata.name.split(' ')[0]
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'there'
  }

  // Load matches, stats, and connection statuses
  useEffect(() => {
    console.log('Dashboard useEffect running, user:', user);
    const loadData = async () => {
      if (!user?.id) {
        console.log('No user.id, skipping loadData');
        return;
      }
      setLoading(true)
      setError(null)
      try {
        // Load matches for current user
        const { matches: userMatches, error: matchesError } = await findMatchesForUser(user.id, 1)
        console.log('findMatchesForUser result:', userMatches, matchesError);
        // Debug: print all matches and their scores
        if (userMatches) {
          console.log('Matches:', userMatches.map(m => ({ name: m.name, score: m.matchScore })));
        }
        if (matchesError) {
          console.error('Error loading matches:', matchesError)
          setError('Failed to load matches')
        } else {
          setMatches(userMatches)
          // Automatically create a connection for each match shown
          userMatches.forEach(async (match) => {
            try {
              await requestConnection(user.id, match.id);
            } catch (err) {
              console.error('Failed to create connection for match', match.id, err);
            }
          });
          // Load connection statuses for all matches
          const connectionStatuses = {}
          for (const match of userMatches) {
            const { connection } = await getConnectionStatus(user.id, match.id)
            connectionStatuses[match.id] = connection
          }
          setConnections(connectionStatuses)
        }

        // Load statistics
        const { stats: matchStats, error: statsError } = await getMatchStatistics()
        if (statsError) {
          console.error('Error loading stats:', statsError)
        } else {
          setStats(matchStats)
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err)
        setError('Failed to load dashboard data')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.id])

  // Handle connection request
  const handleConnect = async (targetUserId, targetUserName) => {
    if (!user?.id) return
    
    setConnectingUsers(prev => new Set(prev).add(targetUserId))
    
    try {
      const result = await requestConnection(user.id, targetUserId)
      
      if (result.success) {
        // Immediately re-fetch the latest connection status
        const { connection: latestConnection } = await getConnectionStatus(user.id, targetUserId)
        setConnections(prev => ({
          ...prev,
          [targetUserId]: latestConnection || result.connection
        }))
        // Show a message if both users have connected
        if (latestConnection && latestConnection.user_a_connected && latestConnection.user_b_connected) {
          setSuccessMessage('You have both decided to connect! Proceed to payment.');
          setTimeout(() => setSuccessMessage(''), 4000)
        } else {
          // Send email notification if this is the first connection
          if (!result.connection.user_b_connected) {
            const { profile: targetProfile } = await getUserProfileById(targetUserId)
            if (targetProfile?.email) {
              await sendConnectionEmail(
                targetProfile.email,
                targetProfile.name || targetUserName,
                userProfile?.name || getUserFirstName()
              )
            }
          }
          setSuccessMessage('Connection request sent!')
          setTimeout(() => setSuccessMessage(''), 3000)
        }
      } else {
        // Handle session expiration errors
        if (result.error && (result.error.toLowerCase().includes('invalid refresh token') || result.error.toLowerCase().includes('refresh token not found'))) {
          // Log out, clear storage, and prompt re-login
          if (typeof localStorage !== 'undefined') localStorage.clear();
          if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
          if (typeof window !== 'undefined') window.location.reload();
          setError('Session expired or invalid. Please log in again.');
        } else {
        setError(result.error)
        setTimeout(() => setError(null), 5000)
        }
      }
    } catch (err) {
      // Handle session expiration errors
      if (err.message && (err.message.toLowerCase().includes('invalid refresh token') || err.message.toLowerCase().includes('refresh token not found'))) {
        if (typeof localStorage !== 'undefined') localStorage.clear();
        if (typeof sessionStorage !== 'undefined') sessionStorage.clear();
        if (typeof window !== 'undefined') window.location.reload();
        setError('Session expired or invalid. Please log in again.');
      } else {
      console.error('Error requesting connection:', err)
      setError('Failed to send connection request')
      setTimeout(() => setError(null), 5000)
      }
    } finally {
      setConnectingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(targetUserId)
        return newSet
      })
    }
  }

  // Remove PaymentModal, StripeBuyButton, handlePayment, handlePaymentSuccess, handlePaymentError, paymentError, showPaymentModal, selectedConnection, and payment-related imports
  // Remove Suggested Matches tab and all related UI and logic
  // Only keep Overview tab and logic for profile display and connection fetching
  // Helper to generate persona name
  const getPersonaName = () => {
    if (!userProfile) return ''
    const role = userProfile.role || userProfile.roles?.[0] || ''
    const vibe = userProfile.personality?.toLowerCase() || ''
    if (role && vibe) {
      if (role.toLowerCase().includes('visionary')) return 'The Visionary Hustler'
      if (role.toLowerCase().includes('technical') || role.toLowerCase().includes('coder')) return 'Mission-Driven Coder'
      if (role.toLowerCase().includes('pm') || role.toLowerCase().includes('operator')) return 'Detail-Oriented PM'
      if (role.toLowerCase().includes('designer')) return 'Design-Obsessed Operator'
      if (role.toLowerCase().includes('marketer')) return 'Growth-Focused Hustler'
      if (role.toLowerCase().includes('sales')) return 'The Rainmaker'
      if (role.toLowerCase().includes('generalist')) return 'Late-Night Generalist'
      return `${vibe.charAt(0).toUpperCase() + vibe.slice(1)} ${role.charAt(0).toUpperCase() + role.slice(1)}`
    }
    return 'Sprout Founder'
  }

  // Helper to summarize roles/skills
  const getRolesSkills = () => {
    if (!userProfile) return ''
    const roles = userProfile.roles?.join(', ') || userProfile.role || ''
    const preferred = userProfile.preferred_role || ''
    return roles && preferred
      ? `Strong in ${roles}. Prefers to ${preferred.toLowerCase()}.`
      : roles
  }

  // Helper for motivation
  const getMotivation = () => {
    if (!userProfile) return ''
    const m = userProfile.top_motivation || userProfile.motivation || ''
    if (!m) return ''
    return `Driven by ${m.toLowerCase()} and the desire to build something meaningful.`
  }

  // Helper for work style
  const getWorkStyle = () => {
    if (!userProfile) return ''
    const avail = userProfile.availability?.replace('_', '–').replace('full_time', 'Full-time') || ''
    const chrono = userProfile.chronotype || ''
    const comm = userProfile.communication || ''
    const team = userProfile.team_style || ''
    let availText = ''
    if (avail === 'nights–weekends') availText = 'Nights/weekends only'
    else if (avail === '10–20') availText = '10–20 hrs/week'
    else if (avail === '20–40') availText = '20–40 hrs/week'
    else if (avail === 'Full-time') availText = 'Full-time'
    else availText = avail
    let chronoText = chrono === 'night' ? 'most productive at night' : chrono === 'morning' ? 'most productive in the morning' : chrono === 'midday' ? 'most productive midday' : chrono === 'flexible' ? 'flexible throughout the day' : chrono
    let commText = comm === 'async' ? 'prefers async communication' : comm === 'weekly_sync' ? 'prefers weekly check-ins' : comm === 'daily_checkin' ? 'prefers daily check-ins' : comm === 'depends' ? 'flexible communication style' : comm
    return `Available ${availText}, ${chronoText}, ${commText}, and ${team ? team : 'flexible in team structure'}.`
  }

  // Helper for personality blend
  const getPersonalityBlend = () => {
    if (!userProfile) return ''
    const p = userProfile.personality?.toLowerCase() || ''
    const c = userProfile.conflict_style || ''
    if (p && c) {
      if (p.includes('introvert')) return 'Introverted but thoughtful, with a calm and rational approach to conflict.'
      if (p.includes('extrovert')) return 'Extroverted and energetic, prefers to address conflict directly.'
      if (p.includes('creative')) return 'High on openness and creativity; prefers to address conflict directly and move fast.'
      if (p.includes('analytical')) return 'Structured thinker; prefers to resolve conflict rationally.'
    }
    return ''
  }

  const handleLogout = async () => {
    console.log('Sign Out button clicked in Dashboard');
    await signOut()
    onLogout()
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditingInterests(false); // Close modal immediately
    const { error } = await updateUserProfile(user.id, {
      ...userProfile,
      interests: editFields.interests,
    });
    if (!error) {
      // Re-fetch the latest profile from Supabase
      const { profile } = await getUserProfile(user.id);
      if (profile) setUserProfile(profile);
      setSuccessMessage('Your interests have been updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      alert('Error updating profile: ' + (error.message || JSON.stringify(error)));
    }
  };

  function getProfileSummary(profile) {
    const role = profile.role ? `${profile.role}. ` : '';
    const motivation = profile.top_motivation || profile.motivation || '';
    const motivationText = motivation
      ? `Driven by ${motivation.toLowerCase()} and the desire to build something meaningful.`
      : '';

    // Work style
    let avail = profile.availability || '';
    if (avail === '10–20') avail = '10–20 hrs/week';
    if (avail === '20–40') avail = '20–40 hrs/week';
    if (avail === 'full_time') avail = 'Full-time';
    const chrono = profile.chronotype || '';
    const comm = profile.communication || '';
    const team = profile.team_style || '';
    const workStyleText = `Available ${avail}${chrono ? `, ${chrono}` : ''}${comm ? `, ${comm}` : ''}${team ? `, and ${team}` : ''}.`;

    // Interests
    const interests = profile.interests ? `Interests: ${profile.interests}` : '';

    // Combine
    return [role, motivationText, workStyleText, interests]
      .filter(Boolean)
      .join('\n');
  }

  // Helper to check if user is paused
  const isUserPaused = () => {
    if (!userProfile || !userProfile.pause_until) return false;
    return new Date(userProfile.pause_until) > new Date();
  }

  // Handler for pause and remove match
  const handlePauseAndRemoveMatch = async (targetUserId, targetUserName) => {
    // Set pause until 100 years from now (effectively never)
    const pauseUntilDate = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();
    // Update user profile with pause_until
    await updateUserProfile(user.id, { ...userProfile, pause_until: pauseUntilDate });
    setPauseUntil(pauseUntilDate);
    // Remove the match/connection
    await deleteConnection(user.id, targetUserId);
    setSuccessMessage(`You have been permanently removed from the matching pool. If this was a mistake, please contact support.`);
    setShowPauseDialog({ open: false, match: null });
    // Optionally, refresh matches
    const { matches: userMatches } = await findMatchesForUser(user.id, 6);
    setMatches(userMatches);
    // --- NEW: Refresh matches for the other user (put them back in the pool) ---
    try {
      const { matches: targetUserMatches } = await findMatchesForUser(targetUserId, 6);
      console.log(`Refreshed matches for user ${targetUserId}:`, targetUserMatches);
    } catch (err) {
      console.error('Error refreshing matches for the other user:', err);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 font-poppins">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">🌱</div>
              <h1 className="text-xl font-bold text-gray-900">Sprout</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Remove Welcome, {name} and View Profile button */}
              <button
                onClick={handleLogout}
                className="btn-secondary text-sm"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {showProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowProfile(false)}>&times;</button>
            <div className="text-center">
              <div className="text-5xl mb-4">{userProfile?.avatar || '👤'}</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{userProfile?.name}</h2>
              <div className="text-lg text-green-600 font-semibold mb-2">{getPersonaName()}</div>
              <div className="mb-4 text-gray-700 font-medium">{getRolesSkills()}</div>
              <div className="mb-4 text-gray-700">{getMotivation()}</div>
              <div className="mb-4 text-gray-700">{getWorkStyle()}</div>
              <div className="mb-4 text-gray-700 italic">{getPersonalityBlend()}</div>
              <div className="mb-4 text-gray-700">
                <span className="font-semibold">Interests:</span>
                <div>{userProfile?.interests ? userProfile.interests : <span className="text-gray-400">Not specified</span>}</div>
              </div>
              <button
                className="btn-secondary"
                onClick={() => {
                  setEditFields({ interests: userProfile?.interests || '' });
                  setEditingInterests(true);
                }}
              >
                Edit Interests
              </button>
            </div>
          </div>
        </div>
      )}

      {editingInterests && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-40" style={{ zIndex: 9999, pointerEvents: 'auto' }}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative" style={{ zIndex: 10000, pointerEvents: 'auto', border: '2px solid #22c55e' }}>
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setEditingInterests(false)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Edit Your Interests</h2>
            <form
              onSubmit={e => { console.log('Save clicked, submitting form'); handleEditSubmit(e); }}
            >
              <textarea
                className="form-textarea w-full mb-4"
                rows={4}
                value={editFields.interests}
                onChange={e => setEditFields({ ...editFields, interests: e.target.value })}
                placeholder="E.g. I love hiking, building side projects, and reading about AI."
              />
              <button type="submit" className="btn-primary mr-2" tabIndex={0}>Save</button>
              <button type="button" className="btn-secondary" onClick={() => setEditingInterests(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          {successMessage}
        </div>
      )}

      {showPauseDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowPauseDialog({ open: false, match: null })}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Are you sure?</h2>
            <p className="mb-4 text-red-600 font-semibold">Warning: This will permanently remove you from the matching pool. You will need to contact support to rejoin in the future.</p>
            <p className="mb-4">If you choose not to match with <b>{showPauseDialog.match?.name}</b>, you will be removed from the matching pool forever.<br/>Are you sure you want to continue?</p>
            <div className="flex space-x-4">
              <button className="btn-primary" onClick={() => { handlePauseAndRemoveMatch(showPauseDialog.match.id, showPauseDialog.match.name); setShowPauseDialog({ open: false, match: null }); }}>Yes, remove and pause me</button>
              <button className="btn-secondary" onClick={() => setShowPauseDialog({ open: false, match: null })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
          </nav>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="text-red-400">⚠️</div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome back, <span className="text-green-600">{getUserFirstName()}</span>! 
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                We'll email you as soon as we find your ideal cofounder match and send you their details.
              </p>
              {/* Refer a Friend Button */}
              <div className="mb-4">
                <button
                  className="btn-primary"
                  onClick={async () => {
                    const shareUrl = window.location.origin;
                    const shareText = `Hey! 👋\n\nI just found an awesome platform called Sprout that matches you with the perfect cofounder based on your skills, interests, and working style. I think you'd love it!\n\nCheck it out: ${shareUrl}\n\nLet's build something great together! 🚀`;
                    if (navigator.share) {
                      try {
                        await navigator.share({
                          title: "Join me on Sprout – Find your perfect cofounder!",
                          text: shareText,
                          url: shareUrl,
                        });
                      } catch (err) {
                        // User cancelled or error
                      }
                    } else {
                      await navigator.clipboard.writeText(shareText);
                      alert("Referral message copied! Paste it anywhere to share with a friend.");
                    }
                  }}
                >
                  Refer a Friend
                </button>
              </div>
              <p className="text-sm text-gray-500">
                💡 Invite friends to join and increase your chances of finding the perfect match!
              </p>
            </div>
          </div>
        )}
      </main>

      {showProfileModal && selectedProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-lg w-full relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
              onClick={() => setShowProfileModal(false)}
            >
              ×
            </button>
            <div className="flex flex-col items-center">
              {/* Only show interests, no name/avatar */}
              <div className="mt-4 w-full text-center">
                <span className="font-semibold">Interests:</span>{' '}
                {selectedProfile.interests && selectedProfile.interests.trim() !== ''
                  ? selectedProfile.interests
                  : <span className="text-gray-400 italic">Not specified</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard