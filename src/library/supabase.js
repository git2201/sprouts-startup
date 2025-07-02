// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl='https://tfttiibgencwymjjkmtu.supabase.co'
const supabaseAnonKey='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmdHRpaWJnZW5jd3ltamprbXR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0NjkzNjIsImV4cCI6MjA2NzA0NTM2Mn0.2NcVZLZwMcMPRL6u3XnLY85bMl-7IsvvVh-xu-m0MmU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfiles() {
  const { data, error } = await supabase
  .from('profiles')
  .select('*');

console.log('Profile data:', data);
console.log('Profile error:', error);

}
testProfiles();