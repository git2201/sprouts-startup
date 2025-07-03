// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl='https://tfttiibgencwymjjkmtu.supabase.co'
const supabaseAnonKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdHRpaWJnZW5jd3ltamprbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjkzNjIsImV4cCI6MjA2NzA0NTM2Mn0.2NcVZLZwMcMPRL6u3XnLY85bMl-7IsvvVh-xu-m0MmU'

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