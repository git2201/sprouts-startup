import { createUserFromOnboarding, calculateMatchScore, getMatchQuality } from './src/utils/matching.js';

const samiraData = {
  openness: 6,
  conscientiousness: 5,
  extraversion: 5,
  agreeableness: 5,
  neuroticism: 3,
  availability: '20–40 hrs/week',
  availability_flexibility: 'Very flexible',
  chronotype: 'Midday (11am–4pm)',
  communication: 'Weekly syncs/check-ins',
  conflict_style: 'I bring it up gently, usually after thinking it through',
  motivations: ['Impact', 'Learning Fast', 'Freedom'],
  top_motivation: 'Impact',
  roles: ['Visionary', 'Operator'],
  preferred_role: 'I want to lead the vision',
  team_style: 'We define roles clearly and respect boundaries',
  cofounder_frustration: 'Someone disorganized'
};

const davidData = {
  openness: 6,
  conscientiousness: 6,
  extraversion: 4,
  agreeableness: 6,
  neuroticism: 2,
  availability: '20–40 hrs/week',
  availability_flexibility: 'Slightly flexible',
  chronotype: 'Midday (11am–4pm)',
  communication: 'Weekly syncs/check-ins',
  conflict_style: 'I prefer to address it directly and resolve it quickly',
  motivations: ['Impact', 'Learning Fast', 'Collaboration'],
  top_motivation: 'Impact',
  roles: ['Technical', 'Designer/UX'],
  preferred_role: 'I want to build the product',
  team_style: 'Flat and collaborative',
  cofounder_frustration: 'Someone too controlling'
};

const samira = createUserFromOnboarding('samira', samiraData);
const david = createUserFromOnboarding('david', davidData);

const result = calculateMatchScore(samira, david);
const quality = getMatchQuality(result.score);

console.log('Samira + David Match Result:');
if (result.disqualified) {
  console.log('❌ Disqualified:', result.reasons.join(', '));
} else {
  console.log(`✅ ${quality.emoji} ${quality.quality}: ${result.score}/100`);
  console.log('Category Breakdown:');
  Object.entries(result.categoryScores).forEach(([cat, score]) => {
    console.log(`  ${cat}: ${score}`);
  });
} 