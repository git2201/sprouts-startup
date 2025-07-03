import { useState, useEffect } from 'react'
import { signOut } from '../library/auth.js'
import { findMatchesForUser, getMatchStatistics } from '../library/matching.js'

const Dashboard = ({ user, userProfile, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [matches, setMatches] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showProfile, setShowProfile] = useState(false)

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

  // Load matches and stats
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) return
      
      setLoading(true)
      setError(null)
      
      try {
        // Load matches for current user
        const { matches: userMatches, error: matchesError } = await findMatchesForUser(user.id, 6)
        if (matchesError) {
          console.error('Error loading matches:', matchesError)
          setError('Failed to load matches')
        } else {
          setMatches(userMatches)
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

  const getMatchScoreColor = (score) => {
    if (score >= 90) return 'text-green-600 bg-green-100'
    if (score >= 80) return 'text-blue-600 bg-blue-100'
    if (score >= 70) return 'text-yellow-600 bg-yellow-100'
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
              <button
                onClick={() => setActiveTab('matches')}
                className="btn-primary"
              >
                View Your Matches
              </button>
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

            {/* Stats Section */}
            {stats && (
              <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Community Stats</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-2">👥</div>
                    <h4 className="font-bold text-gray-900 text-lg">{stats.totalUsers}</h4>
                    <p className="text-gray-700">Total Users</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-2">🤝</div>
                    <h4 className="font-bold text-gray-900 text-lg">{stats.totalMatches}</h4>
                    <p className="text-gray-700">Possible Matches</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-2">📊</div>
                    <h4 className="font-bold text-gray-900 text-lg">{stats.averageMatchScore}%</h4>
                    <p className="text-gray-700">Avg Match Score</p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 text-center">
                    <div className="text-3xl mb-2">⚡</div>
                    <h4 className="font-bold text-gray-900 text-lg">{stats.activeUsers}</h4>
                    <p className="text-gray-700">Active Users</p>
                  </div>
                </div>
              </div>
            )}

            {/* Profile Summary */}
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h3 className="text-3xl font-bold text-gray-900 mb-8">Your Profile Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 rounded-2xl p-6">
                  <div className="text-3xl mb-4">{getRoleEmoji(userProfile?.role)}</div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Your Superpower</h4>
                  <p className="text-gray-700 font-medium">{userProfile?.role || 'Not specified'}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                  <div className="text-3xl mb-4">{getPersonalityEmoji(userProfile?.personality)}</div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Personality Type</h4>
                  <p className="text-gray-700 font-medium">{userProfile?.personality || 'Not specified'}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                  <div className="text-3xl mb-4">{getWorkStyleEmoji(userProfile?.work_style)}</div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Work Style</h4>
                  <p className="text-gray-700 font-medium">{userProfile?.work_style || 'Not specified'}</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6">
                  <div className="text-3xl mb-4">💪</div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Motivation</h4>
                  <p className="text-gray-700 font-medium">{userProfile?.motivation || 'Not specified'}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6">
                  <div className="text-3xl mb-4">🤝</div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Cofounder Preference</h4>
                  <p className="text-gray-700 font-medium">{userProfile?.cofounder_preference || 'Not specified'}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                  <div className="text-3xl mb-4">🌱</div>
                  <h4 className="font-bold text-gray-900 mb-2 text-lg">Startup Stage</h4>
                  <p className="text-gray-700 font-medium">{userProfile?.startup_stage || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-4xl font-bold text-gray-900">Your Matches</h2>
              <p className="text-xl text-gray-600 font-medium">Based on your profile preferences</p>
            </div>
            
            {matches.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100">
                <div className="text-6xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Still looking for your ideal match</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  We're actively searching for cofounders who match your profile. New people join every day, so check back soon!
                </p>
                <div className="space-y-4">
                  <button className="btn-primary">
                    Invite Friends to Join
                  </button>
                  <div className="text-sm text-gray-500">
                    <p>💡 Tip: The more people who join, the better your matches will be!</p>
                  </div>
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map((match) => (
                <div key={match.id} className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-xl transition-shadow border border-gray-100">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{match.avatar}</div>
                      <div>
                        <h3 className="font-bold text-gray-900 text-xl">{match.name}</h3>
                          <p className="text-gray-600 font-medium">{match.profile.role}</p>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold ${getMatchScoreColor(match.matchScore)}`}>
                      {match.matchScore}% match
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Personality:</span>
                        <span className="font-semibold">{match.profile.personality}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Work Style:</span>
                        <span className="font-semibold">{match.profile.work_style}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Motivation:</span>
                        <span className="font-semibold">{match.profile.motivation}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">Stage:</span>
                        <span className="font-semibold">{match.profile.startup_stage}</span>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex space-x-3">
                    <button className="btn-primary flex-1">
                      Connect
                    </button>
                    <button className="btn-secondary">
                      View Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard