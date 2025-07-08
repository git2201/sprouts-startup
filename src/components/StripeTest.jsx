import React from 'react';
import StripeBuyButton from './StripeBuyButton.jsx';

const StripeTest = () => {
  const handlePaymentSuccess = (result) => {
    console.log('Payment successful:', result);
    alert('Payment successful! Check console for details.');
  };

  const handlePaymentError = (error) => {
    console.error('Payment error:', error);
    alert(`Payment failed: ${error}`);
  };

  const handleClose = () => {
    console.log('Payment modal closed');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <div className="text-4xl mb-4">🧪</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Stripe Integration Test
          </h2>
          <p className="text-gray-600 mb-6">
            This is a test page to verify the Stripe buy button integration works correctly.
          </p>
          
          <div className="bg-gray-50 rounded-2xl p-4 mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Test Payment</span>
              <span className="font-semibold">$25.00</span>
            </div>
            <div className="text-sm text-gray-500">
              This will use your configured Stripe buy button
            </div>
          </div>

          <StripeBuyButton
            connectionId="test-connection-123"
            userId="test-user-456"
            targetUserName="Test User"
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentError={handlePaymentError}
            onClose={handleClose}
          />

          <div className="mt-6 text-xs text-gray-500">
            <p>🔒 This is a test environment</p>
            <p>💳 Check browser console for payment events</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeTest; 