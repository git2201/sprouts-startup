// Sprout Cofounder Matching Algorithm
// Calculates compatibility scores between two users based on psychology, work style, motivation, and role complementarity

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

  // 1. Check mandatory filters (hard requirements)
  const availabilityCheck = checkAvailabilityCompatibility(userA, userB);
  if (availabilityCheck.disqualified) {
    result.disqualified = true;
    result.reasons.push(availabilityCheck.reason);
    return result;
  }

  const communicationCheck = checkCommunicationCompatibility(userA, userB);
  if (communicationCheck.disqualified) {
    result.disqualified = true;
    result.reasons.push(communicationCheck.reason);
    return result;
  }

  // 2. Calculate category scores
  result.categoryScores.availability = calculateAvailabilityScore(userA, userB);
  result.categoryScores.personality = calculatePersonalityScore(userA, userB);
  result.categoryScores.communication = calculateCommunicationScore(userA, userB);
  result.categoryScores.motivation = calculateMotivationScore(userA, userB);
  result.categoryScores.roles = calculateRolesScore(userA, userB);
  result.categoryScores.conflictStyle = calculateConflictStyleScore(userA, userB);

  // 3. Calculate total score
  result.score = Object.values(result.categoryScores).reduce((sum, score) => sum + score, 0);

  return result;
}

// Mandatory Filter Functions
function checkAvailabilityCompatibility(userA, userB) {
  const a = userA.availability;
  const b = userB.availability;
  const aFlex = userA.availabilityFlexibility;
  const bFlex = userB.availabilityFlexibility;

  // If both are flexible, they can work together
  if (aFlex === 'very_flexible' && bFlex === 'very_flexible') {
    return { disqualified: false };
  }

  // If one is 'depends', they can adapt
  if (a === 'depends' || b === 'depends') {
    return { disqualified: false };
  }

  // If they have the same availability, they're compatible
  if (a === b) {
    return { disqualified: false };
  }

  // Check for compatible availability pairs (more lenient)
  const compatiblePairs = [
    ['10_20', '20_40'],
    ['20_40', 'full_time'],
    ['10_20', 'full_time'],
    ['nights_weekends', '20_40'],
    ['nights_weekends', 'full_time']
  ];

  const isCompatible = compatiblePairs.some(([x, y]) => 
    (a === x && b === y) || (a === y && b === x)
  );

  if (isCompatible) {
    return { disqualified: false };
  }

  // Only disqualify if truly incompatible
  return { 
    disqualified: true, 
    reason: `Availability mismatch: ${a} vs ${b} - incompatible availability preferences` 
  };
}

function checkCommunicationCompatibility(userA, userB) {
  const a = userA.communication;
  const b = userB.communication;

  // If either is 'depends', they can adapt
  if (a === 'depends' || b === 'depends') {
    return { disqualified: false };
  }

  // If they're the same, they're compatible
  if (a === b) {
    return { disqualified: false };
  }

  // Check for compatible pairs
  const compatiblePairs = [
    ['async', 'weekly_sync'],
    ['weekly_sync', 'async']
  ];

  const isCompatible = compatiblePairs.some(([x, y]) => 
    (a === x && b === y) || (a === y && b === x)
  );

  if (!isCompatible) {
    return { 
      disqualified: true, 
      reason: 'Communication style mismatch: incompatible communication preferences' 
    };
  }

  return { disqualified: false };
}

// Scoring Functions
function calculateAvailabilityScore(userA, userB) {
  const a = userA.availability;
  const b = userB.availability;
  const aFlex = userA.availabilityFlexibility;
  const bFlex = userB.availabilityFlexibility;

  // If both are flexible or one is 'depends', full points
  if (aFlex === 'very_flexible' && bFlex === 'very_flexible') {
    return 15;
  }
  if (a === 'depends' || b === 'depends') {
    return 15;
  }

  // If they have overlapping availability, full points
  if (a === b) {
    return 15;
  }

  // Check for compatible availability pairs
  const compatiblePairs = [
    ['10_20', '20_40'],
    ['20_40', 'full_time'],
    ['10_20', 'full_time'],
    ['nights_weekends', '20_40'],
    ['nights_weekends', 'full_time']
  ];

  const isCompatible = compatiblePairs.some(([x, y]) => 
    (a === x && b === y) || (a === y && b === x)
  );

  return isCompatible ? 10 : 0;
}

