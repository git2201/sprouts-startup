import { supabase } from './supabase'

// Get user profile from database
export async function getUserProfile(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return { profile: null, error: error.message }
    }

    return { profile, error: null }
  } catch (error) {
    console.error('Error fetching profile:', error)
    return { profile: null, error: error.message }
  }
}

// Update user profile in database
export async function updateUserProfile(userId, profileData) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error updating profile:', error)
      return { profile: null, error: error.message }
    }

    return { profile, error: null }
  } catch (error) {
    console.error('Error updating profile:', error)
    return { profile: null, error: error.message }
  }
}
