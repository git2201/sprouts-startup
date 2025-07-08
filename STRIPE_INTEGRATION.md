# Stripe Integration Guide

This document explains the Stripe integration that has been implemented in your Sprout startup application.

## 🎯 What's Been Implemented

### 1. Stripe Buy Button Component (`src/components/StripeBuyButton.jsx`)
- A React component that integrates your specific Stripe buy button
- Uses your provided buy button ID: `buy_btn_1RgtAXAXmD3Ea86MwJnoMH5y`
- Uses your provided publishable key: `pk_live_3vHUVaZnTnJsomdqF8CUY1qB`
- Handles payment success, error, and cancellation events

### 2. Updated Payment Modal (`src/components/PaymentModal.jsx`)
- Now uses only the Stripe Buy Button for payments

### 3. Global Stripe Script Loading
- Added Stripe buy button script to `index.html`
- Ensures the script is available throughout the application

### 4. Test Component (`src/components/StripeTest.jsx`)
- A standalone test page to verify the Stripe integration
- Accessible at `/stripe-test` route

## 🚀 How to Use

### Testing the Integration
1. Start your development server: `npm run dev`
2. Navigate to `http://localhost:5173/stripe-test`
3. Click the Stripe buy button to test the payment flow
4. Check the browser console for payment events

### In Your Application
The Stripe buy button is now integrated into your existing payment flow:
1. When users complete a connection, they'll see the payment modal
2. The Stripe buy button will be shown
3. Users can click the buy button to complete their payment
4. Payment success/error events are handled automatically

## 🔧 Configuration

### Environment Variables (Optional)
If you want to use environment variables instead of hardcoded values, create a `.env` file:

```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_3vHUVaZnTnJsomdqF8CUY1qB
STRIPE_SECRET_KEY=your_stripe_secret_key_here
# Note: STRIPE_WEBHOOK_SECRET is only needed if you set up backend webhooks

# Supabase Configuration (already configured)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important Notes:**
- `STRIPE_WEBHOOK_SECRET` is only required if you're setting up a backend server with webhooks
- For frontend-only integration (what we've implemented), you only need the publishable key
- The secret key is only needed on your backend server, never in the frontend

### Updating Stripe Configuration
To change your Stripe buy button or publishable key:

1. **Update the buy button ID**: Edit `src/components/StripeBuyButton.jsx` line 29
2. **Update the publishable key**: Edit `src/components/StripeBuyButton.jsx` line 30
3. **Update the script**: Edit `index.html` if you need a different Stripe script

## 📋 Payment Flow

1. **User clicks "Connect"** → Connection is created in database
2. **Both users connect** → Payment modal appears
3. **User clicks buy button** → Stripe checkout opens
4. **Payment completed** → Success callback updates connection status
5. **Contact information revealed** → Both users can see each other's details

## 🔍 Event Handling

The Stripe buy button component listens for these events:

- `stripe-buy-button:checkout-completed` - Payment successful
- `stripe-buy-button:checkout-cancelled` - User cancelled payment
- `stripe-buy-button:checkout-error` - Payment failed

## 🛠️ Development vs Production

### Development
- Use the test route `/stripe-test` to verify integration
- Console logging enabled for debugging

### Production
- Ensure your Stripe account is properly configured
- Set up webhooks for payment confirmation
- Test with real payment methods before going live

## 🐛 Troubleshooting

### Common Issues

1. **Buy button not appearing**
   - Check browser console for script loading errors
   - Verify the Stripe script is loaded in `index.html`

2. **Payment events not firing**
   - Check browser console for JavaScript errors
   - Verify the event listeners are properly attached

3. **Payment success not updating database**
   - Check the `handleStripeBuyButtonSuccess` function
   - Verify the connection update logic

### Debug Steps
1. Open browser developer tools
2. Navigate to `/stripe-test`
3. Check console for any errors
4. Test the buy button and monitor events
5. Verify payment success callback is triggered

## 📞 Support

If you encounter issues with the Stripe integration:

1. Check the [Stripe Buy Button documentation](https://stripe.com/docs/payments/buy-button)
2. Verify your Stripe account settings
3. Test with Stripe's test mode first
4. Check the browser console for detailed error messages

## 🔄 Next Steps

1. **Test the integration** using the `/stripe-test` route
2. **Configure webhooks** for production payment handling
3. **Set up proper error handling** for failed payments
4. **Add payment analytics** to track conversion rates
5. **Implement refund handling** if needed 