function calculatePersonalityScore(userA, userB) {
  let score = 0;
  const a = userA.personality;
  const b = userB.personality;

  // +5 if openness and conscientiousness are complementary (one high, one medium+)
  const aOpenness = a.openness;
  const bOpenness = b.openness;
  const aConscientiousness = a.conscientiousness;
  const bConscientiousness = b.conscientiousness;
  
  const aHighOpenness = aOpenness >= 4;
  const bHighOpenness = bOpenness >= 4;
  const aMediumPlusConscientiousness = aConscientiousness >= 3;
  const bMediumPlusConscientiousness = bConscientiousness >= 3;
  
  if ((aHighOpenness && bMediumPlusConscientiousness) || (bHighOpenness && aMediumPlusConscientiousness)) {
    score += 5;
  }

  // +5 if extraversion + introversion pairing (one 4–5, one 1–2)
  const aExtraversion = a.extraversion;
  const bExtraversion = b.extraversion;
  const aExtrovert = aExtraversion >= 4;
  const bExtrovert = bExtraversion >= 4;
  const aIntrovert = aExtraversion <= 2;
  const bIntrovert = bExtraversion <= 2;
  
  if ((aExtrovert && bIntrovert) || (bExtrovert && aIntrovert)) {
    score += 5;
  }

  // +5 for moderate agreeableness mix (both 3–4)
  const aAgreeableness = a.agreeableness;
  const bAgreeableness = b.agreeableness;
  const aModerateAgreeable = aAgreeableness >= 3 && aAgreeableness <= 4;
  const bModerateAgreeable = bAgreeableness >= 3 && bAgreeableness <= 4;
  
  if (aModerateAgreeable && bModerateAgreeable) {
    score += 5;
  }

  // +5 if one low neuroticism (1–2) and one moderate (3–4)
  const aNeuroticism = a.neuroticism;
  const bNeuroticism = b.neuroticism;
  const aLowNeuroticism = aNeuroticism <= 2;
  const bLowNeuroticism = bNeuroticism <= 2;
  const aModerateNeuroticism = aNeuroticism >= 3 && aNeuroticism <= 4;
  const bModerateNeuroticism = bNeuroticism >= 3 && bNeuroticism <= 4;
  
  if ((aLowNeuroticism && bModerateNeuroticism) || (bLowNeuroticism && aModerateNeuroticism)) {
    score += 5;
  }

  return score;
}

function calculateCommunicationScore(userA, userB) {
  const a = userA.communication;
  const b = userB.communication;

  // +10 if same or one is 'depends'
  if (a === b || a === 'depends' || b === 'depends') {
    return 10;
  }

  // +5 if one is 'weekly' and the other is 'async'
  const compatiblePairs = [
    ['async', 'weekly_sync'],
    ['weekly_sync', 'async']
  ];

  const isCompatible = compatiblePairs.some(([x, y]) => 
    (a === x && b === y) || (a === y && b === x)
  );

  return isCompatible ? 5 : 0;
}

function calculateMotivationScore(userA, userB) {
  let score = 0;

  // +5 for each shared motivation
  const sharedMotivations = userA.motivations.filter(motivation => 
    userB.motivations.includes(motivation)
  );
  score += sharedMotivations.length * 5;

  // +5 bonus if topMotivation is the same
  if (userA.topMotivation === userB.topMotivation) {
    score += 5;
  }

  return Math.min(score, 20); // Cap at 20 points
}

function calculateRolesScore(userA, userB) {
  let score = 0;

  // +10 if roles are complementary (e.g., technical + business, visionary + operator)
  const complementaryPairs = [
    ['technical', 'business'],
    ['technical', 'marketing'],
    ['technical', 'sales'],
    ['visionary', 'operator'],
    ['designer', 'technical'],
    ['marketer', 'technical'],
    ['sales', 'technical']
  ];

  const hasComplementaryRoles = complementaryPairs.some(([role1, role2]) => {
    const aHasRole1 = userA.roles.includes(role1);
    const bHasRole2 = userB.roles.includes(role2);
    const aHasRole2 = userA.roles.includes(role2);
    const bHasRole1 = userB.roles.includes(role1);
    
    return (aHasRole1 && bHasRole2) || (aHasRole2 && bHasRole1);
  });

  if (hasComplementaryRoles) {
    score += 10;
  }

  // +10 if preferred roles are not the same
  if (userA.preferredRole !== userB.preferredRole) {
    score += 10;
  }

  // +5 bonus if one user is generalist
  if (userA.roles.includes('generalist') || userB.roles.includes('generalist')) {
    score += 5;
  }

  return Math.min(score, 25); // Cap at 25 points
}

