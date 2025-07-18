import { calculateMatchScore } from './matching.js';

// Convert the 10 people to proper user format
const people = [
  {
    id: 'aisha',
    name: 'Aisha – The Visionary Hustler',
    personality: { openness: 5, conscientiousness: 4, extraversion: 5, agreeableness: 3, neuroticism: 2 },
    conflictStyle: 'direct',
    availability: 'full_time',
    availabilityFlexibility: 'very_flexible',
    chronotype: 'midday',
    communication: 'daily_checkin',
    motivations: ['impact', 'wealth', 'learning'],
    topMotivation: 'impact',
    roles: ['visionary', 'sales'],
    preferredRole: 'I want to lead the vision',
    teamStyle: 'flat and collaborative',
    cofounderFrustration: 'Someone with low availability'
  },
  {
    id: 'jay',
    name: 'Jay – The Quiet Builder',
    personality: { openness: 3, conscientiousness: 5, extraversion: 2, agreeableness: 4, neuroticism: 2 },
    conflictStyle: 'indirect',
    availability: '20_40',
    availabilityFlexibility: 'slightly_flexible',
    chronotype: 'night',
    communication: 'async',
    motivations: ['freedom', 'learning'],
    topMotivation: 'freedom',
    roles: ['technical', 'operator'],
    preferredRole: 'I want to build the product',
    teamStyle: 'We define roles clearly and respect boundaries',
    cofounderFrustration: 'Someone disorganized'
  },
  {
    id: 'maya',
    name: 'Maya – The Design-Obsessed Operator',
    personality: { openness: 5, conscientiousness: 5, extraversion: 3, agreeableness: 4, neuroticism: 3 },
    conflictStyle: 'indirect',
    availability: '10_20',
    availabilityFlexibility: 'slightly_flexible',
    chronotype: 'morning',
    communication: 'weekly_sync',
    motivations: ['collaboration', 'learning', 'impact'],
    topMotivation: 'collaboration',
    roles: ['designer', 'operator'],
    preferredRole: 'I want to keep the team organized',
    teamStyle: 'We define roles clearly and respect boundaries',
    cofounderFrustration: 'Someone too controlling'
  },
  {
    id: 'leo',
    name: 'Leo – The Late-Night Generalist',
    personality: { openness: 4, conscientiousness: 3, extraversion: 4, agreeableness: 3, neuroticism: 4 },
    conflictStyle: 'internalize',
    availability: 'nights_weekends',
    availabilityFlexibility: 'very_flexible',
    chronotype: 'night',
    communication: 'async',
    motivations: ['freedom', 'wealth'],
    topMotivation: 'freedom',
    roles: ['generalist', 'visionary'],
    preferredRole: 'I am open, depends on the match',
    teamStyle: 'Flat and collaborative',
    cofounderFrustration: 'Someone who avoids conflict'
  },
  {
    id: 'emily',
    name: 'Emily – The Detail-Oriented PM',
    personality: { openness: 3, conscientiousness: 5, extraversion: 3, agreeableness: 4, neuroticism: 3 },
    conflictStyle: 'indirect',
    availability: '20_40',
    availabilityFlexibility: 'slightly_flexible',
    chronotype: 'midday',
    communication: 'weekly_sync',
    motivations: ['collaboration', 'impact'],
    topMotivation: 'impact',
    roles: ['operator', 'generalist'],
    preferredRole: 'I want to keep the team organized',
    teamStyle: 'We define roles clearly and respect boundaries',
    cofounderFrustration: 'Someone disorganized'
  },
  {
    id: 'marcus',
    name: 'Marcus – The Reluctant Leader',
    personality: { openness: 2, conscientiousness: 4, extraversion: 3, agreeableness: 5, neuroticism: 3 },
    conflictStyle: 'avoidant',
    availability: 'depends',
    availabilityFlexibility: 'very_flexible',
    chronotype: 'flexible',
    communication: 'depends',
    motivations: ['wealth', 'freedom'],
    topMotivation: 'wealth',
    roles: ['sales', 'visionary'],
    preferredRole: 'I want to lead the vision',
    teamStyle: 'Someone leads, others follow',
    cofounderFrustration: 'Someone too controlling'
  },
  {
    id: 'nia',
    name: 'Nia – The Mission-Driven Coder',
    personality: { openness: 5, conscientiousness: 3, extraversion: 2, agreeableness: 4, neuroticism: 2 },
    conflictStyle: 'direct',
    availability: '10_20',
    availabilityFlexibility: 'rigid',
    chronotype: 'morning',
    communication: 'weekly_sync',
    motivations: ['impact', 'learning'],
    topMotivation: 'impact',
    roles: ['technical'],
    preferredRole: 'I want to build the product',
    teamStyle: 'I am flexible, depends on the people',
    cofounderFrustration: 'Someone with low availability'
  },
  {
    id: 'andre',
    name: 'Andre – The Async Hacker',
    personality: { openness: 4, conscientiousness: 2, extraversion: 1, agreeableness: 2, neuroticism: 3 },
    conflictStyle: 'avoidant',
    availability: '20_40',
    availabilityFlexibility: 'very_flexible',
    chronotype: 'night',
    communication: 'async',
    motivations: ['freedom', 'wealth'],
    topMotivation: 'freedom',
    roles: ['technical'],
    preferredRole: 'I want to build the product',
    teamStyle: 'I am flexible, depends on the people',
    cofounderFrustration: 'Someone too controlling'
  },
  {
    id: 'tara',
    name: 'Tara – The Growth-Focused Hustler',
    personality: { openness: 4, conscientiousness: 4, extraversion: 4, agreeableness: 3, neuroticism: 3 },
    conflictStyle: 'direct',
    availability: 'full_time',
    availabilityFlexibility: 'slightly_flexible',
    chronotype: 'midday',
    communication: 'daily_checkin',
    motivations: ['wealth', 'impact', 'collaboration'],
    topMotivation: 'wealth',
    roles: ['marketing', 'sales'],
    preferredRole: 'I want to grow the user base',
    teamStyle: 'We define roles clearly and respect boundaries',
    cofounderFrustration: 'Someone disorganized'
  },
  {
    id: 'samir',
    name: 'Samir – The Calm Strategist',
    personality: { openness: 5, conscientiousness: 4, extraversion: 2, agreeableness: 5, neuroticism: 1 },
    conflictStyle: 'indirect',
    availability: '10_20',
    availabilityFlexibility: 'very_flexible',
    chronotype: 'morning',
    communication: 'depends',
    motivations: ['learning', 'freedom', 'collaboration'],
    topMotivation: 'learning',
    roles: ['visionary', 'generalist'],
    preferredRole: 'I am open, depends on the match',
    teamStyle: 'Flat and collaborative',
    cofounderFrustration: 'Someone who avoids conflict'
  }
];

