import { calculateMatchScore, getMatchQuality } from './matching.js';

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
    roles: ['marketer', 'sales'],
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

export function preciseMatchAnalysis() {
  console.log('🌱 PRECISE MATCHING ANALYSIS - Best Match for Each Person\n');
  
  const results = [];
  
  // Calculate ALL possible matches using exact function
  for (let i = 0; i < people.length; i++) {
    const person = people[i];
    const matches = [];
    
    for (let j = 0; j < people.length; j++) {
      if (i === j) continue; // Skip self-matching
      
      const otherPerson = people[j];
      const matchResult = calculateMatchScore(person, otherPerson);
      
      matches.push({
        person: otherPerson,
        result: matchResult
      });
    }
    
    // Filter out disqualified matches and sort by exact score
    const validMatches = matches.filter(m => !m.result.disqualified);
    validMatches.sort((a, b) => b.result.score - a.result.score);
    
    // Take best match only
    const bestMatch = validMatches[0] || null;
    
    results.push({
      person: person,
      bestMatch: bestMatch,
      allMatches: matches
    });
  }
  
  // Display results with exact scores
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.person.name}`);
    console.log('─'.repeat(70));
    
    if (result.bestMatch) {
      const match = result.bestMatch;
      const quality = getMatchQuality(match.result.score);
      console.log(`✅ Best Match: ${match.person.name} (${match.result.score}/100 - ${quality.quality})`);
      console.log(`📈 Category Scores:`);
      Object.entries(match.result.categoryScores).forEach(([category, score]) => {
        console.log(`   • ${category}: ${score}`);
      });
    } else {
      console.log('❌ No compatible matches found');
      console.log('🔍 Disqualification reasons:');
      result.allMatches.forEach(match => {
        if (match.result.disqualified) {
          console.log(`   • ${match.person.name}: ${match.result.reasons.join(', ')}`);
        }
      });
    }
  });
  
  // Find mutual best matches
  console.log('\n\n🤝 MUTUAL BEST MATCHES');
  console.log('='.repeat(70));
  
  const mutualMatches = [];
  
  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const personA = results[i];
      const personB = results[j];
      
      if (personA.bestMatch && personB.bestMatch) {
        // Check if they're each other's best match
        if (personA.bestMatch.person.id === personB.person.id && 
            personB.bestMatch.person.id === personA.person.id) {
          mutualMatches.push({
            personA: personA.person,
            personB: personB.person,
            scoreA: personA.bestMatch.result.score,
            scoreB: personB.bestMatch.result.score,
            combinedScore: personA.bestMatch.result.score + personB.bestMatch.result.score
          });
        }
      }
    }
  }
  
  // Sort by combined score
  mutualMatches.sort((a, b) => b.combinedScore - a.combinedScore);
  
  if (mutualMatches.length > 0) {
    mutualMatches.forEach((match, index) => {
      console.log(`\n${index + 1}. ${match.personA.name} ↔ ${match.personB.name}`);
      console.log(`   Score: ${match.scoreA}/100 ↔ ${match.scoreB}/100`);
      console.log(`   Combined Score: ${match.combinedScore}/200`);
    });
  } else {
    console.log('No mutual best matches found');
  }
  
  return results;
}

// Run the precise analysis
preciseMatchAnalysis(); 