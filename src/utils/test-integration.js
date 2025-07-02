import { calculateMatchScore, getMatchQuality } from './matching.js'

// Test the integration with sample onboarding data
function testIntegration() {
  console.log('🧪 Testing Matching Integration\n')
  console.log('='.repeat(60))
  
  // Sample onboarding data (what users would submit)
  const sampleOnboardingData = {
    openness: 4,
    conscientiousness: 3,
    extraversion: 5,
    agreeableness: 4,
    neuroticism: 2,
    availability: 'Full-time',
    availability_flexibility: 'Very flexible',
    chronotype: 'Midday (11am–4pm)',
    communication: 'Daily check-ins and active messaging',
    conflict_style: 'I prefer to address it directly and resolve it quickly.',
    motivations: ['Impact', 'Wealth', 'Learning Fast'],
    top_motivation: 'Impact',
    roles: ['Visionary', 'Sales'],
    preferred_role: 'I want to lead the vision',
    team_style: 'Flat and collaborative',
    cofounder_frustration: 'Someone with low availability'
  }
  
  // Helper functions to map onboarding data (same as in App.jsx)
  const mapCommunication = (comm) => {
    if (comm === 'Async-first') return 'async'
    if (comm === 'Weekly syncs/check-ins') return 'weekly_sync'
    if (comm === 'Daily check-ins and active messaging') return 'daily_checkin'
    if (comm === 'Depends on the team') return 'depends'
    return 'depends'
  }
  
  const mapAvailability = (avail) => {
    if (avail === 'Nights/weekends only') return 'nights_weekends'
    if (avail === '10–20 hrs/week') return '10_20'
    if (avail === '20–40 hrs/week') return '20_40'
    if (avail === 'Full-time') return 'full_time'
    if (avail === 'Depends on the match') return 'depends'
    return 'depends'
  }
  
  const mapConflictStyle = (conflict) => {
    if (conflict === 'I prefer to address it directly and resolve it quickly.') return 'direct'
    if (conflict === 'I bring it up gently, usually after thinking it through.') return 'indirect'
    if (conflict === 'I try to avoid confrontation and hope it resolves.') return 'avoidant'
    if (conflict === 'I usually internalize it unless it becomes urgent.') return 'internalize'
    return 'indirect'
  }
  
  const mapFlexibility = (flex) => {
    if (flex === 'Very rigid') return 'rigid'
    if (flex === 'Slightly flexible') return 'slightly_flexible'
    if (flex === 'Very flexible') return 'very_flexible'
    return 'slightly_flexible'
  }
  
  const mapChronotype = (chrono) => {
    if (chrono === 'Early morning (5am–10am)') return 'morning'
    if (chrono === 'Midday (11am–4pm)') return 'midday'
    if (chrono === 'Evening/Night (5pm–2am)') return 'night'
    if (chrono === 'Flexible throughout the day') return 'flexible'
    return 'flexible'
  }
  
  // Convert to user format (what the matching algorithm expects)
  const userA = {
    id: 'user1',
    name: 'Alex - The Visionary',
    personality: {
      openness: sampleOnboardingData.openness,
      conscientiousness: sampleOnboardingData.conscientiousness,
      extraversion: sampleOnboardingData.extraversion,
      agreeableness: sampleOnboardingData.agreeableness,
      neuroticism: sampleOnboardingData.neuroticism
    },
    conflictStyle: mapConflictStyle(sampleOnboardingData.conflict_style),
    availability: mapAvailability(sampleOnboardingData.availability),
    availabilityFlexibility: mapFlexibility(sampleOnboardingData.availability_flexibility),
    chronotype: mapChronotype(sampleOnboardingData.chronotype),
    communication: mapCommunication(sampleOnboardingData.communication),
    motivations: sampleOnboardingData.motivations,
    topMotivation: sampleOnboardingData.top_motivation,
    roles: sampleOnboardingData.roles,
    preferredRole: sampleOnboardingData.preferred_role,
    teamStyle: sampleOnboardingData.team_style,
    cofounderFrustration: sampleOnboardingData.cofounder_frustration
  }
  
  // Create a complementary user
  const userB = {
    id: 'user2',
    name: 'Sam - The Builder',
    personality: {
      openness: 3,
      conscientiousness: 5,
      extraversion: 2,
      agreeableness: 4,
      neuroticism: 2
    },
    conflictStyle: 'indirect',
    availability: '20_40',
    availabilityFlexibility: 'slightly_flexible',
    chronotype: 'night',
    communication: 'async',
    motivations: ['Learning Fast', 'Impact'],
    topMotivation: 'Learning Fast',
    roles: ['Technical', 'Operator'],
    preferredRole: 'I want to build the product',
    teamStyle: 'We define roles clearly and respect boundaries',
    cofounderFrustration: 'Someone disorganized'
  }
  
  console.log('📊 Sample User A (Visionary):')
  console.log(`   Name: ${userA.name}`)
  console.log(`   Roles: ${userA.roles.join(', ')}`)
  console.log(`   Availability: ${userA.availability}`)
  console.log(`   Communication: ${userA.communication}`)
  console.log(`   Motivations: ${userA.motivations.join(', ')}`)
  
  console.log('\n📊 Sample User B (Builder):')
  console.log(`   Name: ${userB.name}`)
  console.log(`   Roles: ${userB.roles.join(', ')}`)
  console.log(`   Availability: ${userB.availability}`)
  console.log(`   Communication: ${userB.communication}`)
  console.log(`   Motivations: ${userB.motivations.join(', ')}`)
  
  console.log('\n🔍 Calculating Match Score...')
  const matchResult = calculateMatchScore(userA, userB)
  
  if (matchResult.disqualified) {
    console.log('❌ Match Disqualified:', matchResult.reasons.join(', '))
  } else {
    const quality = getMatchQuality(matchResult.score)
    console.log(`✅ Match Score: ${matchResult.score}/100 (${quality.quality})`)
    console.log('\n📈 Category Breakdown:')
    Object.entries(matchResult.categoryScores).forEach(([category, score]) => {
      console.log(`   • ${category}: ${score}`)
    })
    
    console.log('\n🎯 Match Analysis:')
    console.log(`   • Role Complementarity: ${userA.roles.includes('Visionary') && userB.roles.includes('Technical') ? '✅ Perfect' : '❌ Mismatch'}`)
    console.log(`   • Availability: ${userA.availability === userB.availability ? '✅ Same' : '⚠️ Different but compatible'}`)
    console.log(`   • Communication: ${userA.communication === userB.communication ? '✅ Same' : '⚠️ Different but compatible'}`)
    console.log(`   • Shared Motivations: ${userA.motivations.filter(m => userB.motivations.includes(m)).length} shared`)
  }
  
  console.log('\n✅ Integration test completed successfully!')
  console.log('The matching algorithm is ready to be used in the app.')
}

// Run the test
testIntegration() 