function findPerson(name) {
  return people.find(p => p.name.includes(name));
}

function debugSpecificMatches() {
  console.log('🔍 DEBUGGING CHATGPT\'S MATCHES\n');
  console.log('='.repeat(80));
  
  // Test the specific matches ChatGPT mentioned
  const testMatches = [
    { name: 'Emily ↔ Nia', personA: 'emily', personB: 'nia', expectedScore: 90 },
    { name: 'Jay ↔ Leo', personA: 'jay', personB: 'leo', expectedScore: 85 },
    { name: 'Maya ↔ Samir', personA: 'maya', personB: 'samir', expectedScore: 80 },
    { name: 'Aisha ↔ Tara', personA: 'aisha', personB: 'tara', expectedScore: 70 },
    { name: 'Marcus ↔ Andre', personA: 'marcus', personB: 'andre', expectedScore: 70 }
  ];
  
  testMatches.forEach(test => {
    const personA = people.find(p => p.id === test.personA);
    const personB = people.find(p => p.id === test.personB);
    
    if (!personA || !personB) {
      console.log(`❌ Could not find people for ${test.name}`);
      return;
    }
    
    const result = calculateMatchScore(personA, personB);
    
    console.log(`\n${test.name} (Expected: ${test.expectedScore}/100)`);
    console.log('─'.repeat(50));
    
    if (result.disqualified) {
      console.log(`❌ DISQUALIFIED: ${result.reasons.join(', ')}`);
    } else {
      console.log(`✅ Score: ${result.score}/100 (Difference: ${result.score - test.expectedScore})`);
      console.log('📊 Category Breakdown:');
      Object.entries(result.categoryScores).forEach(([category, score]) => {
        console.log(`   • ${category}: ${score}`);
      });
      
      // Show why scores might be different
      console.log('\n🔍 Analysis:');
      console.log(`   • Availability: ${personA.availability} (${personA.availabilityFlexibility}) ↔ ${personB.availability} (${personB.availabilityFlexibility})`);
      console.log(`   • Communication: ${personA.communication} ↔ ${personB.communication}`);
      console.log(`   • Motivations: ${personA.motivations.join(', ')} ↔ ${personB.motivations.join(', ')}`);
      console.log(`   • Roles: ${personA.roles.join(', ')} ↔ ${personB.roles.join(', ')}`);
      console.log(`   • Conflict Style: ${personA.conflictStyle} ↔ ${personB.conflictStyle}`);
    }
  });
}

debugSpecificMatches(); 