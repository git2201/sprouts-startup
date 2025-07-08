console.log('USING CORRECT CONNECTIONS.JS');
import { supabase } from './supabase'

// Request a connection with another user
export async function requestConnection(userId, targetUserId) {
  try {
    console.log('requestConnection called', { userId, targetUserId });

    // Check if connection already exists
    const { data: existingConnection, error: checkError } = await supabase
      .from('connections')
      .select('*')
      .or(
        `and(user_a_id.eq.${userId},user_b_id.eq.${targetUserId}),and(user_a_id.eq.${targetUserId},user_b_id.eq.${userId})`
      )
      .single();

    console.log('Existing connection:', existingConnection, 'Error:', checkError);

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing connection:', checkError);
      return { success: false, error: checkError.message };
    }

    if (existingConnection) {
      // Update existing connection
      const isUserA = String(existingConnection.user_a_id).trim() === String(userId).trim();
      const updateData = isUserA 
        ? { user_a_connected: true }
        : { user_b_connected: true };

      const { data: updatedConnection, error: updateError } = await supabase
        .from('connections')
        .update(updateData)
        .eq('id', existingConnection.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating connection:', updateError);
        return { success: false, error: updateError.message };
      }

      // Check if both users have connected
      if (updatedConnection.user_a_connected && updatedConnection.user_b_connected) {
        // Update status to both_connected
        await supabase
          .from('connections')
          .update({ status: 'both_connected' })
          .eq('id', existingConnection.id);
      }

      return { success: true, connection: updatedConnection };
    } else {
      // Create new connection
      const { data: newConnection, error: insertError } = await supabase
        .from('connections')
        .insert({
          user_a_id: userId,
          user_b_id: targetUserId,
          user_a_connected: true
        })
        .select()
        .single();

      console.log('Insert result:', newConnection, 'Error:', insertError);

      if (insertError) {
        console.error('Error creating connection:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, connection: newConnection };
    }
  } catch (error) {
    console.error('Error requesting connection:', error);
    return { success: false, error: error.message };
  }
}

// Get connection status for a user
export async function getConnectionStatus(userId, targetUserId) {
  try {
    const { data: connection, error } = await supabase
      .from('connections')
      .select('*')
      .or(
        `and(user_a_id.eq.${userId},user_b_id.eq.${targetUserId}),and(user_a_id.eq.${targetUserId},user_b_id.eq.${userId})`
      )
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching connection status:', error);
      return { connection: null, error: error.message };
    }

    return { connection, error: null };
  } catch (error) {
    console.error('Error getting connection status:', error);
    return { connection: null, error: error.message };
  }
}

// Get all connections for a user
export async function getUserConnections(userId) {
  try {
    const { data: connections, error } = await supabase
      .from('connections')
      .select(`
        *,
        user_a:profiles!connections_user_a_id_fkey(id, name, email, avatar),
        user_b:profiles!connections_user_b_id_fkey(id, name, email, avatar)
      `)
      .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

    if (error) {
      console.error('Error fetching user connections:', error);
      return { connections: [], error: error.message };
    }

    return { connections, error: null };
  } catch (error) {
    console.error('Error getting user connections:', error);
    return { connections: [], error: error.message };
  }
}

// Update payment status
export async function updatePaymentStatus(connectionId, userId, paymentIntentId, paid = true) {
  console.log('updatePaymentStatus called', { connectionId, userId, paymentIntentId, paid });
  try {
    const { data: connection, error } = await supabase
      .from('connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    console.log('Fetched connection for payment update:', connection, 'Error:', error);

    if (error) {
      console.error('Error fetching connection for payment update:', error);
      return { success: false, error: error.message };
    }

    const isUserA = String(connection.user_a_id).trim() === String(userId).trim();
    const updateData = isUserA 
      ? { 
          user_a_paid: paid,
          user_a_payment_intent_id: paymentIntentId
        }
      : { 
          user_b_paid: paid,
          user_b_payment_intent_id: paymentIntentId
        };

    const { data: updatedConnection, error: updateError } = await supabase
      .from('connections')
      .update(updateData)
      .eq('id', connectionId)
      .select()
      .single();

    console.log('Payment update result:', updatedConnection, 'Error:', updateError);

    if (updateError) {
      console.error('Error updating payment status:', updateError);
      return { success: false, error: updateError.message };
    }

    // Check if both users have paid
    if (updatedConnection.user_a_paid && updatedConnection.user_b_paid) {
      await supabase
        .from('connections')
        .update({ status: 'completed' })
        .eq('id', connectionId);
    }

    return { success: true, connection: updatedConnection };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { success: false, error: error.message };
  }
}

// Send email notification (calls backend API to send real email)
export async function sendConnectionEmail(targetEmail, targetName, requesterName, partnerEmail) {
  try {
    const response = await fetch('/api/send-connection-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetEmail, targetName, requesterName, partnerEmail })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send email');
    }
    return { success: true };
  } catch (error) {
    console.error('Error sending connection email:', error);
    return { success: false, error: error.message };
  }
}

// Get user profile by ID
export async function getUserProfileById(userId) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return { profile: null, error: error.message };
    }

    return { profile, error: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { profile: null, error: error.message };
  }
}

// Delete a connection between two users
export async function deleteConnection(userId, targetUserId) {
  try {
    // Find the connection
    const { data: connection, error } = await supabase
      .from('connections')
      .select('id')
      .or(
        `and(user_a_id.eq.${userId},user_b_id.eq.${targetUserId}),and(user_a_id.eq.${targetUserId},user_b_id.eq.${userId})`
      )
      .single();
    if (error && error.code !== 'PGRST116') {
      console.error('Error finding connection to delete:', error);
      return { success: false, error: error.message };
    }
    if (!connection) {
      return { success: false, error: 'No connection found' };
    }
    // Delete the connection
    const { error: deleteError } = await supabase
      .from('connections')
      .delete()
      .eq('id', connection.id);
    if (deleteError) {
      console.error('Error deleting connection:', deleteError);
      return { success: false, error: deleteError.message };
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting connection:', error);
    return { success: false, error: error.message };
  }
} 