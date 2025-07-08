import { supabase } from './src/library/supabase.js';

async function printProfiles() {
  // You may need to adjust the filter if the names are not unique
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .in('name', ['Samira', 'David']);

  if (error) {
    console.error('Error fetching profiles:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No profiles found for Samira or David.');
    return;
  }

  data.forEach(profile => {
    console.log(`\nProfile: ${profile.name}`);
    console.log(JSON.stringify(profile, null, 2));
  });
}

printProfiles(); 