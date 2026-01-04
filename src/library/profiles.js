import { supabase } from './supabase'

// Get user profile from database
export async function getUserProfile(userId) {
  try {
    // Try to get session with multiple attempts for robustness
    let session = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!session && attempts < maxAttempts) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
      }
      
      if (sessionData?.session) {
        session = sessionData.session;
        break;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`Session not found in getUserProfile, attempt ${attempts}/${maxAttempts}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log('Fetching profile for user:', userId);
    
    // Fetch main profile (including motivations, roles, industries as arrays)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      // If the profile doesn't exist, that's okay - return null profile
      if (error.code === 'PGRST116') {
        return { profile: null, error: null };
      }
      return { profile: null, error: error.message };
    }

    // Ensure arrays are properly formatted
    const formattedProfile = {
      ...profile,
      motivations: Array.isArray(profile.motivations) ? profile.motivations : [],
      roles: Array.isArray(profile.roles) ? profile.roles : [],
      industries: Array.isArray(profile.industries) ? profile.industries : []
    };

    console.log('Profile fetched successfully:', formattedProfile);

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
    // Try to get session with multiple attempts
    let session = null;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!session && attempts < maxAttempts) {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
      }
      
      if (sessionData?.session) {
        session = sessionData.session;
        break;
      }
      
      attempts++;
      if (attempts < maxAttempts) {
        console.log(`Session not found, attempt ${attempts}/${maxAttempts}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    if (!session) {
      console.error('No active session found after multiple attempts');
      return { profile: null, error: 'No active authentication session. Please try logging in again.' };
    }

    console.log('Updating profile for user:', userId);
    console.log('Profile data:', profileData);
    console.log('Current session user:', session.user?.id);

    // Verify the session user matches the profile user
    if (session.user?.id !== userId) {
      console.error('Session user mismatch:', session.user?.id, 'vs', userId);
      return { profile: null, error: 'User authentication mismatch' };
    }

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

    // Remove any undefined values
    Object.keys(profileFields).forEach(key => {
      if (profileFields[key] === undefined) {
        delete profileFields[key];
      }
    });

    console.log('Formatted profile fields:', profileFields);

    // Try to update first (if profile exists)
    const { data: updateData, error: updateError } = await supabase
      .from('profiles')
      .update(profileFields)
      .eq('id', userId)
      .select()
      .single();

    if (updateError && updateError.code === 'PGRST116') {
      // Profile doesn't exist, try to insert
      console.log('Profile not found, inserting new profile');
      
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert(profileFields)
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting profile:', insertError);
        return { profile: null, error: insertError.message };
      }

      console.log('Profile inserted successfully:', insertData);
      return { profile: insertData, error: null };
    } else if (updateError) {
      console.error('Error updating profile:', updateError);
      return { profile: null, error: updateError.message };
    }

    console.log('Profile updated successfully:', updateData);
    return { profile: updateData, error: null };

  } catch (error) {
    console.error('Error updating profile:', error);
    return { profile: null, error: error.message };
  }
}
