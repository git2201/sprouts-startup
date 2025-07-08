# Sprout Connect Flow Implementation

This document describes the new Connect button flow implementation for the cofounder matching platform.

## 🔄 New Connect Flow Overview

### Flow Steps:
1. **User A clicks "Connect"** → Button shows loading, then "Waiting for partner..."
2. **Database update** → Saves that User A has requested to connect with User B
3. **Email notification** → Sends email to User B with connection request
4. **User B clicks "Connect"** → Both users have now connected
5. **Payment flow** → Both users are prompted to pay $25 each using the Stripe Buy Button
6. **Contact reveal** → After both payments, email addresses are revealed

## 🗄️ Database Schema

### New Table: `connections`
```sql
create table public.connections (
  id uuid primary key default gen_random_uuid(),
  user_a_id uuid references auth.users(id) on delete cascade,
  user_b_id uuid references auth.users(id) on delete cascade,
  user_a_connected boolean default false,
  user_b_connected boolean default false,
  user_a_paid boolean default false,
  user_b_paid boolean default false,
  user_a_payment_intent_id text,
  user_b_payment_intent_id text,
  status text default 'pending', -- 'pending', 'both_connected', 'both_paid', 'completed'
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_a_id, user_b_id)
);
```

## 🚀 Setup Instructions

### 1. Database Setup
Run the SQL commands in `connections_schema.sql` in your Supabase database:

```bash
# In Supabase SQL editor
# Copy and paste the contents of connections_schema.sql
```

### 2. Frontend Setup
The frontend changes are already implemented. Key files:
- `src/library/connections.js` - Connection management functions
- `src/library/payments.js` - Payment handling
- `src/components/ConnectionStatus.jsx` - Dynamic button states
- `src/components/PaymentModal.jsx` - Payment modal (Stripe Buy Button only)
- `src/components/Dashboard.jsx` - Updated with new flow

### 3. Backend Setup (Optional - for production)
For production, you'll need to set up the Express server:

```bash
# Install server dependencies
cd /path/to/your/project
cp server-package.json package.json
npm install

# Set up environment variables
cp .env.example .env
# Add your Stripe keys to .env

# Start the server
npm run dev
```

### 4. Environment Variables
Create a `.env` file in your project root:

```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Supabase Configuration (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔧 Development Mode

For development, the app uses only the Stripe Buy Button for payment. Mock payment and Stripe Checkout are no longer supported.

## 📧 Email Integration

The current implementation includes a placeholder email function in `src/library/connections.js`. For production, you'll need to integrate with an email service:

### Options:
1. **SendGrid**: Popular email service
2. **Mailgun**: Another popular option
3. **Supabase Edge Functions**: Use Supabase's built-in email functions
4. **Resend**: Modern email API

### Example with SendGrid:
```javascript
// In src/library/connections.js
import sgMail from '@sendgrid/mail';
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
```

## 🎯 Button States

The Connect button now shows different states:

1. **"Connect"** - No connection exists
2. **"Connecting..."** - Loading state while processing
3. **"Waiting for [Name]..."** - Current user connected, waiting for other user
4. **"Complete Payment ($25)"** - Both connected, payment required
5. **"Waiting for [Name] to pay"** - Current user paid, waiting for other user
6. **"✓ Connected"** - Both users paid, connection complete

## 🔒 Security Considerations

1. **Row Level Security**: The connections table has RLS policies
2. **Payment Verification**: Always verify payments on the backend
3. **Email Validation**: Validate email addresses before sending
4. **Rate Limiting**: Consider adding rate limiting for connection requests

## 🧪 Testing

### Test Scenarios:
1. **Single Connection**: User A connects, verify email sent to User B
2. **Mutual Connection**: User B also connects, verify payment modal appears
3. **Payment Flow**: Test both mock and real payment flows
4. **Error Handling**: Test network errors, payment failures, etc.

### Manual Testing Steps:
1. Create two test accounts
2. Complete onboarding for both
3. Verify they appear as matches
4. Test the connection flow end-to-end

## 🚀 Production Deployment

### Frontend:
- Build and deploy your React app as usual
- Ensure environment variables are set

### Backend:
- Deploy the Express server to your preferred platform (Heroku, Vercel, etc.)
- Set up Stripe webhooks to point to your production URL
- Configure email service integration

### Database:
- Ensure the connections table is created in production Supabase
- Verify RLS policies are in place

## 📝 Future Enhancements

1. **Real-time Updates**: Use Supabase real-time subscriptions for live status updates
2. **Push Notifications**: Add push notifications for connection requests
3. **Analytics**: Track connection success rates and payment conversions
4. **Refund Policy**: Implement refund handling for failed connections
5. **Contact Information**: Add more contact methods beyond email

## 🐛 Troubleshooting

### Common Issues:
1. **Connection not saving**: Check RLS policies
2. **Payment modal not showing**: Verify connection status logic
3. **Email not sending**: Check email service configuration
4. **Stripe errors**: Verify API keys and webhook configuration

### Debug Tips:
- Check browser console for errors
- Verify database records in Supabase dashboard
- Test with Stripe Buy Button first
- Use Stripe test mode for development 