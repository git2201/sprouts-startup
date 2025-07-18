// 🌱 Fake User Profiles for Option 2 Matching Testing
// Designed to generate 3-5 meaningful matches with balanced technical/non-technical distribution

export const fakeUsers = [
  // === BOSTON LOCATION - FULL-TIME AVAILABILITY ===
  {
    id: 'boston-tech-1',
    name: 'Alex Chen - The Systems Architect',
    email: 'alex.chen@fake.com',
    personality: { openness: 4, conscientiousness: 5, extraversion: 3, agreeableness: 4, neuroticism: 2 },
    conflictStyle: 'I prefer to address it directly and resolve it quickly.',
    availability: 'Full-time',
    availability_flexibility: 'Slightly flexible',
    chronotype: 'Early morning (5am–10am)',
    communication: 'Async-first',
    motivations: ['Learning Fast', 'Freedom', 'Impact'],
    top_motivation: 'Learning Fast',
    roles: ['Technical', 'Engineer'],
    preferred_role: 'I want to build the product',
    team_style: 'We define roles clearly and respect boundaries',
    cofounder_frustration: 'Someone disorganized',
    location: 'Boston',
    age: '26',
    industries: ['AI / ML', 'SaaS / B2B', 'Fintech']
  },
  {
    id: 'boston-nontech-1',
    name: 'Sarah Rodriguez - The Growth Strategist',
    email: 'sarah.rodriguez@fake.com',
    personality: { openness: 5, conscientiousness: 4, extraversion: 5, agreeableness: 4, neuroticism: 3 },
    conflictStyle: 'I bring it up gently, usually after thinking it through.',
    availability: 'Full-time',
    availability_flexibility: 'Very flexible',
    chronotype: 'Midday (11am–4pm)',
    communication: 'Daily check-ins and active messaging',
    motivations: ['Impact', 'Wealth', 'Collaboration'],
    top_motivation: 'Impact',
    roles: ['Marketing', 'Growth'],
    preferred_role: 'I want to grow the user base',
    team_style: 'Flat and collaborative',
    cofounder_frustration: 'Someone with low availability',
    location: 'Boston',
    age: '28',
    industries: ['SaaS / B2B', 'Creator Economy', 'Social / Communities']
  },

  // === BOSTON LOCATION - 20-40 HOURS ===
  {
    id: 'boston-tech-2',
    name: 'David Kim - The Backend Specialist',
    email: 'david.kim@fake.com',
    personality: { openness: 3, conscientiousness: 5, extraversion: 2, agreeableness: 3, neuroticism: 2 },
    conflictStyle: 'I prefer to address it directly and resolve it quickly.',
    availability: '20–40 hrs/week',
    availability_flexibility: 'Slightly flexible',
    chronotype: 'Evening/Night (5pm–2am)',
    communication: 'Async-first',
    motivations: ['Freedom', 'Learning Fast'],
    top_motivation: 'Freedom',
    roles: ['Technical', 'Developer'],
    preferred_role: 'I want to build the product',
    team_style: 'I am flexible, depends on the people',
    cofounder_frustration: 'Someone too controlling',
    location: 'Boston',
    age: '24',
    industries: ['AI / ML', 'Web3', 'Fintech']
  },
  {
    id: 'boston-nontech-2',
    name: 'Maya Patel - The Visionary Leader',
    email: 'maya.patel@fake.com',
    personality: { openness: 5, conscientiousness: 4, extraversion: 4, agreeableness: 5, neuroticism: 2 },
    conflictStyle: 'I bring it up gently, usually after thinking it through.',
    availability: '20–40 hrs/week',
    availability_flexibility: 'Very flexible',
    chronotype: 'Midday (11am–4pm)',
    communication: 'Weekly syncs/check-ins',
    motivations: ['Impact', 'Learning Fast', 'Collaboration'],
    top_motivation: 'Impact',
    roles: ['Visionary', 'Sales'],
    preferred_role: 'I want to lead the vision',
    team_style: 'Someone leads, others follow',
    cofounder_frustration: 'Someone who avoids conflict',
    location: 'Boston',
    age: '27',
    industries: ['Climate / Sustainability', 'Health / Bio', 'Education / EdTech']
  },

  // === GREATER DELHI LOCATION - FULL-TIME AVAILABILITY ===
  {
    id: 'delhi-tech-1',
    name: 'Arjun Singh - The Full-Stack Developer',
    email: 'arjun.singh@fake.com',
    personality: { openness: 4, conscientiousness: 4, extraversion: 3, agreeableness: 4, neuroticism: 3 },
    conflictStyle: 'I prefer to address it directly and resolve it quickly.',
    availability: 'Full-time',
    availability_flexibility: 'Slightly flexible',
    chronotype: 'Early morning (5am–10am)',
    communication: 'Weekly syncs/check-ins',
    motivations: ['Learning Fast', 'Freedom', 'Wealth'],
    top_motivation: 'Learning Fast',
    roles: ['Technical', 'Engineer'],
    preferred_role: 'I want to build the product',
    team_style: 'We define roles clearly and respect boundaries',
    cofounder_frustration: 'Someone disorganized',
    location: 'Greater Delhi',
    age: '25',
    industries: ['SaaS / B2B', 'AI / ML', 'Fintech']
  },
  {
    id: 'delhi-nontech-1',
    name: 'Priya Sharma - The Marketing Maven',
    email: 'priya.sharma@fake.com',
    personality: { openness: 5, conscientiousness: 4, extraversion: 5, agreeableness: 4, neuroticism: 3 },
    conflictStyle: 'I bring it up gently, usually after thinking it through.',
    availability: 'Full-time',
    availability_flexibility: 'Very flexible',
    chronotype: 'Midday (11am–4pm)',
    communication: 'Daily check-ins and active messaging',
    motivations: ['Wealth', 'Impact', 'Collaboration'],
    top_motivation: 'Wealth',
    roles: ['Marketing', 'Sales'],
    preferred_role: 'I want to grow the user base',
    team_style: 'Flat and collaborative',
    cofounder_frustration: 'Someone with low availability',
    location: 'Greater Delhi',
    age: '26',
    industries: ['Creator Economy', 'Social / Communities', 'SaaS / B2B']
  },

  // === GREATER DELHI LOCATION - 20-40 HOURS ===
  {
    id: 'delhi-tech-2',
    name: 'Rahul Verma - The AI Engineer',
    email: 'rahul.verma@fake.com',
    personality: { openness: 5, conscientiousness: 3, extraversion: 2, agreeableness: 3, neuroticism: 2 },
    conflictStyle: 'I try to avoid confrontation and hope it resolves.',
    availability: '20–40 hrs/week',
    availability_flexibility: 'Very flexible',
    chronotype: 'Evening/Night (5pm–2am)',
    communication: 'Async-first',
    motivations: ['Freedom', 'Learning Fast'],
    top_motivation: 'Freedom',
    roles: ['Technical', 'Developer'],
    preferred_role: 'I want to build the product',
    team_style: 'I am flexible, depends on the people',
    cofounder_frustration: 'Someone too controlling',
    location: 'Greater Delhi',
    age: '23',
    industries: ['AI / ML', 'Web3', 'Health / Bio']
  },
  {
    id: 'delhi-nontech-2',
    name: 'Aisha Khan - The Growth Hacker',
    email: 'aisha.khan@fake.com',
    personality: { openness: 4, conscientiousness: 4, extraversion: 4, agreeableness: 3, neuroticism: 3 },
    conflictStyle: 'I prefer to address it directly and resolve it quickly.',
    availability: '20–40 hrs/week',
    availability_flexibility: 'Slightly flexible',
    chronotype: 'Midday (11am–4pm)',
    communication: 'Weekly syncs/check-ins',
    motivations: ['Wealth', 'Impact', 'Learning Fast'],
    top_motivation: 'Wealth',
    roles: ['Growth', 'Visionary'],
    preferred_role: 'I want to lead the vision',
    team_style: 'We define roles clearly and respect boundaries',
    cofounder_frustration: 'Someone disorganized',
    location: 'Greater Delhi',
    age: '25',
    industries: ['Fintech', 'SaaS / B2B', 'Creator Economy']
  },

  // === NEUTRAL ROLES (can pair with either technical or non-technical) ===
  {
    id: 'neutral-1',
    name: 'Emma Thompson - The UX Designer',
    email: 'emma.thompson@fake.com',
    personality: { openness: 5, conscientiousness: 4, extraversion: 3, agreeableness: 5, neuroticism: 2 },
    conflictStyle: 'I bring it up gently, usually after thinking it through.',
    availability: 'Full-time',
    availability_flexibility: 'Very flexible',
    chronotype: 'Flexible throughout the day',
    communication: 'Depends on the team',
    motivations: ['Collaboration', 'Impact', 'Learning Fast'],
    top_motivation: 'Collaboration',
    roles: ['Designer', 'Product Manager'],
    preferred_role: 'I am open, depends on the match',
    team_style: 'Flat and collaborative',
    cofounder_frustration: 'Someone who avoids conflict',
    location: 'Boston',
    age: '27',
    industries: ['SaaS / B2B', 'Creator Economy', 'Social / Communities']
  },
  {
    id: 'neutral-2',
    name: 'Vikram Malhotra - The Operations Expert',
    email: 'vikram.malhotra@fake.com',
    personality: { openness: 3, conscientiousness: 5, extraversion: 3, agreeableness: 4, neuroticism: 2 },
    conflictStyle: 'I prefer to address it directly and resolve it quickly.',
    availability: '20–40 hrs/week',
    availability_flexibility: 'Slightly flexible',
    chronotype: 'Early morning (5am–10am)',
    communication: 'Weekly syncs/check-ins',
    motivations: ['Learning Fast', 'Collaboration'],
    top_motivation: 'Learning Fast',
    roles: ['Operator', 'Generalist'],
    preferred_role: 'I want to keep the team organized',
    team_style: 'We define roles clearly and respect boundaries',
    cofounder_frustration: 'Someone disorganized',
    location: 'Greater Delhi',
    age: '29',
    industries: ['Fintech', 'Health / Bio', 'Education / EdTech']
  }
];

