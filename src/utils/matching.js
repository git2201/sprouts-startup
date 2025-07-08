// Sprout Cofounder Matching Algorithm v2.0
// Enhanced compatibility scoring with mandatory availability matching

/**
 * Calculate match score between two users
 * @param {Object} userA - First user's profile data
 * @param {Object} userB - Second user's profile data
 * @returns {Object} MatchResult with score, disqualifications, and category breakdown
 */
export function calculateMatchScore(userA, userB) {
  const result = {
    score: 0,
    disqualified: false,
    reasons: [],
    categoryScores: {
      personality: 0,
      availability: 0,
      communication: 0,
      motivation: 0,
      roles: 0,
      conflictStyle: 0
    }
  };

  // Add a base bonus of +10 points to all matches
  let baseBonus = 10;

  // 1. MANDATORY FILTERS
  const availabilityCheck = checkAvailabilityCompatibility(userA, userB);
  if (availabilityCheck.disqualified) {
    result.disqualified = true;
    result.reasons.push(availabilityCheck.reason);
    return result;
  }

  // Communication - no disqualification, handled in scoring

  // 2. Calculate category scores
  result.categoryScores.personality = calculatePersonalityScore(userA, userB);
  result.categoryScores.availability = calculateAvailabilityScore(userA, userB);
  result.categoryScores.communication = calculateCommunicationScore(userA, userB);
  result.categoryScores.motivation = calculateMotivationScore(userA, userB);
  result.categoryScores.roles = calculateRolesScore(userA, userB);
  result.categoryScores.conflictStyle = calculateConflictStyleScore(userA, userB);

  // 3. Calculate total score
  result.score = baseBonus + Object.values(result.categoryScores).reduce((sum, score) => sum + score, 0);

  return result;
}

// MANDATORY FILTERS
function checkAvailabilityCompatibility(userA, userB) {
  const a = userA.availability;
  const b = userB.availability;

  // STRICT REQUIREMENT: Availability must be an exact match
  if (a !== b) {
    return { 
      disqualified: true, 
      reason: `Availability mismatch: ${a} vs ${b} - exact match required` 
    };
  }

  return { disqualified: false };
}

// ENHANCED SCORING FUNCTIONS

function calculatePersonalityScore(userA, userB) {
  const a = userA.personality;
  const b = userB.personality;

  // Weighted distance scoring: score = (1 - |traitA - traitB| / 5) * weight
  const weights = {
    conscientiousness: 8,
    agreeableness: 5,
    openness: 4,
    extraversion: 2,
    neuroticism: 1
  };

  let totalScore = 0;

  // Calculate weighted distance for each trait
  Object.keys(weights).forEach(trait => {
    const traitA = a[trait];
    const traitB = b[trait];
    const weight = weights[trait];
    
    const distance = Math.abs(traitA - traitB);
    const traitScore = (1 - distance / 5) * weight;
    
    totalScore += Math.max(0, traitScore); // Ensure no negative scores
  });

  return Math.min(totalScore, 20); // Cap at 20 points
}

function calculateAvailabilityScore(userA, userB) {
  let score = 15; // Base score for exact availability match

  // Bonus for flexibility
  const aFlex = userA.availabilityFlexibility;
  const bFlex = userB.availabilityFlexibility;

  if (aFlex === 'very_flexible' || bFlex === 'very_flexible') {
    score += 2;
  } else if (aFlex === 'slightly_flexible' || bFlex === 'slightly_flexible') {
    score += 1;
  }

  // Chronotype compatibility
  const aChrono = userA.chronotype;
  const bChrono = userB.chronotype;

  if (aChrono === bChrono) {
    score += 2; // Same chronotype
  } else if ((aChrono === 'morning' && bChrono === 'night') || 
             (aChrono === 'night' && bChrono === 'morning')) {
    score -= 2; // Opposite ends
  }

  return Math.min(score, 15); // Cap at 15 points
}

function calculateCommunicationScore(userA, userB) {
  const a = userA.communication;
  const b = userB.communication;

  // Communication compatibility matrix
  const compatibilityMatrix = {
    'async': {
      'async': 10,
      'weekly_sync': 8,
      'daily_checkin': 8,
      'depends': 8
    },
    'weekly_sync': {
      'async': 8,
      'weekly_sync': 10,
      'daily_checkin': 8,
      'depends': 8
    },
    'daily_checkin': {
      'async': 8,
      'weekly_sync': 8,
      'daily_checkin': 10,
      'depends': 8
    },
    'depends': {
      'async': 8,
      'weekly_sync': 8,
      'daily_checkin': 8,
      'depends': 8
    }
  };

  // Less strict: minimum score is 4
  return compatibilityMatrix[a]?.[b] ?? 4;
}

