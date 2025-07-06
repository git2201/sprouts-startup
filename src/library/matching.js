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

    console.log('Profiles fetched:', profiles);
    console.log('Total users calculated:', profiles.length);

    const totalUsers = profiles.length

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
    roles: Array.isArray(profile.roles)
      ? profile.roles
      : (profile.roles ? profile.roles.split(',').map(r => r.trim().toLowerCase()) : []),
    preferredRole: profile.preferred_role || '',
    teamStyle: profile.team_style || '',
    cofounderFrustration: profile.cofounder_frustration || '',
    role: profile.role || 'Not specified',
    work_style: profile.work_style || 'Not specified',
    motivation: profile.motivation || profile.top_motivation || 'Not specified',
    cofounder_preference: profile.cofounder_preference || 'Not specified',
    startup_stage: profile.startup_stage || 'Not specified'
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
      
      console.log('Comparing:', currentUser, otherUser);
      console.log('Match result:', matchResult);
      
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
            roles: profile.roles || [],
            motivations: profile.motivations || [],
            industries: profile.industries || [],
            work_style: profile.work_style || 'Not specified',
            motivation: profile.motivation || profile.top_motivation || 'Not specified',
            cofounder_preference: profile.cofounder_preference || 'Not specified',
            startup_stage: profile.startup_stage || 'Not specified',
            availability: profile.availability || 'Not specified',
            communication: profile.communication || 'Not specified',
            interests: profile.interests || '',
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
      console.error('Error fetching profiles:', error);
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

// Test function to run matching with actual database data
export async function testMatchingWithRealData() {
  console.log('🌱 TESTING MATCHING WITH REAL DATABASE DATA\n');
  console.log('='.repeat(80));
  
  try {
    // Get all profiles from database
    const { profiles: allProfiles, error } = await getAllUserProfiles()
    
    if (error) {
      console.error('❌ Error fetching profiles:', error);
      return;
    }
    
    if (allProfiles.length === 0) {
      console.log('❌ No profiles found in database');
      return;
    }
    
    console.log(`📊 Found ${allProfiles.length} profiles in database:`);
    allProfiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.name || profile.email} (${profile.id})`);
    });
    console.log('');
    
    if (allProfiles.length < 2) {
      console.log('❌ Need at least 2 profiles to test matching');
      return;
    }
    
    // Test matching for each user
    console.log('🔍 TESTING MATCHES FOR EACH USER:');
    console.log('='.repeat(80));
    
    for (let i = 0; i < allProfiles.length; i++) {
      const currentProfile = allProfiles[i];
      const currentUser = convertProfileToUserFormat(currentProfile);
      
      console.log(`\n${i + 1}. ${currentUser.name} (${currentProfile.email})`);
      console.log('─'.repeat(60));
      
      const matches = [];
      
      // Compare with all other users
      for (let j = 0; j < allProfiles.length; j++) {
        if (i === j) continue; // Skip self
        
        const otherProfile = allProfiles[j];
        const otherUser = convertProfileToUserFormat(otherProfile);
        const matchResult = calculateMatchScore(currentUser, otherUser);
        
        if (!matchResult.disqualified) {
          matches.push({
            user: otherUser,
            score: matchResult.score,
            categoryScores: matchResult.categoryScores,
            quality: getMatchQuality(matchResult.score).quality
          });
        } else {
          console.log(`   ❌ ${otherUser.name}: Disqualified - ${matchResult.reasons.join(', ')}`);
        }
      }
      
      // Sort matches by score (highest first)
      matches.sort((a, b) => b.score - a.score);
      
      if (matches.length > 0) {
        console.log(`   ✅ Found ${matches.length} compatible matches:`);
        matches.forEach((match, index) => {
          console.log(`   ${index + 1}. ${match.user.name} - ${match.score}/100 (${match.quality})`);
          console.log(`      📈 Categories: ${Object.entries(match.categoryScores).map(([cat, score]) => `${cat}: ${score}`).join(', ')}`);
        });
        
        // Show best match
        const bestMatch = matches[0];
        console.log(`\n    BEST MATCH: ${bestMatch.user.name} (${bestMatch.score}/100 - ${bestMatch.quality})`);
      } else {
        console.log('   ❌ No compatible matches found');
      }
    }
    
    // Test optimal pairings
    console.log('\n\n🤝 OPTIMAL PAIRINGS:');
    console.log('='.repeat(80));
    
    const { pairings, totalScore, averageScore, unmatched } = await findOptimalPairings();
    
    if (pairings.length > 0) {
      console.log(`📊 Found ${pairings.length} optimal pairs:`);
      pairings.forEach((pair, index) => {
        console.log(`\n${index + 1}. ${pair.userA.name} ↔ ${pair.userB.name}`);
        console.log(`   Score: ${pair.score}/100 (${pair.quality})`);
        console.log(`   📈 Categories: ${Object.entries(pair.categoryScores).map(([cat, score]) => `${cat}: ${score}`).join(', ')}`);
      });
      
      console.log(`\n📊 SUMMARY:`);
      console.log(`   • Total Pairs: ${pairings.length}`);
      console.log(`   • Total Score: ${totalScore}/100`);
      console.log(`   • Average Score: ${averageScore.toFixed(1)}/100`);
      
      if (unmatched.length > 0) {
        console.log(`   • Unmatched: ${unmatched.length} users`);
        unmatched.forEach(user => {
          console.log(`     - ${user.name || user.email}`);
        });
      }
    } else {
      console.log('❌ No optimal pairings found');
    }
    
  } catch (error) {
    console.error('❌ Error testing matching:', error);
  }
} 