const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_secret_key_here');
const { sendConnectionEmail } = require('./sendgrid-email');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
}); 