// Expected Matches Analysis:
// 1. Alex Chen (Tech) + Sarah Rodriguez (Non-Tech) - Boston, Full-time
// 2. David Kim (Tech) + Maya Patel (Non-Tech) - Boston, 20-40 hrs
// 3. Arjun Singh (Tech) + Priya Sharma (Non-Tech) - Delhi, Full-time  
// 4. Rahul Verma (Tech) + Aisha Khan (Non-Tech) - Delhi, 20-40 hrs
// 5. Emma Thompson (Neutral) can pair with any technical or non-technical
// 6. Vikram Malhotra (Neutral) can pair with any technical or non-technical

export const expectedMatches = [
  {
    pair: ['boston-tech-1', 'boston-nontech-1'],
    reason: 'Boston location, Full-time availability, Technical + Non-technical roles'
  },
  {
    pair: ['boston-tech-2', 'boston-nontech-2'],
    reason: 'Boston location, 20-40 hrs availability, Technical + Non-technical roles'
  },
  {
    pair: ['delhi-tech-1', 'delhi-nontech-1'],
    reason: 'Delhi location, Full-time availability, Technical + Non-technical roles'
  },
  {
    pair: ['delhi-tech-2', 'delhi-nontech-2'],
    reason: 'Delhi location, 20-40 hrs availability, Technical + Non-technical roles'
  }
];

// Helper function to convert to onboarding format
export function convertToOnboardingFormat(user) {
  return {
    openness: user.personality.openness,
    conscientiousness: user.personality.conscientiousness,
    extraversion: user.personality.extraversion,
    agreeableness: user.personality.agreeableness,
    neuroticism: user.personality.neuroticism,
    availability: user.availability,
    availability_flexibility: user.availability_flexibility,
    chronotype: user.chronotype,
    communication: user.communication,
    conflict_style: user.conflictStyle,
    motivations: user.motivations,
    top_motivation: user.top_motivation,
    roles: user.roles,
    preferred_role: user.preferred_role,
    team_style: user.team_style,
    cofounder_frustration: user.cofounder_frustration,
    location: user.location,
    age: user.age,
    industries: user.industries
  };
} 