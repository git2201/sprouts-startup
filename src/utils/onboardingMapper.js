// utils/onboardingMapper.js
// Function to map onboarding form data to database fields

export function mapOnboardingDataToProfile(formData) {
  return {
    // Personality traits (Big Five) - direct mapping
    openness: formData.openness,
    conscientiousness: formData.conscientiousness,
    extraversion: formData.extraversion,
    agreeableness: formData.agreeableness,
    neuroticism: formData.neuroticism,
    
    // Demographics
    age: formData.age ? parseInt(formData.age) : null,
    location: formData.location,
    
    // Availability and work style
    availability: mapAvailabilityValue(formData.availability),
    availability_flexibility: mapFlexibilityValue(formData.availability_flexibility),
    chronotype: mapChronotypeValue(formData.chronotype),
    communication: mapCommunicationValue(formData.communication),
    
    // Conflict and team preferences
    conflict_style: mapConflictStyleValue(formData.conflict_style),
    team_style: formData.team_style,
    cofounder_frustration: formData.cofounder_frustration,
    
    // Motivations
    motivations: Array.isArray(formData.motivations) ? formData.motivations : [],
    top_motivation: formData.top_motivation,
    exit_scenario: formData.exit_scenario,
    
    // Skills and roles
    roles: Array.isArray(formData.roles) ? formData.roles : [],
    industries: Array.isArray(formData.industries) ? formData.industries : [],
    preferred_role: formData.preferred_role,
    
    // Additional fields that the app expects
    cofounder_preference: formData.cofounder_preference || 'Not specified',
    startup_stage: formData.startupStage || formData.startup_stage || 'Not specified',
    work_style: formData.work_style || formData.workStyle || 'Not specified',
    motivation: formData.motivation || formData.top_motivation || 'Not specified',
    role: formData.role || (Array.isArray(formData.roles) && formData.roles.length > 0 ? formData.roles[0] : 'Not specified'),
    
    // System fields
    updated_at: new Date().toISOString()
  };
}

// Helper functions to map onboarding form values to database values
function mapAvailabilityValue(availability) {
  const mapping = {
    'Nights/weekends only': 'nights_weekends',
    '10—20 hrs/week': '10_20',
    '20—40 hrs/week': '20_40',
    'Full-time': 'full_time',
    'Depends on the match': 'depends'
  };
  return mapping[availability] || availability;
}

function mapFlexibilityValue(flexibility) {
  const mapping = {
    'Very rigid': 'rigid',
    'Slightly flexible': 'slightly_flexible',
    'Very flexible': 'very_flexible'
  };
  return mapping[flexibility] || flexibility;
}

function mapChronotypeValue(chronotype) {
  const mapping = {
    'Early morning (5am—10am)': 'morning',
    'Midday (11am—4pm)': 'midday',
    'Evening/Night (5pm—2am)': 'night',
    'Flexible throughout the day': 'flexible'
  };
  return mapping[chronotype] || chronotype;
}

function mapCommunicationValue(communication) {
  const mapping = {
    'Async-first': 'async',
    'Weekly syncs/check-ins': 'weekly_sync',
    'Daily check-ins and active messaging': 'daily_checkin',
    'Depends on the team': 'depends'
  };
  return mapping[communication] || communication;
}

function mapConflictStyleValue(conflictStyle) {
  const mapping = {
    'I prefer to address it directly and resolve it quickly.': 'direct',
    'I bring it up gently, usually after thinking it through.': 'indirect',
    'I try to avoid confrontation and hope it resolves.': 'avoidant',
    'I usually internalize it unless it becomes urgent.': 'internalize'
  };
  return mapping[conflictStyle] || conflictStyle;
}
