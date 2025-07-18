import { fakeUsers, convertToOnboardingFormat } from './fake-users-for-testing.js';
import { supabase } from './src/library/supabase.js';

// Script to seed fake users into the database
async function seedFakeUsers() {
  console.log('🌱 SEEDING FAKE USERS INTO DATABASE\n');
  console.log('='.repeat(80));
  
  const results = {
    successful: 0,
    failed: 0,
    errors: []
  };
  
  for (const user of fakeUsers) {
    try {
      console.log(`\n📝 Creating user: ${user.name}`);
      
      // Convert to onboarding format
      const onboardingData = convertToOnboardingFormat(user);
      
      // Create the profile data for database insertion
      const profileData = {
        id: user.id, // Use the fake ID as the profile ID
        email: user.email,
        name: user.name,
        // Personality traits
        openness: onboardingData.openness,
        conscientiousness: onboardingData.conscientiousness,
        extraversion: onboardingData.extraversion,
        agreeableness: onboardingData.agreeableness,
        neuroticism: onboardingData.neuroticism,
        // Availability and work style
        availability: onboardingData.availability,
        availability_flexibility: onboardingData.availability_flexibility,
        chronotype: onboardingData.chronotype,
        communication: onboardingData.communication,
        conflict_style: onboardingData.conflict_style,
        // Motivations
        motivations: onboardingData.motivations,
        top_motivation: onboardingData.top_motivation,
        // Roles and preferences
        roles: onboardingData.roles,
        preferred_role: onboardingData.preferred_role,
        team_style: onboardingData.team_style,
        cofounder_frustration: onboardingData.cofounder_frustration,
        // Demographics
        location: onboardingData.location,
        age: parseInt(onboardingData.age),
        industries: onboardingData.industries,
        // Metadata
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Insert into profiles table
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData]);
      
      if (error) {
        console.log(`   ❌ Error: ${error.message}`);
        results.failed++;
        results.errors.push({ user: user.name, error: error.message });
      } else {
        console.log(`   ✅ Successfully created profile`);
        results.successful++;
      }
      
    } catch (error) {
      console.log(`   ❌ Exception: ${error.message}`);
      results.failed++;
      results.errors.push({ user: user.name, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 SEEDING SUMMARY:');
  console.log('─'.repeat(80));
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n🚨 ERRORS:');
    results.errors.forEach(({ user, error }) => {
      console.log(`   • ${user}: ${error}`);
    });
  }
  
  if (results.successful > 0) {
    console.log(`\n🎉 Successfully seeded ${results.successful} fake users!`);
    console.log('You can now test the matching system with these users.');
  }
  
  return results;
}

// Function to clean up fake users (for testing)
async function cleanupFakeUsers() {
  console.log('🧹 CLEANING UP FAKE USERS\n');
  console.log('='.repeat(80));
  
  const fakeUserIds = fakeUsers.map(user => user.id);
  
  const { data, error } = await supabase
    .from('profiles')
    .delete()
    .in('id', fakeUserIds);
  
  if (error) {
    console.log(`❌ Error cleaning up: ${error.message}`);
    return { success: false, error: error.message };
  } else {
    console.log(`✅ Successfully cleaned up ${fakeUserIds.length} fake users`);
    return { success: true, count: fakeUserIds.length };
  }
}

// Function to list all fake users in database
async function listFakeUsers() {
  console.log('📋 LISTING FAKE USERS IN DATABASE\n');
  console.log('='.repeat(80));
  
  const fakeUserIds = fakeUsers.map(user => user.id);
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('id', fakeUserIds);
  
  if (error) {
    console.log(`❌ Error listing users: ${error.message}`);
    return [];
  }
  
  console.log(`Found ${data.length} fake users in database:`);
  data.forEach(user => {
    console.log(`   • ${user.name} (${user.roles?.join(', ')}) - ${user.location}`);
  });
  
  return data;
}

// Export functions for use
export { seedFakeUsers, cleanupFakeUsers, listFakeUsers };

// If running directly, seed the users
if (import.meta.url === `file://${process.argv[1]}`) {
  seedFakeUsers();
} 