function calculateMotivationScore(userA, userB) {
  let score = 0;

  // Top motivation match = +10, else +4
  if (userA.topMotivation === userB.topMotivation) {
    score += 10;
  } else {
    score += 4;
  }

  // Shared secondary motivations = +5 each (less strict)
  const sharedMotivations = userA.motivations.filter(motivation => 
    userB.motivations.includes(motivation) && motivation !== userA.topMotivation
  );
  score += sharedMotivations.length * 5;

  // Conflicting values penalty = -2 (less strict)
  const conflictingPairs = [
    ['wealth', 'impact'],
    ['freedom', 'collaboration']
  ];

  const hasConflict = conflictingPairs.some(([val1, val2]) => {
    const aHasVal1 = userA.motivations.includes(val1) || userA.topMotivation === val1;
    const bHasVal2 = userB.motivations.includes(val2) || userB.topMotivation === val2;
    const aHasVal2 = userA.motivations.includes(val2) || userA.topMotivation === val2;
    const bHasVal1 = userB.motivations.includes(val1) || userB.topMotivation === val1;
    return (aHasVal1 && bHasVal2) || (aHasVal2 && bHasVal1);
  });
  if (hasConflict) {
    score -= 2;
  }

  return Math.min(Math.max(score, 0), 20); // Between 0 and 20
}

function calculateRolesScore(userA, userB) {
  // Convert roles to lowercase for comparison
  const aRoles = userA.roles.map(role => role.toLowerCase());
  const bRoles = userB.roles.map(role => role.toLowerCase());

  // Complementary role pairs
  const complementaryPairs = [
    ['technical', 'visionary'],
    ['technical', 'operator'],
    ['technical', 'business'],
    ['technical', 'marketing'],
    ['technical', 'sales'],
    ['designer', 'technical'],
    ['designer/ux', 'technical'],
    ['designer/ux', 'visionary'],
    ['marketer', 'technical'],
    ['sales', 'technical'],
    ['sales', 'visionary'],
    ['marketer', 'visionary'],
    ['operator', 'visionary'],
    ['visionary', 'operator']
  ];

  // Check for complementary roles
  const hasComplementaryRoles = complementaryPairs.some(([role1, role2]) => {
    const aHasRole1 = aRoles.includes(role1);
    const bHasRole2 = bRoles.includes(role2);
    const aHasRole2 = aRoles.includes(role2);
    const bHasRole1 = bRoles.includes(role1);
    return (aHasRole1 && bHasRole2) || (aHasRole2 && bHasRole1);
  });
  if (hasComplementaryRoles) {
    return 15; // Complementary role pairs
  }

  // Check for shared roles (overlap)
  const sharedRoles = aRoles.filter(role => bRoles.includes(role));
  if (sharedRoles.length > 0) {
    return 5; // Overlapping roles, less synergy
  }

  return 0; // No synergy
}

function calculateConflictStyleScore(userA, userB) {
  const a = userA.conflictStyle;
  const b = userB.conflictStyle;

  // Conflict style compatibility matrix
  const conflictMatrix = {
    'direct': {
      'direct': 9,
      'indirect': 8,
      'avoidant': 8,
      'internalize': 8
    },
    'indirect': {
      'direct': 8,
      'indirect': 8,
      'avoidant': 8,
      'internalize': 8
    },
    'avoidant': {
      'direct': 8,
      'indirect': 8,
      'avoidant': 8,
      'internalize': 8
    },
    'internalize': {
      'direct': 8,
      'indirect': 8,
      'avoidant': 8,
      'internalize': 8
    }
  };

  // Less strict: minimum score is 4
  return conflictMatrix[a]?.[b] ?? 4;
}

// Enhanced match quality function
export function getMatchQuality(score) {
  if (score >= 90) return { 
    quality: 'Excellent Match', 
    emoji: '🌟',
    color: 'text-green-600', 
    bgColor: 'bg-green-100' 
  };
  if (score >= 80) return { 
    quality: 'Strong Match', 
    emoji: '✅',
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100' 
  };
  if (score >= 70) return { 
    quality: 'Good Match', 
    emoji: '👍',
    color: 'text-yellow-600', 
    bgColor: 'bg-yellow-100' 
  };
  if (score >= 60) return { 
    quality: 'Fair Match', 
    emoji: '⚠️',
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100' 
  };
  return { 
    quality: 'Poor Match', 
    emoji: '❌',
    color: 'text-red-600', 
    bgColor: 'bg-red-100' 
  };
}

