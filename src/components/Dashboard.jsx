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
import PaymentModal from './PaymentModal.jsx'
import StripeBuyButton from './StripeBuyButton.jsx'
import { handlePaymentSuccess as updatePaymentInSupabase } from '../library/payments.js'

const Dashboard = ({ user, userProfile, setUserProfile, onLogout }) => {
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
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedConnection, setSelectedConnection] = useState(null)
  const [paymentError, setPaymentError] = useState(null)

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
        const { matches: userMatches, error: matchesError } = await findMatchesForUser(user.id, 6)
        console.log('findMatchesForUser result:', userMatches, matchesError);
        if (matchesError) {
          console.error('Error loading matches:', matchesError)
          setError('Failed to load matches')
        } else {
          setMatches(userMatches)
          
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
        setError(result.error)
        setTimeout(() => setError(null), 5000)
      }
    } catch (err) {
      console.error('Error requesting connection:', err)
      setError('Failed to send connection request')
      setTimeout(() => setError(null), 5000)
    } finally {
      setConnectingUsers(prev => {
        const newSet = new Set(prev)
        newSet.delete(targetUserId)
        return newSet
      })
    }
  }

  // Handle payment initiation
  const handlePayment = (connection, targetUserName) => {
    setSelectedConnection({ connection, targetUserName })
    setShowPaymentModal(true)
  }

  // Handle payment success
  const handlePaymentSuccess = async (result) => {
    // Update payment status in Supabase if possible
    if (result && result.connectionId && result.userId && result.paymentIntentId) {
      await updatePaymentInSupabase(result.connectionId, result.userId, result.paymentIntentId);
    }
    if (selectedConnection) {
      // Update connection status
      const { connection: latestConnection } = await getConnectionStatus(user.id, selectedConnection.connection.user_a_id === user.id ? selectedConnection.connection.user_b_id : selectedConnection.connection.user_a_id);
      setConnections(prev => ({
        ...prev,
        [selectedConnection.connection.user_b_id === user.id 
          ? selectedConnection.connection.user_a_id 
          : selectedConnection.connection.user_b_id]: latestConnection || result.connection
      }))
      setSuccessMessage('Payment completed! Contact information will be revealed once both users have paid.')
      setTimeout(() => setSuccessMessage(''), 5000)

      // If both users have paid, send confirmation email to both
      if (latestConnection && latestConnection.user_a_paid && latestConnection.user_b_paid) {
        // Fetch both user profiles
        const { profile: userAProfile } = await getUserProfileById(latestConnection.user_a_id)
        const { profile: userBProfile } = await getUserProfileById(latestConnection.user_b_id)
        // Send confirmation email to both
        if (userAProfile?.email && userBProfile?.email) {
          await sendConnectionEmail(
            userAProfile.email,
            userAProfile.name || 'Your partner',
            userBProfile.name || 'Your partner',
            userBProfile.email // partner's email
          )
          await sendConnectionEmail(
            userBProfile.email,
            userBProfile.name || 'Your partner',
            userAProfile.name || 'Your partner',
            userAProfile.email // partner's email
          )
        }
      }
    }
  }

  // Handle payment error
  const handlePaymentError = (error) => {
    setPaymentError(error)
    setTimeout(() => setPaymentError(null), 5000)
  }

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
    if (score >= 60) return 'text-orange-600 bg-orange-100'
    return 'text-gray-600 bg-gray-100'
  }

  const getRoleEmoji = (role) => {
    const emojis = {
      'engineer': '💻',
      'business': '📈',
      'designer': '🎨',
      'product': '📱',
      'finance': '💰',
      'technical': '💻',
      'visionary': '🚀',
      'operator': '⚙️',
      'sales': '💼',
      'marketer': '📢'
    }
    return emojis[role?.toLowerCase()] || '👤'
  }

  const getPersonalityEmoji = (personality) => {
    const emojis = {
      'analytical': '📊',
      'creative': '💡',
      'collaborative': '🤝',
      'driven': '🔥',
      'balanced': '⚖️',
      'introvert': '🧘',
      'extrovert': '🎉',
      'ambitious': '🏆',
      'calm': '😌'
    }
    return emojis[personality?.toLowerCase()] || '🧠'
  }

  const getWorkStyleEmoji = (workStyle) => {
    const emojis = {
      'async': '⏰',
      'real-time': '⚡',
      'flexible': '🔄',
      'structured': '📋',
      'collaborative': '👥'
    }
    return emojis[workStyle?.toLowerCase()] || '💼'
  }

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
    // Set pause until 36 hours from now
    const pauseUntilDate = new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString();
    // Update user profile with pause_until
    await updateUserProfile(user.id, { ...userProfile, pause_until: pauseUntilDate });
    setPauseUntil(pauseUntilDate);
    // Remove the match/connection
    await deleteConnection(user.id, targetUserId);
    setSuccessMessage(`You have been paused from matching for 36 hours. You can match again after ${new Date(pauseUntilDate).toLocaleString()}.`);
    setShowPauseDialog({ open: false, match: null });
    // Optionally, refresh matches
    const { matches: userMatches } = await findMatchesForUser(user.id, 6);
    setMatches(userMatches);
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
              <span className="text-sm text-gray-600">
                Welcome, <span className="font-semibold">{getUserFirstName()}</span>
              </span>
              <button
                onClick={() => setShowProfile(true)}
                className="btn-secondary text-sm"
              >
                View Profile
              </button>
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
              <div className="text-lg text-primary-600 font-semibold mb-2">{getPersonaName()}</div>
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
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative" style={{ zIndex: 10000, pointerEvents: 'auto', border: '2px solid #7c3aed' }}>
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

      {paymentError && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-xl shadow-lg z-50">
          Payment Error: {paymentError}
        </div>
      )}

      {showPauseDialog.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
            <button className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl" onClick={() => setShowPauseDialog({ open: false, match: null })}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Are you sure?</h2>
            <p className="mb-4">If you choose not to match with <b>{showPauseDialog.match?.name}</b>, you will be removed from the matching pool for 36 hours. <br/>You can match again after that. <br/>Are you sure you want to continue?</p>
            <div className="flex space-x-4">
              <button className="btn-primary" onClick={() => handlePauseAndRemoveMatch(showPauseDialog.match.id, showPauseDialog.match.name)}>Yes, remove and pause me</button>
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
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('matches')}
              className={`py-2 px-1 border-b-2 font-semibold text-sm transition-colors ${
                activeTab === 'matches'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Suggested Matches
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
                Welcome back, <span className="text-primary-600">{getUserFirstName()}</span>! 
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                {matches.length > 0 ? (
                  <>We've found <span className="font-bold text-primary-600">{matches.length} potential cofounders</span> who match your profile and could be perfect for your next venture.</>
                ) : (
                  <>We're actively searching for your ideal cofounder match. New people join every day, so check back soon!</>
                )}
              </p>
              {matches.length > 0 ? (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="btn-primary"
                  >
                    View Your Matches
                  </button>
                  <button
                    className="btn-secondary"
                    onClick={async () => {
                      const shareUrl = window.location.origin;
                      const shareText = `Hey! 👋

I just found an awesome platform called Sprout that matches you with the perfect cofounder based on your skills, interests, and working style. I think you'd love it!

Check it out: ${shareUrl}

Let's build something great together! 🚀`;

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
              ) : (
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveTab('matches')}
                    className="btn-secondary"
                  >
                    Check for Matches
                  </button>
                  <p className="text-sm text-gray-500">
                    💡 Invite friends to join and increase your chances of finding the perfect match!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <h2 className="text-4xl font-bold text-gray-900 mb-8 text-center">Your Ideal Cofounder</h2>
            <div className="w-full flex justify-center">
              <div className="grid grid-cols-1" style={{ maxWidth: 480, width: '100%' }}>
                {isUserPaused() ? (
                  <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 flex flex-col items-center justify-center" style={{ minHeight: 350 }}>
                    <div className="text-6xl mb-6">⏳</div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">You have been paused from matching</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      You can continue matching after 36 hours.<br/>
                      {userProfile?.pause_until && (
                        <span className="block mt-2 text-primary-600 font-semibold">Resume: {new Date(userProfile.pause_until).toLocaleString()}</span>
                      )}
                    </p>
                    <div className="text-sm text-gray-500">
                      <p>Take this time to reflect on what you're looking for in a cofounder, or update your profile to improve your future matches!</p>
                    </div>
                  </div>
                ) : (
                  matches.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                      <div className="text-6xl mb-6">🔍</div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Still looking for your ideal match</h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        We're actively searching for cofounders who match your profile. New people join every day, so check back soon!
                      </p>
                      <div className="space-y-4">
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
                          Invite Friends to Join
                        </button>
                        <div className="text-sm text-gray-500">
                          <p>💡 Tip: The more people who join, the better your matches will be!</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    matches.map((match) => {
                      // Debug log: print the match score received from backend
                      console.log(`Frontend displaying match for ${match.name}: matchScore =`, match.matchScore);
                      const connection = connections[match.id];
                      const notConnectedYet = !connection || (!connection.user_a_connected && !connection.user_b_connected);
                      return (
                        <div
                          key={match.id}
                          className="bg-white rounded-3xl p-10 shadow-lg border border-gray-100 flex flex-col items-center"
                          style={{ minWidth: 350, maxWidth: 480, margin: '0 auto' }}
                        >
                          <div className="flex flex-col items-center mb-6 w-full">
                            <div className="text-6xl mb-2">{match.avatar}</div>
                            <h3 className="font-bold text-2xl text-gray-900">{match.name}</h3>
                            <p className="text-gray-600 font-medium text-lg mb-2">{match.profile.role}</p>
                            <span
                              className={`px-6 py-2 rounded-full text-lg font-bold mt-2 ${getMatchScoreColor(match.matchScore)}`}
                              style={{ display: 'inline-block' }}
                            >
                              {Number(match.matchScore).toFixed(1)}% match
                            </span>
                          </div>
                          <div className="mt-6 space-y-2 text-left">
                            {/* Roles / Strengths */}
                            <div>
                              <span className="font-semibold">Roles / Strengths:</span>
                              <span className="ml-2">
                                {Array.isArray(match.profile.roles) && match.profile.roles.length > 0
                                  ? match.profile.roles.join(', ')
                                  : <span className="text-gray-400 italic">Not specified</span>}
                              </span>
                            </div>

                            {/* Motivation */}
                            <div>
                              <span className="font-semibold">Motivation:</span>
                              <span className="ml-2">
                                {Array.isArray(match.profile.motivations) && match.profile.motivations.length > 0
                                  ? match.profile.motivations.join(', ')
                                  : <span className="text-gray-400 italic">Not specified</span>}
                              </span>
                            </div>

                            {/* Industries */}
                            <div>
                              <span className="font-semibold">Industries:</span>
                              <span className="ml-2">
                                {Array.isArray(match.profile.industries) && match.profile.industries.length > 0
                                  ? match.profile.industries.join(', ')
                                  : <span className="text-gray-400 italic">Not specified</span>}
                              </span>
                            </div>

                            {/* Availability */}
                            <div>
                              <span className="font-semibold">Availability:</span>
                              <span className="ml-2">
                                {match.profile.availability && match.profile.availability.trim() !== ''
                                  ? match.profile.availability
                                  : <span className="text-gray-400 italic">Not specified</span>}
                              </span>
                            </div>

                            {/* Interests (moved here) */}
                            <div>
                              <span className="font-semibold">Interests:</span>
                              <span className="ml-2">
                                {match.profile.interests && match.profile.interests.trim() !== ''
                                  ? match.profile.interests
                                  : <span className="text-gray-400 italic">Not specified</span>}
                              </span>
                            </div>
                          </div>
                          {!((Array.isArray(match.profile.roles) && match.profile.roles.length > 0) || match.profile.role || match.profile.motivation || match.profile.startup_stage || (match.profile.interests && match.profile.interests.trim() !== '')) && (
                            <div className="text-gray-400 italic">No details provided yet.</div>
                          )}
                          <div className="mt-6 flex space-x-3 w-full">
                            <ConnectionStatus
                              connection={connections[match.id]}
                              currentUserId={user.id}
                              targetUserName={match.name}
                              onConnect={() => handleConnect(match.id, match.name)}
                              onPayment={() => handlePayment(connections[match.id], match.name)}
                              isLoading={connectingUsers.has(match.id)}
                            />
                            {connections[match.id] &&
                              connections[match.id].user_a_connected &&
                              connections[match.id].user_b_connected &&
                              connections[match.id].user_a_paid &&
                              connections[match.id].user_b_paid && (
                                <div className="mt-4 p-4 bg-green-50 rounded-xl text-green-800 text-center">
                                  <div>
                                    <strong>Contact Info:</strong>
                                  </div>
                                  <div>
                                    Your partner's email: <span className="font-mono">{match.email}</span>
                                  </div>
                                </div>
                              )}
                          </div>
                          {notConnectedYet && !isUserPaused() && (
                            <button
                              className="btn-secondary mt-4"
                              onClick={() => setShowPauseDialog({ open: true, match })}
                            >
                              I don't want to match with {match.name}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )
                )}
              </div>
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

      {showPaymentModal && selectedConnection && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          connectionId={selectedConnection.connection.id}
          userId={user.id}
          targetUserName={selectedConnection.targetUserName}
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  )
}

export default Dashboard