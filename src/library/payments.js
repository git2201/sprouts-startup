// Payment service for handling Stripe checkout
// Note: This is a frontend implementation. In production, you'd want to handle
// payment intents on the backend for security.

// Initialize Stripe (you'll need to add your Stripe publishable key)
let stripe = null;

export async function initializeStripe() {
  if (typeof window !== 'undefined' && window.Stripe) {
    // Stripe is already loaded
    stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');
  } else {
    // Load Stripe script
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.stripe.com/v3/';
      script.onload = () => {
        stripe = window.Stripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_key_here');
        resolve(stripe);
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return stripe;
}

// Handle payment success
export async function handlePaymentSuccess(connectionId, userId, paymentIntentId) {
  try {
    // Update the connection with payment status
    const { updatePaymentStatus } = await import('./connections.js');
    const result = await updatePaymentStatus(connectionId, userId, paymentIntentId, true);
    
    if (!result.success) {
      throw new Error(result.error);
    }

    return { success: true };
  } catch (error) {
    console.error('Error handling payment success:', error);
    return { success: false, error: error.message };
  }
}

// Check if payment is required for a connection
export function isPaymentRequired(connection) {
  return connection && 
         connection.user_a_connected && 
         connection.user_b_connected && 
         connection.status === 'both_connected' &&
         (!connection.user_a_paid || !connection.user_b_paid);
}

// Get payment status for current user
export function getCurrentUserPaymentStatus(connection, currentUserId) {
  if (!connection) return { hasPaid: false, needsToPay: false };
  
  const isUserA = connection.user_a_id === currentUserId;
  const hasPaid = isUserA ? connection.user_a_paid : connection.user_b_paid;
  const needsToPay = isPaymentRequired(connection) && !hasPaid;
  
  return { hasPaid, needsToPay };
} 