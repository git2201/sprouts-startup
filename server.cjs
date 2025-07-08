const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here');
const { sendConnectionEmail } = require('./sendgrid-email');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration
const REFUND_TIMEOUT_MINUTES = 1; // Set to 1 minute for testing
const REFUND_CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

// In-memory storage for refund jobs (in production, use a proper job queue)
const refundJobs = new Map();

// Create checkout session endpoint
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { connectionId, userId, amount, description, successUrl, cancelUrl } = req.body;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Sprout Connection Fee',
              description: description || 'Connection fee for cofounder match',
            },
            unit_amount: amount || 2500, // $25.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl || `${req.headers.origin}/dashboard?payment=success&connection=${connectionId}`,
      cancel_url: cancelUrl || `${req.headers.origin}/dashboard?payment=cancelled&connection=${connectionId}`,
      metadata: {
        connectionId,
        userId,
      },
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Refund endpoint
app.post('/refund-payment', async (req, res) => {
  try {
    const { connectionId, userId, paymentIntentId, reason } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID is required' });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer',
      metadata: {
        connectionId,
        userId,
        reason: reason || 'partner_did_not_pay'
      }
    });

    console.log(`Refund created: ${refund.id} for payment ${paymentIntentId}`);

    // Update database to mark as refunded
    // Note: In production, you'd want to use a proper database connection
    // For now, we'll just return success and let the frontend handle the update

    res.json({ 
      success: true, 
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status
    });
  } catch (error) {
    console.error('Error creating refund:', error);
    res.status(500).json({ error: error.message });
  }
});

// Manual refund check endpoint (for testing)
app.post('/check-refunds', async (req, res) => {
  try {
    await checkForRefunds();
    res.json({ success: true, message: 'Refund check completed' });
  } catch (error) {
    console.error('Error checking refunds:', error);
    res.status(500).json({ error: error.message });
  }
});

// Function to check for connections that need refunds
async function checkForRefunds() {
  try {
    console.log('Checking for connections that need refunds...');
    
    // In a real implementation, you would query your database here
    // For now, we'll use a placeholder that logs the check
    const now = new Date();
    const refundThreshold = new Date(now.getTime() - (REFUND_TIMEOUT_MINUTES * 60 * 1000));
    
    console.log(`Checking for payments made before: ${refundThreshold.toISOString()}`);
    console.log(`Current time: ${now.toISOString()}`);
    
    // This is where you would query your database for connections where:
    // 1. One user has paid but the other hasn't
    // 2. The payment was made more than REFUND_TIMEOUT_MINUTES ago
    // 3. No refund has been processed yet
    
    // Example query (you'll need to implement this with your actual database):
    /*
    const connectionsToRefund = await db.query(`
      SELECT * FROM connections 
      WHERE (user_a_paid = true AND user_b_paid = false AND user_a_payment_timestamp < $1 AND user_a_refunded = false)
         OR (user_b_paid = true AND user_a_paid = false AND user_b_payment_timestamp < $1 AND user_b_refunded = false)
    `, [refundThreshold]);
    */
    
    console.log('Refund check completed');
  } catch (error) {
    console.error('Error in refund check:', error);
  }
}

// Start background refund checker
function startRefundChecker() {
  setInterval(checkForRefunds, REFUND_CHECK_INTERVAL_MS);
  console.log(`Refund checker started. Checking every ${REFUND_CHECK_INTERVAL_MS / 1000} seconds.`);
}

// Webhook endpoint for handling successful payments
app.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here';

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment completed for session:', session.id);
      // Here you would update your database to mark the payment as completed
      // You can access session.metadata.connectionId and session.metadata.userId
      break;
    case 'charge.refunded':
      const refund = event.data.object;
      console.log('Refund completed:', refund.id);
      // Here you would update your database to mark the refund as completed
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/send-connection-email', async (req, res) => {
  const { targetEmail, targetName, requesterName, partnerEmail } = req.body;
  const result = await sendConnectionEmail(targetEmail, targetName, requesterName, partnerEmail);
  if (result.success) {
    res.json({ success: true });
  } else {
    res.status(500).json({ error: result.error });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Refund timeout set to ${REFUND_TIMEOUT_MINUTES} minutes`);
  
  // Start the refund checker
  startRefundChecker();
}); 