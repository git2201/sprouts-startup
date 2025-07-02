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

// Calculate all possible match scores
function calculateAllMatchScores() {
  const matchScores = [];
  
  for (let i = 0; i < people.length; i++) {
    for (let j = i + 1; j < people.length; j++) {
      const personA = people[i];
      const personB = people[j];
      const matchResult = calculateMatchScore(personA, personB);
      
      if (!matchResult.disqualified) {
        matchScores.push({
          personA: personA,
          personB: personB,
          score: matchResult.score,
          categoryScores: matchResult.categoryScores
        });
      }
    }
  }
  
  return matchScores.sort((a, b) => b.score - a.score);
}

// Find optimal pairing using greedy algorithm
function findOptimalPairing() {
  const allMatches = calculateAllMatchScores();
  const usedPeople = new Set();
  const optimalPairs = [];
  let totalScore = 0;
  
  console.log('🌱 OPTIMAL COFOUNDER PAIRING - No Repeats\n');
  console.log('Available matches (sorted by score):');
  allMatches.forEach((match, index) => {
    console.log(`${index + 1}. ${match.personA.name.split('–')[0].trim()} ↔ ${match.personB.name.split('–')[0].trim()}: ${match.score}/100`);
  });
  console.log('\n' + '─'.repeat(80));
  
  // Greedy approach: take highest scoring matches first
  for (const match of allMatches) {
    if (!usedPeople.has(match.personA.id) && !usedPeople.has(match.personB.id)) {
      optimalPairs.push(match);
      usedPeople.add(match.personA.id);
      usedPeople.add(match.personB.id);
      totalScore += match.score;
    }
  }
  
  // Display optimal pairs
  console.log('\n🏆 OPTIMAL PAIRINGS (No Repeats):');
  console.log('='.repeat(80));
  
  optimalPairs.forEach((pair, index) => {
    const quality = getMatchQuality(pair.score);
    console.log(`\n${index + 1}. ${pair.personA.name} ↔ ${pair.personB.name}`);
    console.log(`   Score: ${pair.score}/100 (${quality.quality})`);
    console.log(`   📈 Category Scores:`);
    Object.entries(pair.categoryScores).forEach(([category, score]) => {
      console.log(`      • ${category}: ${score}`);
    });
  });
  
  // Show unmatched people
  const unmatchedPeople = people.filter(person => !usedPeople.has(person.id));
  if (unmatchedPeople.length > 0) {
    console.log(`\n❌ UNMATCHED PEOPLE (${unmatchedPeople.length}):`);
    unmatchedPeople.forEach(person => {
      console.log(`   • ${person.name}`);
    });
  }
  
  console.log(`\n📊 SUMMARY:`);
  console.log(`   • Total Pairs: ${optimalPairs.length}`);
  console.log(`   • Total Score: ${totalScore}/100`);
  console.log(`   • Average Score: ${optimalPairs.length > 0 ? (totalScore / optimalPairs.length).toFixed(1) : 0}/100`);
  console.log(`   • Unmatched: ${unmatchedPeople.length} people`);
  
  return {
    pairs: optimalPairs,
    totalScore: totalScore,
    unmatched: unmatchedPeople
  };
}

// Alternative: Find best possible pairing with backtracking
function findBestPossiblePairing() {
  const allMatches = calculateAllMatchScores();
  const bestPairing = findBestPairingRecursive(allMatches, new Set(), 0, []);
  
  console.log('\n\n🎯 BEST POSSIBLE PAIRING (Backtracking):');
  console.log('='.repeat(80));
  
  bestPairing.pairs.forEach((pair, index) => {
    const quality = getMatchQuality(pair.score);
    console.log(`\n${index + 1}. ${pair.personA.name} ↔ ${pair.personB.name}`);
    console.log(`   Score: ${pair.score}/100 (${quality.quality})`);
  });
  
  console.log(`\n📊 BEST POSSIBLE SUMMARY:`);
  console.log(`   • Total Pairs: ${bestPairing.pairs.length}`);
  console.log(`   • Total Score: ${bestPairing.totalScore}/100`);
  console.log(`   • Average Score: ${bestPairing.pairs.length > 0 ? (bestPairing.totalScore / bestPairing.pairs.length).toFixed(1) : 0}/100`);
  
  return bestPairing;
}

// Recursive function to find the best possible pairing
function findBestPairingRecursive(matches, usedPeople, currentScore, currentPairs) {
  if (matches.length === 0) {
    return { pairs: currentPairs, totalScore: currentScore };
  }
  
  let bestResult = { pairs: currentPairs, totalScore: currentScore };
  
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    
    if (!usedPeople.has(match.personA.id) && !usedPeople.has(match.personB.id)) {
      const newUsedPeople = new Set(usedPeople);
      newUsedPeople.add(match.personA.id);
      newUsedPeople.add(match.personB.id);
      
      const newPairs = [...currentPairs, match];
      const newScore = currentScore + match.score;
      
      const result = findBestPairingRecursive(
        matches.slice(i + 1),
        newUsedPeople,
        newScore,
        newPairs
      );
      
      if (result.totalScore > bestResult.totalScore) {
        bestResult = result;
      }
    }
  }
  
  return bestResult;
}

// Run both algorithms
const greedyResult = findOptimalPairing();
const bestResult = findBestPossiblePairing();

export { findOptimalPairing, findBestPossiblePairing }; 