function calculateConflictStyleScore(userA, userB) {
  const a = userA.conflictStyle;
  const b = userB.conflictStyle;

  // +10 if conflict styles are matched or form a compatible pair
  if (a === b) {
    return 10;
  }

  // Compatible pairs (e.g., direct + indirect, avoidant + internalize)
  const compatiblePairs = [
    ['direct', 'indirect'],
    ['indirect', 'direct'],
    ['avoidant', 'internalize'],
    ['internalize', 'avoidant']
  ];

  const isCompatible = compatiblePairs.some(([x, y]) => 
    (a === x && b === y) || (a === y && b === x)
  );

  if (isCompatible) {
    return 10;
  }

  // +5 if both are moderate (e.g., indirect + indirect)
  return 5;
}

// Helper function to get match quality description
export function getMatchQuality(score) {
  if (score >= 90) return { quality: 'Exceptional', color: 'text-green-600', bgColor: 'bg-green-100' };
  if (score >= 80) return { quality: 'Excellent', color: 'text-blue-600', bgColor: 'bg-blue-100' };
  if (score >= 70) return { quality: 'Good', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
  if (score >= 60) return { quality: 'Fair', color: 'text-orange-600', bgColor: 'bg-orange-100' };
  return { quality: 'Poor', color: 'text-red-600', bgColor: 'bg-red-100' };
}

// Helper function to get category descriptions
export function getCategoryDescription(category, score) {
  const descriptions = {
    personality: {
      20: 'Perfect psychological complementarity',
      15: 'Strong personality balance',
      10: 'Good personality fit',
      5: 'Some personality alignment',
      0: 'Personality mismatch'
    },
    availability: {
      15: 'Perfect availability match',
      10: 'Compatible schedules',
      0: 'Availability conflict'
    },
    communication: {
      10: 'Communication styles align perfectly',
      5: 'Compatible communication preferences',
      0: 'Communication style mismatch'
    },
    motivation: {
      20: 'Shared core motivations',
      15: 'Good motivation alignment',
      10: 'Some shared motivations',
      5: 'Limited motivation overlap',
      0: 'Different motivations'
    },
    roles: {
      25: 'Perfect role complementarity',
      20: 'Strong role fit',
      15: 'Good role alignment',
      10: 'Some role complementarity',
      5: 'Limited role fit',
      0: 'Role conflict'
    },
    conflictStyle: {
      10: 'Compatible conflict resolution',
      5: 'Moderate conflict compatibility',
      0: 'Conflict style mismatch'
    }
  };

  const maxScore = Math.max(...Object.keys(descriptions[category]).map(Number));
  const closestScore = Object.keys(descriptions[category])
    .map(Number)
    .reduce((prev, curr) => Math.abs(curr - score) < Math.abs(prev - score) ? curr : prev);

  return descriptions[category][closestScore];
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
function mapConflictStyle(conflictStyle) {
  const mapping = {
    'I prefer to address it directly and resolve it quickly.': 'direct',
    'I bring it up gently, usually after thinking it through.': 'indirect',
    'I try to avoid confrontation and hope it resolves.': 'avoidant',
    'I usually internalize it unless it becomes urgent.': 'internalize'
  };
  return mapping[conflictStyle] || 'indirect';
}

function mapAvailability(availability) {
  const mapping = {
    'Nights/weekends only': 'nights_weekends',
    '10–20 hrs/week': '10_20',
    '20–40 hrs/week': '20_40',
    'Full-time': 'full_time',
    'Depends on the match': 'depends'
  };
  return mapping[availability] || 'depends';
}

function mapFlexibility(flexibility) {
  const mapping = {
    'Very rigid': 'rigid',
    'Slightly flexible': 'slightly_flexible',
    'Very flexible': 'very_flexible'
  };
  return mapping[flexibility] || 'slightly_flexible';
}

function mapChronotype(chronotype) {
  const mapping = {
    'Early morning (5am–10am)': 'morning',
    'Midday (11am–4pm)': 'midday',
    'Evening/Night (5pm–2am)': 'night',
    'Flexible throughout the day': 'flexible'
  };
  return mapping[chronotype] || 'flexible';
}

function mapCommunication(communication) {
  const mapping = {
    'Async-first': 'async',
    'Weekly syncs/check-ins': 'weekly_sync',
    'Daily check-ins and active messaging': 'daily_checkin',
    'Depends on the team': 'depends'
  };
  return mapping[communication] || 'depends';
} 