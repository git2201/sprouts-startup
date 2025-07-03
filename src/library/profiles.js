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
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Supabase session user id:', user?.id);
    console.log('userId passed to updateUserProfile:', userId);
    console.log('profileData.id:', profileData.id);

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        ...profileData,
        id: userId,
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
