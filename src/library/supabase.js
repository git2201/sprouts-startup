// supabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://gbffukxjdoxjshslwnh.supabase.co'
const supabaseAnonKey = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdiZmJmdWt4amRveGpoc3dsd25oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyNDA5NzQsImV4cCI6MjA2NjgxNjk3NH0.sS-ikqaih4nZQAa8sSxaRVhNafQXOHsvXXfVqrzlsr4`

export const supabase = createClient(supabaseUrl, supabaseAnonKey);