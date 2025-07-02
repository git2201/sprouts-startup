import { supabase } from './supabase'
import { calculateMatchScore, getMatchQuality } from '../utils/matching.js'

// Get all user profiles from database
export async function getAllUserProfiles() {
  try {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'is', null)

    if (error) {
      console.error('Error fetching all profiles:', error)
      return { profiles: [], error: error.message }
    }

    return { profiles: profiles || [], error: null }
  } catch (error) {
    console.error('Error fetching all profiles:', error)
    return { profiles: [], error: error.message }
  }
}

// Convert database profile to matching algorithm format
function convertProfileToUserFormat(profile) {
  return {
    id: profile.id,
    name: profile.name || profile.email?.split('@')[0] || 'Anonymous',
    personality: {
      openness: profile.openness || 3,
      conscientiousness: profile.conscientiousness || 3,
      extraversion: profile.extraversion || 3,
      agreeableness: profile.agreeableness || 3,
      neuroticism: profile.neuroticism || 3
    },
    conflictStyle: profile.conflict_style || 'indirect',
    availability: profile.availability || 'depends',
    availabilityFlexibility: profile.availability_flexibility || 'slightly_flexible',
    chronotype: profile.chronotype || 'flexible',
    communication: profile.communication || 'depends',
    motivations: profile.motivations || [],
    topMotivation: profile.top_motivation || '',
    roles: profile.roles || [],
    preferredRole: profile.preferred_role || '',
    teamStyle: profile.team_style || '',
    cofounderFrustration: profile.cofounder_frustration || ''
  }
}

// Find matches for a specific user
export async function findMatchesForUser(userId, limit = 5) {
  try {
    // Get all profiles except the current user
    const { profiles: allProfiles, error } = await getAllUserProfiles()
    
    if (error) {
      return { matches: [], error }
    }

    // Get current user's profile
    const currentUserProfile = allProfiles.find(p => p.id === userId)
    if (!currentUserProfile) {
      return { matches: [], error: 'User profile not found' }
    }

    // Convert current user to matching format
    const currentUser = convertProfileToUserFormat(currentUserProfile)
    
    // Calculate matches with all other users
    const matches = []
    
    for (const profile of allProfiles) {
      if (profile.id === userId) continue // Skip self
      
      const otherUser = convertProfileToUserFormat(profile)
      const matchResult = calculateMatchScore(currentUser, otherUser)
      
      if (!matchResult.disqualified) {
        matches.push({
          id: profile.id,
          name: profile.name || profile.email?.split('@')[0] || 'Anonymous',
          email: profile.email,
          avatar: profile.avatar || '👤',
          matchScore: matchResult.score,
          categoryScores: matchResult.categoryScores,
          quality: getMatchQuality(matchResult.score).quality,
          profile: {
            role: profile.role || 'Not specified',
            personality: profile.personality || 'Not specified',
            work_style: profile.work_style || 'Not specified',
            motivation: profile.motivation || 'Not specified',
            cofounder_preference: profile.cofounder_preference || 'Not specified',
            startup_stage: profile.startup_stage || 'Not specified',
            availability: profile.availability || 'Not specified',
            communication: profile.communication || 'Not specified'
          }
        })
      }
    }
    
    // Sort by match score (highest first) and limit results
    matches.sort((a, b) => b.matchScore - a.matchScore)
    const topMatches = matches.slice(0, limit)
    
    return { matches: topMatches, error: null }
  } catch (error) {
    console.error('Error finding matches:', error)
    return { matches: [], error: error.message }
  }
}

// Find optimal pairings for all users (for admin/overview purposes)
export async function findOptimalPairings() {
  try {
    const { profiles: allProfiles, error } = await getAllUserProfiles()
    
    if (error) {
      return { pairings: [], error }
    }

    if (allProfiles.length < 2) {
      return { pairings: [], error: 'Need at least 2 users for pairing' }
    }

    // Convert all profiles to matching format
    const users = allProfiles.map(convertProfileToUserFormat)
    
    // Calculate all possible matches
    const allMatches = []
    
    for (let i = 0; i < users.length; i++) {
      for (let j = i + 1; j < users.length; j++) {
        const userA = users[i]
        const userB = users[j]
        const matchResult = calculateMatchScore(userA, userB)
        
        if (!matchResult.disqualified) {
          allMatches.push({
            userA: userA,
            userB: userB,
            score: matchResult.score,
            categoryScores: matchResult.categoryScores
          })
        }
      }
    }
    
    // Sort by score (highest first)
    allMatches.sort((a, b) => b.score - a.score)
    
    // Find optimal pairing using greedy algorithm
    const usedPeople = new Set()
    const optimalPairs = []
    let totalScore = 0
    
    for (const match of allMatches) {
      if (!usedPeople.has(match.userA.id) && !usedPeople.has(match.userB.id)) {
        optimalPairs.push({
          userA: {
            id: match.userA.id,
            name: match.userA.name,
            email: allProfiles.find(p => p.id === match.userA.id)?.email
          },
          userB: {
            id: match.userB.id,
            name: match.userB.name,
            email: allProfiles.find(p => p.id === match.userB.id)?.email
          },
          score: match.score,
          categoryScores: match.categoryScores,
          quality: getMatchQuality(match.score).quality
        })
        
        usedPeople.add(match.userA.id)
        usedPeople.add(match.userB.id)
        totalScore += match.score
      }
    }
    
    return {
      pairings: optimalPairs,
      totalScore,
      averageScore: optimalPairs.length > 0 ? totalScore / optimalPairs.length : 0,
      unmatched: allProfiles.filter(p => !usedPeople.has(p.id)),
      error: null
    }
  } catch (error) {
    console.error('Error finding optimal pairings:', error)
    return { pairings: [], error: error.message }
  }
}

// Get match statistics for dashboard
export async function getMatchStatistics() {
  try {
    const { profiles, error } = await getAllUserProfiles()
    
    if (error) {
      return { stats: null, error }
    }

    const totalUsers = profiles.length
    const activeUsers = profiles.filter(p => p.updated_at && 
      new Date(p.updated_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length

    // Calculate average match scores if we have enough users
    let averageMatchScore = 0
    if (totalUsers >= 2) {
      const { pairings } = await findOptimalPairings()
      averageMatchScore = pairings.averageScore || 0
    }

    return {
      stats: {
        totalUsers,
        activeUsers,
        averageMatchScore: Math.round(averageMatchScore),
        totalMatches: Math.floor(totalUsers / 2)
      },
      error: null
    }
  } catch (error) {
    console.error('Error getting match statistics:', error)
    return { stats: null, error: error.message }
  }
} 