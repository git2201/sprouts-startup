import { fakeUsers, expectedMatches, convertToOnboardingFormat } from './fake-users-for-testing.js';
import { createUserFromOnboarding, calculateMatchScore, getMatchQuality } from './src/utils/matching.js';

// Test the fake users and validate expected matches
function testFakeUsers() {
  console.log('🧪 TESTING FAKE USERS FOR OPTION 2 MATCHING\n');
  console.log('='.repeat(80));
  
  // Convert all fake users to matching algorithm format
  const users = fakeUsers.map(user => {
    const onboardingData = convertToOnboardingFormat(user);
    const matchingUser = createUserFromOnboarding(user.id, onboardingData);
    // Preserve the original name for display
    matchingUser.name = user.name;
    return matchingUser;
  });
  
  console.log(`📊 Total Users: ${users.length}`);
  console.log(`   • Technical: ${users.filter(u => u.roles.some(r => ['technical', 'engineer', 'developer'].includes(r.toLowerCase()))).length}`);
  console.log(`   • Non-Technical: ${users.filter(u => u.roles.some(r => ['marketing', 'sales', 'growth', 'visionary'].includes(r.toLowerCase()))).length}`);
  console.log(`   • Neutral: ${users.filter(u => !u.roles.some(r => ['technical', 'engineer', 'developer', 'marketing', 'sales', 'growth', 'visionary'].includes(r.toLowerCase()))).length}`);
  
  // Test expected matches
  console.log('\n🎯 TESTING EXPECTED MATCHES:');
  console.log('─'.repeat(80));
  
  let successfulMatches = 0;
  
  expectedMatches.forEach((expected, index) => {
    const userA = users.find(u => u.id === expected.pair[0]);
    const userB = users.find(u => u.id === expected.pair[1]);
    
    if (!userA || !userB) {
      console.log(`❌ ${index + 1}. Missing users for pair: ${expected.pair.join(' ↔ ')}`);
      return;
    }
    
    const matchResult = calculateMatchScore(userA, userB);
    const quality = getMatchQuality(matchResult.score);
    
    console.log(`\n${index + 1}. ${userA.name.split(' - ')[0]} ↔ ${userB.name.split(' - ')[0]}`);
    console.log(`   📍 Location: ${userA.location} (both)`);
    console.log(`   ⏰ Availability: ${userA.availability} (both)`);
    console.log(`   🎭 Roles: ${userA.roles.join(', ')} + ${userB.roles.join(', ')}`);
    
    if (matchResult.disqualified) {
      console.log(`   ❌ DISQUALIFIED: ${matchResult.reasons.join(', ')}`);
    } else {
      console.log(`   ✅ MATCH: ${matchResult.score}/100 (${quality.quality})`);
      console.log(`   📈 Category Scores:`);
      Object.entries(matchResult.categoryScores).forEach(([category, score]) => {
        console.log(`      • ${category}: ${score}`);
      });
      successfulMatches++;
    }
  });
  
  // Find all possible matches
  console.log('\n🔍 FINDING ALL POSSIBLE MATCHES:');
  console.log('─'.repeat(80));
  
  const allMatches = [];
  
  for (let i = 0; i < users.length; i++) {
    for (let j = i + 1; j < users.length; j++) {
      const userA = users[i];
      const userB = users[j];
      const matchResult = calculateMatchScore(userA, userB);
      
      if (!matchResult.disqualified && matchResult.score >= 95) {
        allMatches.push({
          userA: userA,
          userB: userB,
          score: matchResult.score,
          categoryScores: matchResult.categoryScores
        });
      }
    }
  }
  
  // Sort by score
  allMatches.sort((a, b) => b.score - a.score);
  
  console.log(`\n🏆 TOP MATCHES (Score ≥ 95):`);
  allMatches.forEach((match, index) => {
    const quality = getMatchQuality(match.score);
    console.log(`\n${index + 1}. ${match.userA.name.split(' - ')[0]} ↔ ${match.userB.name.split(' - ')[0]}`);
    console.log(`   Score: ${match.score}/100 (${quality.quality})`);
    console.log(`   Location: ${match.userA.location} | Availability: ${match.userA.availability}`);
    console.log(`   Roles: ${match.userA.roles.join(', ')} + ${match.userB.roles.join(', ')}`);
  });
  
  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('─'.repeat(80));
  console.log(`✅ Successful Expected Matches: ${successfulMatches}/${expectedMatches.length}`);
  console.log(`🎯 Total High-Quality Matches (≥95): ${allMatches.length}`);
  console.log(`👥 Users with at least one match: ${new Set(allMatches.flatMap(m => [m.userA.id, m.userB.id])).size}`);
  
  // Check for unmatched users
  const matchedUserIds = new Set(allMatches.flatMap(m => [m.userA.id, m.userB.id]));
  const unmatchedUsers = users.filter(u => !matchedUserIds.has(u.id));
  
  if (unmatchedUsers.length > 0) {
    console.log(`\n❌ UNMATCHED USERS (${unmatchedUsers.length}):`);
    unmatchedUsers.forEach(user => {
      console.log(`   • ${user.name} (${user.roles.join(', ')})`);
    });
  }
  
  return {
    totalUsers: users.length,
    expectedMatches: expectedMatches.length,
    successfulExpectedMatches: successfulMatches,
    totalHighQualityMatches: allMatches.length,
    unmatchedUsers: unmatchedUsers.length
  };
}

// Run the test
const results = testFakeUsers();

export { testFakeUsers, results }; 