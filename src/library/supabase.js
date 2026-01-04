// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl='https://idznifcqttallxqymowt.supabase.co'
const supabaseAnonKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkem5pZmNxdHRhbGx4cXltb3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MzUwMzcsImV4cCI6MjA3MTIxMTAzN30.VvAjvYtZELHyYkEgpPy_LHHa6KvMVX0dAFvTprLTuM8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Temporary test function to check profiles table
export async function testProfilesTable() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    console.log('Profiles table test:');
    console.log('Data:', data);
    console.log('Error:', error);
    
    if (data && data.length > 0) {
      console.log('Sample profile columns:', Object.keys(data[0]));
    }
  } catch (err) {
    console.error('Test error:', err);
  }
}