// Helper function to get category descriptions
export function getCategoryDescription(category, score) {
  const descriptions = {
    personality: {
      20: 'Perfect psychological alignment',
      15: 'Strong personality compatibility',
      10: 'Good personality fit',
      5: 'Some personality alignment',
      0: 'Personality mismatch'
    },
    availability: {
      15: 'Perfect availability match',
      12: 'Good availability with flexibility',
      10: 'Compatible schedules',
      5: 'Basic availability compatibility',
      0: 'Availability issues'
    },
    communication: {
      10: 'Communication styles align perfectly',
      8: 'Highly compatible communication',
      7: 'Good communication compatibility',
      5: 'Moderate communication fit',
      0: 'Communication style mismatch'
    },
    motivation: {
      20: 'Shared core motivations and values',
      15: 'Strong motivation alignment',
      10: 'Good motivation compatibility',
      5: 'Some shared motivations',
      0: 'Different core motivations'
    },
    roles: {
      25: 'Perfect role complementarity',
      12: 'Shared role strengths',
      5: 'Limited role synergy',
      0: 'Role conflict'
    },
    conflictStyle: {
      10: 'Compatible conflict resolution',
      7: 'Good conflict handling',
      5: 'Moderate conflict compatibility',
      2: 'Potential conflict issues',
      0: 'Conflict style mismatch'
    }
  };

  const maxScore = Math.max(...Object.keys(descriptions[category]).map(Number));
  const closestScore = Object.keys(descriptions[category])
    .map(Number)
    .reduce((prev, curr) => Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev);

  return descriptions[category][closestScore];
}

// Helper function to create a user from onboarding form data
export function createUserFromOnboarding(userId, formData) {
  return {
    id: userId,
    personality: {
      openness: formData.openness || 3,
      conscientiousness: formData.conscientiousness || 3,
      extraversion: formData.extraversion || 3,
      agreeableness: formData.agreeableness || 3,
      neuroticism: formData.neuroticism || 3
    },
    conflictStyle: mapConflictStyle(formData.conflict_style),
    availability: mapAvailability(formData.availability),
    availabilityFlexibility: mapFlexibility(formData.availability_flexibility),
    chronotype: mapChronotype(formData.chronotype),
    communication: mapCommunication(formData.communication),
    motivations: formData.motivations || [],
    topMotivation: formData.top_motivation || '',
    roles: formData.roles || [],
    preferredRole: formData.preferred_role || '',
    teamStyle: formData.team_style || '',
    cofounderFrustration: formData.cofounder_frustration || ''
  };
}

// Mapping functions for onboarding form data
export function mapConflictStyle(conflictStyle) {
  const mapping = {
    'I prefer to address it directly and resolve it quickly.': 'direct',
    'I bring it up gently, usually after thinking it through.': 'indirect',
    'I try to avoid confrontation and hope it resolves.': 'avoidant',
    'I usually internalize it unless it becomes urgent.': 'internalize'
  };
  return mapping[conflictStyle] || 'indirect';
}

export function mapAvailability(availability) {
  const mapping = {
    'Nights/weekends only': 'nights_weekends',
    '10–20 hrs/week': '10_20',
    '20–40 hrs/week': '20_40',
    'Full-time': 'full_time',
    'Depends on the match': 'depends'
  };
  return mapping[availability] || 'depends';
}

export function mapFlexibility(flexibility) {
  const mapping = {
    'Very rigid': 'rigid',
    'Slightly flexible': 'slightly_flexible',
    'Very flexible': 'very_flexible'
  };
  return mapping[flexibility] || 'slightly_flexible';
}

export function mapChronotype(chronotype) {
  const mapping = {
    'Early morning (5am–10am)': 'morning',
    'Midday (11am–4pm)': 'midday',
    'Evening/Night (5pm–2am)': 'night',
    'Flexible throughout the day': 'flexible'
  };
  return mapping[chronotype] || 'flexible';
}

export function mapCommunication(communication) {
  const mapping = {
    'Async-first': 'async',
    'Weekly syncs/check-ins': 'weekly_sync',
    'Daily check-ins and active messaging': 'daily_checkin',
    'Depends on the team': 'depends'
  };
  return mapping[communication] || 'depends';
}

