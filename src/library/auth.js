import { supabase } from './supabase.js'

// Sign up with email and password
export async function signUp(email, password, metadata = {}) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })

    if (error) {
      return { user: null, error: error.message }
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Sign in with email and password
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { user: null, error: error.message }
    }

    return { user: data.user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Sign out
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) {
      return { error: error.message }
    }
    return { error: null }
  } catch (error) {
    return { error: error.message }
  }
}

// Get current user
export async function getCurrentUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      return { user: null, error: error.message }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: error.message }
  }
}

// Listen to auth state changes
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback)
}

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
