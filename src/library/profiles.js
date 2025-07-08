import { supabase } from './supabase'

// Get user profile from database
export async function getUserProfile(userId) {
  try {
    // Fetch main profile (including motivations, roles, industries as arrays)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return { profile: null, error: error.message };
    }

    // Ensure arrays are properly formatted
    const formattedProfile = {
      ...profile,
      motivations: Array.isArray(profile.motivations) ? profile.motivations : [],
      roles: Array.isArray(profile.roles) ? profile.roles : [],
      industries: Array.isArray(profile.industries) ? profile.industries : []
    };

    return {
      profile: formattedProfile,
      error: null
    };
  } catch (error) {
    console.error('Error fetching profile:', error);
    return { profile: null, error: error.message };
  }
}

// Update user profile in database
export async function updateUserProfile(userId, profileData) {
  try {
    // Ensure arrays are properly formatted for the profiles table
    const profileFields = {
      ...profileData,
      id: userId,
      updated_at: new Date().toISOString(),
      // Ensure these are always arrays, even if empty
      motivations: Array.isArray(profileData.motivations) ? profileData.motivations : [],
      roles: Array.isArray(profileData.roles) ? profileData.roles : [],
      industries: Array.isArray(profileData.industries) ? profileData.industries : []
    };

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(profileFields)
      .select()
      .single();

    if (error) {
      console.error('Error updating profile:', error);
      return { profile: null, error: error.message };
    }

    return { profile, error: null };
  } catch (error) {
    console.error('Error updating profile:', error);
    return { profile: null, error: error.message };
  }
}