// Test function to demonstrate the matching algorithm
export function testMatchingAlgorithm() {
  console.log('🌱 Testing Sprout Matching Algorithm\n');

  // Sample users for testing
  const userA = {
    id: 'user1',
    personality: {
      openness: 5,
      conscientiousness: 2,
      extraversion: 4,
      agreeableness: 3,
      neuroticism: 2
    },
    conflictStyle: 'direct',
    availability: 'full_time',
    availabilityFlexibility: 'slightly_flexible',
    chronotype: 'morning',
    communication: 'daily_checkin',
    motivations: ['impact', 'freedom', 'learning'],
    topMotivation: 'impact',
    roles: ['technical', 'visionary'],
    preferredRole: 'I want to build the product',
    teamStyle: 'flat and collaborative',
    cofounderFrustration: 'Someone disorganized'
  };

  const userB = {
    id: 'user2',
    personality: {
      openness: 3,
      conscientiousness: 5,
      extraversion: 2,
      agreeableness: 4,
      neuroticism: 3
    },
    conflictStyle: 'indirect',
    availability: '20_40',
    availabilityFlexibility: 'very_flexible',
    chronotype: 'flexible',
    communication: 'weekly_sync',
    motivations: ['impact', 'wealth', 'collaboration'],
    topMotivation: 'impact',
    roles: ['business', 'operator'],
    preferredRole: 'I want to lead the vision',
    teamStyle: 'We define roles clearly and respect boundaries',
    cofounderFrustration: 'Someone too controlling'
  };

  const userC = {
    id: 'user3',
    personality: {
      openness: 4,
      conscientiousness: 3,
      extraversion: 5,
      agreeableness: 2,
      neuroticism: 4
    },
    conflictStyle: 'avoidant',
    availability: 'nights_weekends',
    availabilityFlexibility: 'rigid',
    chronotype: 'night',
    communication: 'async',
    motivations: ['freedom', 'wealth'],
    topMotivation: 'freedom',
    roles: ['designer', 'marketer'],
    preferredRole: 'I want to grow the user base',
    teamStyle: 'Someone leads, others follow',
    cofounderFrustration: 'Someone who avoids conflict'
  };

  // Test different scenarios
  console.log('=== Test 1: High Compatibility Match ===');
  const matchAB = calculateMatchScore(userA, userB);
  console.log('User A (Technical Visionary) + User B (Business Operator)');
  console.log('Score:', matchAB.score);
  console.log('Disqualified:', matchAB.disqualified);
  if (matchAB.disqualified) {
    console.log('Reasons:', matchAB.reasons);
  } else {
    console.log('Category Scores:', matchAB.categoryScores);
    const quality = getMatchQuality(matchAB.score);
    console.log('Match Quality:', quality.quality);
  }
  console.log('');

  console.log('=== Test 2: Communication Mismatch ===');
  const matchAC = calculateMatchScore(userA, userC);
  console.log('User A (Daily Check-in) + User C (Async)');
  console.log('Score:', matchAC.score);
  console.log('Disqualified:', matchAC.disqualified);
  if (matchAC.disqualified) {
    console.log('Reasons:', matchAC.reasons);
  } else {
    console.log('Category Scores:', matchAC.categoryScores);
  }
  console.log('');

  console.log('=== Test 3: Availability Mismatch ===');
  const matchBC = calculateMatchScore(userB, userC);
  console.log('User B (20-40 hrs) + User C (Nights/Weekends)');
  console.log('Score:', matchBC.score);
  console.log('Disqualified:', matchBC.disqualified);
  if (matchBC.disqualified) {
    console.log('Reasons:', matchBC.reasons);
  } else {
    console.log('Category Scores:', matchBC.categoryScores);
  }
  console.log('');

  // Test with flexible user
  const userD = {
    id: 'user4',
    personality: {
      openness: 4,
      conscientiousness: 4,
      extraversion: 3,
      agreeableness: 4,
      neuroticism: 2
    },
    conflictStyle: 'internalize',
    availability: 'depends',
    availabilityFlexibility: 'very_flexible',
    chronotype: 'flexible',
    communication: 'depends',
    motivations: ['impact', 'collaboration', 'learning'],
    topMotivation: 'impact',
    roles: ['generalist'],
    preferredRole: 'I am open, depends on the match',
    teamStyle: 'I am flexible, depends on the people',
    cofounderFrustration: 'I can adapt to most types'
  };

  console.log('=== Test 4: Flexible User Match ===');
  const matchAD = calculateMatchScore(userA, userD);
  console.log('User A (Rigid) + User D (Flexible)');
  console.log('Score:', matchAD.score);
  console.log('Disqualified:', matchAD.disqualified);
  if (matchAD.disqualified) {
    console.log('Reasons:', matchAD.reasons);
  } else {
    console.log('Category Scores:', matchAD.categoryScores);
    const quality = getMatchQuality(matchAD.score);
    console.log('Match Quality:', quality.quality);
  }
  console.log('');

  return {
    matchAB,
    matchAC,
    matchBC,
    matchAD
  };
} 